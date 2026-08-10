/**
 * Tracks every outbound click to an external institution — cultural heritage sites,
 * hotels, employers, job boards, museums, nonprofits, etc.
 *
 * PRIVACY RULE: isSafetyRelated = true means this click context originated from a safety
 * report or employee safety story. This flag MUST be checked before sharing ANY data
 * with the institution. Aggregate click stats are only sent to institutions when
 * isSafetyRelated is FALSE.
 *
 * Distinction:
 *   - Employee safety tips / employee stories about employers → isSafetyRelated = true (never shared)
 *   - User clicking "Visit Website" on a cultural site → isSafetyRelated = false (trackable)
 *   - User applying to a job on Indeed → isSafetyRelated = false (trackable)
 *   - User tapping a support/giving link → isSafetyRelated = false (trackable)
 *   - User positively tagging an employer → isSafetyRelated = false (trackable)
 */
export declare const externalClickEventsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "external_click_events";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "external_click_events";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
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
        institutionName: import("drizzle-orm/pg-core").PgColumn<{
            name: "institution_name";
            tableName: "external_click_events";
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
        institutionType: import("drizzle-orm/pg-core").PgColumn<{
            name: "institution_type";
            tableName: "external_click_events";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 50;
        }>;
        institutionUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "institution_url";
            tableName: "external_click_events";
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
            length: 500;
        }>;
        referenceType: import("drizzle-orm/pg-core").PgColumn<{
            name: "reference_type";
            tableName: "external_click_events";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 50;
        }>;
        referenceId: import("drizzle-orm/pg-core").PgColumn<{
            name: "reference_id";
            tableName: "external_click_events";
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
        source: import("drizzle-orm/pg-core").PgColumn<{
            name: "source";
            tableName: "external_click_events";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 50;
        }>;
        isSafetyRelated: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_safety_related";
            tableName: "external_click_events";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "external_click_events";
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
        city: import("drizzle-orm/pg-core").PgColumn<{
            name: "city";
            tableName: "external_click_events";
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
            length: 100;
        }>;
        state: import("drizzle-orm/pg-core").PgColumn<{
            name: "state";
            tableName: "external_click_events";
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
            length: 50;
        }>;
        clickedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "clicked_at";
            tableName: "external_click_events";
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
export type ExternalClickEvent = typeof externalClickEventsTable.$inferSelect;
export type InsertExternalClickEvent = typeof externalClickEventsTable.$inferInsert;
//# sourceMappingURL=external-click-events.d.ts.map