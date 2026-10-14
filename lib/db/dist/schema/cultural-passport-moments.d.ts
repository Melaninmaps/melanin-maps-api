export declare const CULTURAL_PASSPORT_MOMENT_KINDS: readonly ["place", "event", "food", "music", "story", "community_voice", "learning"];
export type CulturalPassportMomentKind = (typeof CULTURAL_PASSPORT_MOMENT_KINDS)[number];
/**
 * Private, member-confirmed moments for My Passport.
 *
 * This deliberately does not store points, levels, streaks, achievement state,
 * completion state, or inferred activity. A moment exists only after the member
 * explicitly chooses to keep it in their Passport.
 */
export declare const culturalPassportMomentsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "cultural_passport_moments";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "cultural_passport_moments";
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "cultural_passport_moments";
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
        kind: import("drizzle-orm/pg-core").PgColumn<{
            name: "kind";
            tableName: "cultural_passport_moments";
            dataType: "string";
            columnType: "PgVarchar";
            data: "event" | "place" | "food" | "music" | "story" | "community_voice" | "learning";
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
            length: 40;
            $type: "event" | "place" | "food" | "music" | "story" | "community_voice" | "learning";
        }>;
        title: import("drizzle-orm/pg-core").PgColumn<{
            name: "title";
            tableName: "cultural_passport_moments";
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
            length: 180;
        }>;
        note: import("drizzle-orm/pg-core").PgColumn<{
            name: "note";
            tableName: "cultural_passport_moments";
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
        sourceLabel: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_label";
            tableName: "cultural_passport_moments";
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
            length: 180;
        }>;
        sourceUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "source_url";
            tableName: "cultural_passport_moments";
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
        memberConfirmedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "member_confirmed_at";
            tableName: "cultural_passport_moments";
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "cultural_passport_moments";
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
        removedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "removed_at";
            tableName: "cultural_passport_moments";
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
    };
    dialect: "pg";
}>;
export type CulturalPassportMoment = typeof culturalPassportMomentsTable.$inferSelect;
export type NewCulturalPassportMoment = typeof culturalPassportMomentsTable.$inferInsert;
//# sourceMappingURL=cultural-passport-moments.d.ts.map