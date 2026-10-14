export declare const KINFOLK_CONNECTED_APP_CATEGORIES: readonly ["travel", "health", "finance", "everyday"];
export type KinfolkConnectedAppCategory = (typeof KINFOLK_CONNECTED_APP_CATEGORIES)[number];
export declare const KINFOLK_CONNECTED_APP_AUTHORIZATION_MODES: readonly ["oauth", "native_permission", "selected_import", "provider_contract", "unsupported"];
export type KinfolkConnectedAppAuthorizationMode = (typeof KINFOLK_CONNECTED_APP_AUTHORIZATION_MODES)[number];
export declare const KINFOLK_CONNECTED_APP_PERMISSION_STATUSES: readonly ["requested", "authorized", "revoked", "deleted", "unavailable"];
export type KinfolkConnectedAppPermissionStatus = (typeof KINFOLK_CONNECTED_APP_PERMISSION_STATUSES)[number];
/**
 * A consent record is intentionally separate from a provider credential.
 * It records the member's stated purpose and permissions; provider tokens remain
 * encrypted and server-only in the domain-specific connection store.
 */
export declare const kinfolkConnectedAppPermissionsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "kinfolk_connected_app_permissions";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 36;
        }>;
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        appKey: import("drizzle-orm/pg-core").PgColumn<{
            name: "app_key";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 80;
        }>;
        category: import("drizzle-orm/pg-core").PgColumn<{
            name: "category";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "string";
            columnType: "PgVarchar";
            data: "travel" | "health" | "finance" | "everyday";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["travel", "health", "finance", "everyday"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
            $type: "travel" | "health" | "finance" | "everyday";
        }>;
        authorizationMode: import("drizzle-orm/pg-core").PgColumn<{
            name: "authorization_mode";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "string";
            columnType: "PgVarchar";
            data: "oauth" | "native_permission" | "selected_import" | "provider_contract" | "unsupported";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["oauth", "native_permission", "selected_import", "provider_contract", "unsupported"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
            $type: "oauth" | "native_permission" | "selected_import" | "provider_contract" | "unsupported";
        }>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "string";
            columnType: "PgVarchar";
            data: "requested" | "authorized" | "revoked" | "deleted" | "unavailable";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["requested", "authorized", "revoked", "deleted", "unavailable"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
            $type: "requested" | "authorized" | "revoked" | "deleted" | "unavailable";
        }>;
        purpose: import("drizzle-orm/pg-core").PgColumn<{
            name: "purpose";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 160;
        }>;
        dataTypes: import("drizzle-orm/pg-core").PgColumn<{
            name: "data_types";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "json";
            columnType: "PgJsonb";
            data: string[];
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: string[];
        }>;
        scopes: import("drizzle-orm/pg-core").PgColumn<{
            name: "scopes";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "json";
            columnType: "PgJsonb";
            data: string[];
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: string[];
        }>;
        tokenEnvelope: import("drizzle-orm/pg-core").PgColumn<{
            name: "token_envelope";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        grantedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "granted_at";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        revokedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "revoked_at";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        expiresAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "expires_at";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        deletedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "deleted_at";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "kinfolk_connected_app_permissions";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/**
 * A minimal member-scoped permission ledger. It never copies access tokens,
 * provider payloads, imported content, health data, or financial data.
 */
export declare const kinfolkConnectedAppAuditTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "kinfolk_connected_app_audit";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "kinfolk_connected_app_audit";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 36;
        }>;
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "kinfolk_connected_app_audit";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        permissionId: import("drizzle-orm/pg-core").PgColumn<{
            name: "permission_id";
            tableName: "kinfolk_connected_app_audit";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 36;
        }>;
        appKey: import("drizzle-orm/pg-core").PgColumn<{
            name: "app_key";
            tableName: "kinfolk_connected_app_audit";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 80;
        }>;
        action: import("drizzle-orm/pg-core").PgColumn<{
            name: "action";
            tableName: "kinfolk_connected_app_audit";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 32;
        }>;
        metadata: import("drizzle-orm/pg-core").PgColumn<{
            name: "metadata";
            tableName: "kinfolk_connected_app_audit";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, string | string[]>;
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: Record<string, string | string[]>;
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "kinfolk_connected_app_audit";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export type KinfolkConnectedAppPermission = typeof kinfolkConnectedAppPermissionsTable.$inferSelect;
export type KinfolkConnectedAppAudit = typeof kinfolkConnectedAppAuditTable.$inferSelect;
//# sourceMappingURL=kinfolk-connected-apps.d.ts.map