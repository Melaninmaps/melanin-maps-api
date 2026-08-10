export declare const ACHIEVEMENT_DEFINITIONS: {
    readonly first_review: {
        readonly title: "First Review";
        readonly icon: "⭐";
        readonly desc: "Wrote your first community review";
    };
    readonly local_guide_10: {
        readonly title: "Local Guide";
        readonly icon: "🗺️";
        readonly desc: "Written 10 reviews";
    };
    readonly first_recommendation: {
        readonly title: "Community Builder";
        readonly icon: "🤎";
        readonly desc: "Recommended your first business to join";
    };
    readonly community_builder_5: {
        readonly title: "Community Champion";
        readonly icon: "🏆";
        readonly desc: "Recommended 5 businesses";
    };
    readonly first_checkin: {
        readonly title: "Explorer";
        readonly icon: "📍";
        readonly desc: "Checked in to your first business";
    };
    readonly explorer_25: {
        readonly title: "Super Explorer";
        readonly icon: "🌍";
        readonly desc: "Discovered 25 businesses";
    };
    readonly safety_sentinel: {
        readonly title: "Safety Sentinel";
        readonly icon: "🛡️";
        readonly desc: "Submitted 5 safety reports";
    };
    readonly first_request: {
        readonly title: "Voice of the Community";
        readonly icon: "🙋";
        readonly desc: "Posted your first community request";
    };
    readonly first_helper: {
        readonly title: "Kinfolk Helper";
        readonly icon: "🤝";
        readonly desc: "Offered to help someone for the first time";
    };
    readonly helper_10: {
        readonly title: "Community Mentor";
        readonly icon: "👑";
        readonly desc: "Helped 10 community members";
    };
    readonly relocation_expert: {
        readonly title: "Relocation Expert";
        readonly icon: "🏠";
        readonly desc: "Helped someone relocate";
    };
    readonly accessibility_advocate: {
        readonly title: "Accessibility Advocate";
        readonly icon: "♿";
        readonly desc: "Submitted 3 accessibility requests";
    };
    readonly first_circle: {
        readonly title: "Circle Starter";
        readonly icon: "⭐";
        readonly desc: "Created your first Kinfolk Circle";
    };
    readonly kinfolk_star: {
        readonly title: "Kinfolk Star";
        readonly icon: "✨";
        readonly desc: "Created 3 Kinfolk Circles";
    };
    readonly challenge_complete: {
        readonly title: "Challenge Accepted";
        readonly icon: "🎯";
        readonly desc: "Completed your first community challenge";
    };
    readonly challenge_streak_3: {
        readonly title: "On Fire";
        readonly icon: "🔥";
        readonly desc: "Completed 3 challenges in a row";
    };
};
export type AchievementType = keyof typeof ACHIEVEMENT_DEFINITIONS;
export declare const userAchievementsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "user_achievements";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "user_achievements";
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
            tableName: "user_achievements";
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
        achievementType: import("drizzle-orm/pg-core").PgColumn<{
            name: "achievement_type";
            tableName: "user_achievements";
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
            length: 60;
        }>;
        metadata: import("drizzle-orm/pg-core").PgColumn<{
            name: "metadata";
            tableName: "user_achievements";
            dataType: "json";
            columnType: "PgJson";
            data: Record<string, unknown>;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: Record<string, unknown>;
        }>;
        earnedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "earned_at";
            tableName: "user_achievements";
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
export type UserAchievement = typeof userAchievementsTable.$inferSelect;
//# sourceMappingURL=user-achievements.d.ts.map