/**
 * Approved tester emails waiting for account creation.
 *
 * When an admin approves a tester email before they have an account, the email
 * is recorded here. On registration (any auth path), the email is normalized,
 * checked against this table, and — if matched — the tester entitlement is
 * automatically applied to the new user row. The record is then marked applied.
 *
 * This allows:
 *   Admin approves email → tester registers later → entitlement auto-attaches
 * rather than requiring a manual second step.
 */
export declare const pendingTesterEmailsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "pending_tester_emails";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "pending_tester_emails";
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
            length: number | undefined;
        }>;
        email: import("drizzle-orm/pg-core").PgColumn<{
            name: "email";
            tableName: "pending_tester_emails";
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
            length: number | undefined;
        }>;
        testerAccessSource: import("drizzle-orm/pg-core").PgColumn<{
            name: "tester_access_source";
            tableName: "pending_tester_emails";
            dataType: "string";
            columnType: "PgVarchar";
            data: "testflight" | "android_test" | "admin_invite" | "website_test";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["testflight", "android_test", "admin_invite", "website_test"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        grantedBy: import("drizzle-orm/pg-core").PgColumn<{
            name: "granted_by";
            tableName: "pending_tester_emails";
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
            length: number | undefined;
        }>;
        grantedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "granted_at";
            tableName: "pending_tester_emails";
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
        entitlementEndsAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "entitlement_ends_at";
            tableName: "pending_tester_emails";
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
        appliedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "applied_at";
            tableName: "pending_tester_emails";
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
        appliedToUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "applied_to_user_id";
            tableName: "pending_tester_emails";
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
            length: number | undefined;
        }>;
    };
    dialect: "pg";
}>;
//# sourceMappingURL=pending-tester-emails.d.ts.map