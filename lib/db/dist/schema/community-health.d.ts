export declare const HEALTH_TOPICS: readonly [{
    readonly id: "pediatric";
    readonly label: "Pediatric Health";
    readonly emoji: "🧒";
    readonly description: "Child health, development, and care";
}, {
    readonly id: "diabetes";
    readonly label: "Diabetes & Blood Sugar";
    readonly emoji: "🩸";
    readonly description: "Type 1, Type 2, prediabetes management";
}, {
    readonly id: "womens-health";
    readonly label: "Women's Health";
    readonly emoji: "💜";
    readonly description: "Reproductive health, hormones, gynecology";
}, {
    readonly id: "mens-health";
    readonly label: "Men's Health";
    readonly emoji: "💙";
    readonly description: "Prostate health, testosterone, male wellness";
}, {
    readonly id: "mental-health";
    readonly label: "Mental Health";
    readonly emoji: "🧠";
    readonly description: "Therapy, anxiety, depression, trauma";
}, {
    readonly id: "heart-health";
    readonly label: "Heart Health";
    readonly emoji: "❤️";
    readonly description: "Cardiology, blood pressure, cholesterol";
}, {
    readonly id: "nutrition";
    readonly label: "Nutrition & Diet";
    readonly emoji: "🥗";
    readonly description: "Healthy eating, supplements, gut health";
}, {
    readonly id: "fitness";
    readonly label: "Fitness & Movement";
    readonly emoji: "💪🏾";
    readonly description: "Exercise, mobility, physical therapy";
}, {
    readonly id: "cancer";
    readonly label: "Cancer Awareness";
    readonly emoji: "🎗️";
    readonly description: "Prevention, screening, treatment updates";
}, {
    readonly id: "maternal";
    readonly label: "Maternal Health";
    readonly emoji: "🤱🏾";
    readonly description: "Pregnancy, postpartum, birth outcomes";
}, {
    readonly id: "hypertension";
    readonly label: "Hypertension";
    readonly emoji: "💊";
    readonly description: "High blood pressure management";
}, {
    readonly id: "sickle-cell";
    readonly label: "Sickle Cell";
    readonly emoji: "🔬";
    readonly description: "Sickle cell disease research and care";
}, {
    readonly id: "elder-care";
    readonly label: "Elder Care";
    readonly emoji: "👴";
    readonly description: "Aging, dementia, senior wellness";
}, {
    readonly id: "hiv-aids";
    readonly label: "HIV/AIDS Awareness";
    readonly emoji: "🔴";
    readonly description: "Prevention, treatment, stigma reduction";
}, {
    readonly id: "substance-recovery";
    readonly label: "Substance Recovery";
    readonly emoji: "🌿";
    readonly description: "Addiction, recovery resources, harm reduction";
}, {
    readonly id: "reproductive";
    readonly label: "Reproductive Health";
    readonly emoji: "🌸";
    readonly description: "Family planning, fertility, sexual health";
}, {
    readonly id: "kidney";
    readonly label: "Kidney Health";
    readonly emoji: "🫘";
    readonly description: "Chronic kidney disease, dialysis, prevention";
}, {
    readonly id: "respiratory";
    readonly label: "Respiratory Health";
    readonly emoji: "🫁";
    readonly description: "Asthma, COVID, lung disease";
}, {
    readonly id: "dental";
    readonly label: "Oral & Dental Health";
    readonly emoji: "🦷";
    readonly description: "Dental care, gum disease, oral health";
}, {
    readonly id: "vision";
    readonly label: "Vision & Eye Health";
    readonly emoji: "👁️";
    readonly description: "Eye care, glaucoma, vision preservation";
}];
export type HealthTopicId = typeof HEALTH_TOPICS[number]["id"];
export declare const userHealthTopicFollowsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "user_health_topic_follows";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "user_health_topic_follows";
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "user_health_topic_follows";
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
        topicIds: import("drizzle-orm/pg-core").PgColumn<{
            name: "topic_ids";
            tableName: "user_health_topic_follows";
            dataType: "json";
            columnType: "PgJsonb";
            data: ("pediatric" | "diabetes" | "womens-health" | "mens-health" | "mental-health" | "heart-health" | "nutrition" | "fitness" | "cancer" | "maternal" | "hypertension" | "sickle-cell" | "elder-care" | "hiv-aids" | "substance-recovery" | "reproductive" | "kidney" | "respiratory" | "dental" | "vision")[];
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
            $type: ("pediatric" | "diabetes" | "womens-health" | "mens-health" | "mental-health" | "heart-health" | "nutrition" | "fitness" | "cancer" | "maternal" | "hypertension" | "sickle-cell" | "elder-care" | "hiv-aids" | "substance-recovery" | "reproductive" | "kidney" | "respiratory" | "dental" | "vision")[];
        }>;
        pinnedTopicIds: import("drizzle-orm/pg-core").PgColumn<{
            name: "pinned_topic_ids";
            tableName: "user_health_topic_follows";
            dataType: "json";
            columnType: "PgJsonb";
            data: ("pediatric" | "diabetes" | "womens-health" | "mens-health" | "mental-health" | "heart-health" | "nutrition" | "fitness" | "cancer" | "maternal" | "hypertension" | "sickle-cell" | "elder-care" | "hiv-aids" | "substance-recovery" | "reproductive" | "kidney" | "respiratory" | "dental" | "vision")[];
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
            $type: ("pediatric" | "diabetes" | "womens-health" | "mens-health" | "mental-health" | "heart-health" | "nutrition" | "fitness" | "cancer" | "maternal" | "hypertension" | "sickle-cell" | "elder-care" | "hiv-aids" | "substance-recovery" | "reproductive" | "kidney" | "respiratory" | "dental" | "vision")[];
        }>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "user_health_topic_follows";
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
export declare const physicianProfilesTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "physician_profiles";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "physician_profiles";
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "physician_profiles";
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
        displayName: import("drizzle-orm/pg-core").PgColumn<{
            name: "display_name";
            tableName: "physician_profiles";
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
            length: 200;
        }>;
        credentials: import("drizzle-orm/pg-core").PgColumn<{
            name: "credentials";
            tableName: "physician_profiles";
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
        specialty: import("drizzle-orm/pg-core").PgColumn<{
            name: "specialty";
            tableName: "physician_profiles";
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
            length: 150;
        }>;
        institution: import("drizzle-orm/pg-core").PgColumn<{
            name: "institution";
            tableName: "physician_profiles";
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
            length: 200;
        }>;
        licenseState: import("drizzle-orm/pg-core").PgColumn<{
            name: "license_state";
            tableName: "physician_profiles";
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
        licenseNumber: import("drizzle-orm/pg-core").PgColumn<{
            name: "license_number";
            tableName: "physician_profiles";
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
        bio: import("drizzle-orm/pg-core").PgColumn<{
            name: "bio";
            tableName: "physician_profiles";
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
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "physician_profiles";
            dataType: "string";
            columnType: "PgVarchar";
            data: "approved" | "pending" | "rejected";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["pending", "approved", "rejected"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 20;
        }>;
        verifiedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "verified_at";
            tableName: "physician_profiles";
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
        rejectionReason: import("drizzle-orm/pg-core").PgColumn<{
            name: "rejection_reason";
            tableName: "physician_profiles";
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "physician_profiles";
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
            tableName: "physician_profiles";
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
export declare const healthPostsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "health_posts";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "health_posts";
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
        physicianId: import("drizzle-orm/pg-core").PgColumn<{
            name: "physician_id";
            tableName: "health_posts";
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
        authorUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "author_user_id";
            tableName: "health_posts";
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
        title: import("drizzle-orm/pg-core").PgColumn<{
            name: "title";
            tableName: "health_posts";
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
            length: 300;
        }>;
        summary: import("drizzle-orm/pg-core").PgColumn<{
            name: "summary";
            tableName: "health_posts";
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
        url: import("drizzle-orm/pg-core").PgColumn<{
            name: "url";
            tableName: "health_posts";
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
            length: 2000;
        }>;
        source: import("drizzle-orm/pg-core").PgColumn<{
            name: "source";
            tableName: "health_posts";
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
            length: 200;
        }>;
        topicIds: import("drizzle-orm/pg-core").PgColumn<{
            name: "topic_ids";
            tableName: "health_posts";
            dataType: "json";
            columnType: "PgJsonb";
            data: ("pediatric" | "diabetes" | "womens-health" | "mens-health" | "mental-health" | "heart-health" | "nutrition" | "fitness" | "cancer" | "maternal" | "hypertension" | "sickle-cell" | "elder-care" | "hiv-aids" | "substance-recovery" | "reproductive" | "kidney" | "respiratory" | "dental" | "vision")[];
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
            $type: ("pediatric" | "diabetes" | "womens-health" | "mens-health" | "mental-health" | "heart-health" | "nutrition" | "fitness" | "cancer" | "maternal" | "hypertension" | "sickle-cell" | "elder-care" | "hiv-aids" | "substance-recovery" | "reproductive" | "kidney" | "respiratory" | "dental" | "vision")[];
        }>;
        likeCount: import("drizzle-orm/pg-core").PgColumn<{
            name: "like_count";
            tableName: "health_posts";
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
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "health_posts";
            dataType: "string";
            columnType: "PgVarchar";
            data: "removed" | "active";
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
            tableName: "health_posts";
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
export declare const healthPostLikesTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "health_post_likes";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "health_post_likes";
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
        postId: import("drizzle-orm/pg-core").PgColumn<{
            name: "post_id";
            tableName: "health_post_likes";
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
            tableName: "health_post_likes";
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "health_post_likes";
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
export type PhysicianProfile = typeof physicianProfilesTable.$inferSelect;
export type HealthPost = typeof healthPostsTable.$inferSelect;
export type UserHealthTopicFollows = typeof userHealthTopicFollowsTable.$inferSelect;
//# sourceMappingURL=community-health.d.ts.map