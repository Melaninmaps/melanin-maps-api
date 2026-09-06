export declare const DESIGNATIONS: readonly [{
    readonly id: "black";
    readonly label: "Black / African American";
    readonly emoji: "✊🏾";
    readonly keywords: readonly ["Black", "African American", "African-American", "Afro-American", "Black American"];
}, {
    readonly id: "latino";
    readonly label: "Latino / Hispanic";
    readonly emoji: "🌎";
    readonly keywords: readonly ["Latino", "Latina", "Latinx", "Hispanic", "Mexican American", "Puerto Rican", "Cuban American"];
}, {
    readonly id: "indigenous";
    readonly label: "Indigenous / Native American";
    readonly emoji: "🦅";
    readonly keywords: readonly ["Indigenous", "Native American", "American Indian", "Alaska Native", "First Nations", "Tribal"];
}, {
    readonly id: "mena";
    readonly label: "Middle Eastern / Arab";
    readonly emoji: "🌙";
    readonly keywords: readonly ["Middle Eastern", "Arab American", "Arab", "MENA", "North African"];
}, {
    readonly id: "multiracial";
    readonly label: "Multiracial / Biracial";
    readonly emoji: "🌈";
    readonly keywords: readonly ["Multiracial", "Biracial", "Mixed race", "Mixed-race"];
}];
export type DesignationId = typeof DESIGNATIONS[number]["id"];
export declare const INSIGHT_JOURNALS: readonly [{
    readonly id: "nejm";
    readonly label: "New England Journal of Medicine";
    readonly abbrev: "N Engl J Med";
    readonly color: "#DC2626";
}, {
    readonly id: "jama";
    readonly label: "JAMA";
    readonly abbrev: "JAMA";
    readonly color: "#7C3AED";
}, {
    readonly id: "lancet";
    readonly label: "The Lancet";
    readonly abbrev: "Lancet";
    readonly color: "#0891B2";
}, {
    readonly id: "bmj";
    readonly label: "The BMJ";
    readonly abbrev: "BMJ";
    readonly color: "#059669";
}, {
    readonly id: "aim";
    readonly label: "Annals of Internal Medicine";
    readonly abbrev: "Ann Intern Med";
    readonly color: "#D97706";
}, {
    readonly id: "natmed";
    readonly label: "Nature Medicine";
    readonly abbrev: "Nat Med";
    readonly color: "#2563EB";
}, {
    readonly id: "plosmed";
    readonly label: "PLOS Medicine";
    readonly abbrev: "PLoS Med";
    readonly color: "#16A34A";
}, {
    readonly id: "jamaopen";
    readonly label: "JAMA Network Open";
    readonly abbrev: "JAMA Netw Open";
    readonly color: "#9333EA";
}, {
    readonly id: "cmaj";
    readonly label: "CMAJ";
    readonly abbrev: "CMAJ";
    readonly color: "#B91C1C";
}, {
    readonly id: "ajph";
    readonly label: "American Journal of Public Health";
    readonly abbrev: "Am J Public Health";
    readonly color: "#0D9488";
}];
export type InsightJournalId = typeof INSIGHT_JOURNALS[number]["id"];
export declare const journalInsightsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "journal_insights";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "journal_insights";
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
        pmid: import("drizzle-orm/pg-core").PgColumn<{
            name: "pmid";
            tableName: "journal_insights";
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
            length: 20;
        }>;
        title: import("drizzle-orm/pg-core").PgColumn<{
            name: "title";
            tableName: "journal_insights";
            dataType: "string";
            columnType: "PgText";
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
        }, {}, {}>;
        abstract: import("drizzle-orm/pg-core").PgColumn<{
            name: "abstract";
            tableName: "journal_insights";
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
        authors: import("drizzle-orm/pg-core").PgColumn<{
            name: "authors";
            tableName: "journal_insights";
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
        journalId: import("drizzle-orm/pg-core").PgColumn<{
            name: "journal_id";
            tableName: "journal_insights";
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
        journalLabel: import("drizzle-orm/pg-core").PgColumn<{
            name: "journal_label";
            tableName: "journal_insights";
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
        journalAbbrev: import("drizzle-orm/pg-core").PgColumn<{
            name: "journal_abbrev";
            tableName: "journal_insights";
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
        pubDate: import("drizzle-orm/pg-core").PgColumn<{
            name: "pub_date";
            tableName: "journal_insights";
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
        doi: import("drizzle-orm/pg-core").PgColumn<{
            name: "doi";
            tableName: "journal_insights";
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
            length: 300;
        }>;
        url: import("drizzle-orm/pg-core").PgColumn<{
            name: "url";
            tableName: "journal_insights";
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
            length: 500;
        }>;
        designationIds: import("drizzle-orm/pg-core").PgColumn<{
            name: "designation_ids";
            tableName: "journal_insights";
            dataType: "json";
            columnType: "PgJsonb";
            data: ("black" | "latino" | "indigenous" | "mena" | "multiracial")[];
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
            $type: ("black" | "latino" | "indigenous" | "mena" | "multiracial")[];
        }>;
        healthTopicIds: import("drizzle-orm/pg-core").PgColumn<{
            name: "health_topic_ids";
            tableName: "journal_insights";
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
        bookmarkCount: import("drizzle-orm/pg-core").PgColumn<{
            name: "bookmark_count";
            tableName: "journal_insights";
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
        isCurated: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_curated";
            tableName: "journal_insights";
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
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "journal_insights";
            dataType: "string";
            columnType: "PgVarchar";
            data: "active" | "removed";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["active", "removed"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 20;
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "journal_insights";
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
        syncedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "synced_at";
            tableName: "journal_insights";
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
export declare const journalInsightBookmarksTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "journal_insight_bookmarks";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "journal_insight_bookmarks";
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
        insightId: import("drizzle-orm/pg-core").PgColumn<{
            name: "insight_id";
            tableName: "journal_insight_bookmarks";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "journal_insight_bookmarks";
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
        pinned: import("drizzle-orm/pg-core").PgColumn<{
            name: "pinned";
            tableName: "journal_insight_bookmarks";
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "journal_insight_bookmarks";
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
export declare const journalSyncLogTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "journal_sync_log";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "journal_sync_log";
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
        journalId: import("drizzle-orm/pg-core").PgColumn<{
            name: "journal_id";
            tableName: "journal_sync_log";
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
        articlesFound: import("drizzle-orm/pg-core").PgColumn<{
            name: "articles_found";
            tableName: "journal_sync_log";
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
        articlesInserted: import("drizzle-orm/pg-core").PgColumn<{
            name: "articles_inserted";
            tableName: "journal_sync_log";
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
        error: import("drizzle-orm/pg-core").PgColumn<{
            name: "error";
            tableName: "journal_sync_log";
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
        ranAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "ran_at";
            tableName: "journal_sync_log";
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
export type JournalInsight = typeof journalInsightsTable.$inferSelect;
//# sourceMappingURL=journal-insights.d.ts.map