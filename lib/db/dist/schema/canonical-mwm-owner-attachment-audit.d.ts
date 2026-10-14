/**
 * Narrow audit history for the one canonical Mapping With Melanin owner
 * attachment. A database trigger makes committed events append-only.
 */
export declare const canonicalMwmOwnerAttachmentAuditTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "canonical_mwm_owner_attachment_audit";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "canonical_mwm_owner_attachment_audit";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        businessId: import("drizzle-orm/pg-core").PgColumn<{
            name: "business_id";
            tableName: "canonical_mwm_owner_attachment_audit";
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
        targetUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "target_user_id";
            tableName: "canonical_mwm_owner_attachment_audit";
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
        actorUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "actor_user_id";
            tableName: "canonical_mwm_owner_attachment_audit";
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
        action: import("drizzle-orm/pg-core").PgColumn<{
            name: "action";
            tableName: "canonical_mwm_owner_attachment_audit";
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
            length: 48;
        }>;
        priorOwnerLinkId: import("drizzle-orm/pg-core").PgColumn<{
            name: "prior_owner_link_id";
            tableName: "canonical_mwm_owner_attachment_audit";
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
            length: 255;
        }>;
        priorOwnerUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "prior_owner_user_id";
            tableName: "canonical_mwm_owner_attachment_audit";
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
            length: 255;
        }>;
        newOwnerLinkId: import("drizzle-orm/pg-core").PgColumn<{
            name: "new_owner_link_id";
            tableName: "canonical_mwm_owner_attachment_audit";
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
            length: 255;
        }>;
        priorState: import("drizzle-orm/pg-core").PgColumn<{
            name: "prior_state";
            tableName: "canonical_mwm_owner_attachment_audit";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        nextState: import("drizzle-orm/pg-core").PgColumn<{
            name: "next_state";
            tableName: "canonical_mwm_owner_attachment_audit";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
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
            tableName: "canonical_mwm_owner_attachment_audit";
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
export type CanonicalMwmOwnerAttachmentAudit = typeof canonicalMwmOwnerAttachmentAuditTable.$inferSelect;
//# sourceMappingURL=canonical-mwm-owner-attachment-audit.d.ts.map