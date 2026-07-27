/**
 * Uploads the Build 97 review package ZIP to Replit object storage
 * and prints a signed download URL valid for 7 days.
 */
import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";

const SIDECAR = "http://127.0.0.1:1106";
const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID!;
const ZIP_PATH = path.resolve(__dirname, "../../docs/product/releases/MWM_Build97_ReviewPackage.zip");
const OBJECT_NAME = "review-packages/MWM_Build97_ReviewPackage.zip";

async function main() {
  if (!BUCKET_ID) {
    console.error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    process.exit(1);
  }

  const storage = new Storage({
    credentials: {
      audience: "replit",
      subject_token_type: "access_token",
      token_url: `${SIDECAR}/token`,
      type: "external_account",
      credential_source: {
        url: `${SIDECAR}/credential`,
        format: { type: "json", subject_token_field_name: "access_token" },
      },
      universe_domain: "googleapis.com",
    } as any,
    projectId: "",
  });

  const bucket = storage.bucket(BUCKET_ID);
  const file = bucket.file(OBJECT_NAME);

  console.log("Uploading ZIP to object storage...");
  await bucket.upload(ZIP_PATH, {
    destination: OBJECT_NAME,
    metadata: { contentType: "application/zip" },
  });
  console.log("Upload complete.");

  // Generate a signed URL valid for 7 days
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  console.log("\n=== DOWNLOAD URL (valid 7 days) ===");
  console.log(url);
  console.log("===================================\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
