export type ChecklistSection = {
    pre_launch: {
        businesses_seeded: boolean;
        cultural_sites: boolean;
        historical_sites: boolean;
        community_resources: boolean;
        events: boolean;
        city_imagery: boolean;
        moderation_review: boolean;
        kinfolk_city_context: boolean;
        search_validation: boolean;
        map_validation: boolean;
        analytics_enabled: boolean;
    };
    community: {
        founding_members: boolean;
        founding_businesses: boolean;
        ambassadors: boolean;
        creators: boolean;
        volunteers: boolean;
        local_organizations: boolean;
    };
    marketing: {
        city_landing_page: boolean;
        launch_announcement: boolean;
        social_assets: boolean;
        founder_interview_prompts: boolean;
        local_press_checklist: boolean;
        city_hashtags: boolean;
        referral_campaign: boolean;
    };
    operations: {
        feature_flags: boolean;
        rollout_percentage: boolean;
        monitoring: boolean;
        crash_dashboard: boolean;
        waitlist_activation: boolean;
        rollback_plan: boolean;
    };
};
export declare const DEFAULT_CHECKLIST: ChecklistSection;
export declare const cityLaunchesTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "city_launches";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "city_launches";
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
        city: import("drizzle-orm/pg-core").PgColumn<{
            name: "city";
            tableName: "city_launches";
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
            length: 100;
        }>;
        state: import("drizzle-orm/pg-core").PgColumn<{
            name: "state";
            tableName: "city_launches";
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
            length: 50;
        }>;
        slug: import("drizzle-orm/pg-core").PgColumn<{
            name: "slug";
            tableName: "city_launches";
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
            length: 120;
        }>;
        sequenceOrder: import("drizzle-orm/pg-core").PgColumn<{
            name: "sequence_order";
            tableName: "city_launches";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
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
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "city_launches";
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
            length: 30;
        }>;
        launchDate: import("drizzle-orm/pg-core").PgColumn<{
            name: "launch_date";
            tableName: "city_launches";
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
        checklist: import("drizzle-orm/pg-core").PgColumn<{
            name: "checklist";
            tableName: "city_launches";
            dataType: "json";
            columnType: "PgJsonb";
            data: ChecklistSection;
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
            $type: ChecklistSection;
        }>;
        notes: import("drizzle-orm/pg-core").PgColumn<{
            name: "notes";
            tableName: "city_launches";
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
        rolloutPercentage: import("drizzle-orm/pg-core").PgColumn<{
            name: "rollout_percentage";
            tableName: "city_launches";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
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
            tableName: "city_launches";
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
            tableName: "city_launches";
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
export type CityLaunch = typeof cityLaunchesTable.$inferSelect;
export type NewCityLaunch = typeof cityLaunchesTable.$inferInsert;
//# sourceMappingURL=city-launches.d.ts.map