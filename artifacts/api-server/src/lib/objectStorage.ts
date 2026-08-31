import { Storage, File } from "@google-cloud/storage";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export type ObjectStorageCredentialMode = "adc" | "service_account_json" | "replit_sidecar";

export class ObjectStorageConfigurationError extends Error {
  readonly code = "OBJECT_STORAGE_CONFIGURATION_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "ObjectStorageConfigurationError";
  }
}

let _client: Storage | null = null;
let _clientError: Error | null = null;

export function getObjectStorageCredentialMode(): ObjectStorageCredentialMode {
  const configured = process.env.OBJECT_STORAGE_CREDENTIAL_MODE?.trim().toLowerCase();
  if (configured) {
    if (configured === "adc" || configured === "service_account_json" || configured === "replit_sidecar") {
      return configured;
    }
    throw new ObjectStorageConfigurationError("OBJECT_STORAGE_CREDENTIAL_MODE is not supported.");
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) return "service_account_json";
  if (process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT || process.env.REPLIT_DOMAINS) return "replit_sidecar";
  return "adc";
}

type ServiceAccountCredentials = {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
};

function readServiceAccountCredentials(): ServiceAccountCredentials {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!rawCredentials) {
    throw new ObjectStorageConfigurationError("GOOGLE_SERVICE_ACCOUNT_JSON is required for service-account mode.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawCredentials);
  } catch {
    // Do not include a parser error: it may echo a fragment of the secret value.
    throw new ObjectStorageConfigurationError("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new ObjectStorageConfigurationError("GOOGLE_SERVICE_ACCOUNT_JSON must contain a credential object.");
  }

  const credential = parsed as Record<string, unknown>;
  if (
    credential.type !== "service_account" ||
    typeof credential.client_email !== "string" ||
    !credential.client_email ||
    typeof credential.private_key !== "string" ||
    !credential.private_key
  ) {
    throw new ObjectStorageConfigurationError("GOOGLE_SERVICE_ACCOUNT_JSON is missing required service-account fields.");
  }
  return {
    clientEmail: credential.client_email,
    privateKey: credential.private_key.replace(/\\n/g, "\n"),
    projectId: typeof credential.project_id === "string" && credential.project_id
      ? credential.project_id
      : undefined,
  };
}

function createStorageClient(): Storage {
  const mode = getObjectStorageCredentialMode();
  if (mode === "replit_sidecar") {
    return new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
        universe_domain: "googleapis.com",
      },
      projectId: "",
    });
  }

  if (mode === "service_account_json") {
    const credential = readServiceAccountCredentials();
    return new Storage({
      credentials: {
        client_email: credential.clientEmail,
        private_key: credential.privateKey,
      },
      projectId: credential.projectId ?? process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT,
    });
  }

  // Application Default Credentials supports Railway workload identity and the
  // standard GOOGLE_APPLICATION_CREDENTIALS mounted-file contract.
  return new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT,
  });
}

function getClient(): Storage {
  if (_clientError) throw _clientError;
  if (!_client) {
    try {
      _client = createStorageClient();
    } catch (err: unknown) {
      _clientError = err instanceof Error
        ? err
        : new ObjectStorageConfigurationError("Object storage could not be initialized.");
      throw _clientError;
    }
  }
  return _client;
}

export function getObjectStorageDiagnostics(): { credentialMode: ObjectStorageCredentialMode | "invalid"; configured: boolean } {
  try {
    const credentialMode = getObjectStorageCredentialMode();
    if (credentialMode === "service_account_json") readServiceAccountCredentials();
    return { credentialMode, configured: true };
  } catch {
    return { credentialMode: "invalid", configured: false };
  }
}

export const objectStorageClient: Storage = new Proxy({} as Storage, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as never as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = getClient().bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }

  async downloadObject(file: File, cacheTtlSec: number = 3600): Promise<Response> {
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const isPublic = aclPolicy?.visibility === "public";

    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    const headers: Record<string, string> = {
      "Content-Type": (metadata.contentType as string) || "application/octet-stream",
      "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
    };
    if (metadata.size) {
      headers["Content-Length"] = String(metadata.size);
    }

    return new Response(webStream, { headers });
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = getClient().bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const data = await response.json() as { signed_url: string };
  return data.signed_url;
}
