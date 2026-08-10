export type SafetySurveyResponses = {
    overallRating: number;
    feltWelcomed: "yes" | "somewhat" | "no";
    experiencedBias: boolean;
    biasDetails?: string;
    staffAttitude: number;
    wouldReturn: boolean;
    wouldRecommend: boolean;
    notes?: string;
};
export type EmployeeSurveyResponses = {
    employmentStatus: "current" | "former";
    overallRating: number;
    feltRespected: "yes" | "somewhat" | "no";
    payEquityConcerns: boolean;
    witnessedDiscrimination: boolean;
    discriminationDetails?: string;
    wouldRecommendWorking: boolean;
    notes?: string;
};
export declare const businessInsightSurveysTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "business_insight_surveys";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "business_insight_surveys";
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
        businessId: import("drizzle-orm/pg-core").PgColumn<{
            name: "business_id";
            tableName: "business_insight_surveys";
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
        businessName: import("drizzle-orm/pg-core").PgColumn<{
            name: "business_name";
            tableName: "business_insight_surveys";
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
        businessCity: import("drizzle-orm/pg-core").PgColumn<{
            name: "business_city";
            tableName: "business_insight_surveys";
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
        businessCategory: import("drizzle-orm/pg-core").PgColumn<{
            name: "business_category";
            tableName: "business_insight_surveys";
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
        businessAddress: import("drizzle-orm/pg-core").PgColumn<{
            name: "business_address";
            tableName: "business_insight_surveys";
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
        isMinorityOwned: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_minority_owned";
            tableName: "business_insight_surveys";
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
        surveyType: import("drizzle-orm/pg-core").PgColumn<{
            name: "survey_type";
            tableName: "business_insight_surveys";
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
        submittedByUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "submitted_by_user_id";
            tableName: "business_insight_surveys";
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
        responses: import("drizzle-orm/pg-core").PgColumn<{
            name: "responses";
            tableName: "business_insight_surveys";
            dataType: "json";
            columnType: "PgJsonb";
            data: SafetySurveyResponses | EmployeeSurveyResponses;
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
        }, {}, {
            $type: SafetySurveyResponses | EmployeeSurveyResponses;
        }>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "business_insight_surveys";
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
            length: 20;
        }>;
        moderatorNotes: import("drizzle-orm/pg-core").PgColumn<{
            name: "moderator_notes";
            tableName: "business_insight_surveys";
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
            tableName: "business_insight_surveys";
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
export type BusinessInsightSurvey = typeof businessInsightSurveysTable.$inferSelect;
export declare const insertBusinessInsightSchema: import("zod/v4").ZodObject<{
    businessId: import("zod/v4").ZodOptional<import("zod/v4").ZodNullable<import("zod/v4").ZodString>>;
    isMinorityOwned: import("zod/v4").ZodOptional<import("zod/v4").ZodBoolean>;
    businessName: import("zod/v4").ZodString;
    businessCity: import("zod/v4").ZodOptional<import("zod/v4").ZodNullable<import("zod/v4").ZodString>>;
    businessCategory: import("zod/v4").ZodOptional<import("zod/v4").ZodNullable<import("zod/v4").ZodString>>;
    businessAddress: import("zod/v4").ZodOptional<import("zod/v4").ZodNullable<import("zod/v4").ZodString>>;
    surveyType: import("zod/v4").ZodString;
    submittedByUserId: import("zod/v4").ZodOptional<import("zod/v4").ZodNullable<import("zod/v4").ZodString>>;
    responses: import("zod/v4").ZodType<SafetySurveyResponses | EmployeeSurveyResponses, SafetySurveyResponses | EmployeeSurveyResponses, import("zod/v4/core").$ZodTypeInternals<SafetySurveyResponses | EmployeeSurveyResponses, SafetySurveyResponses | EmployeeSurveyResponses>>;
}, {
    out: {};
    in: {};
}>;
export declare const selectBusinessInsightSchema: import("drizzle-zod").BuildSchema<"select", {
    id: import("drizzle-orm/pg-core").PgColumn<{
        name: "id";
        tableName: "business_insight_surveys";
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
    businessId: import("drizzle-orm/pg-core").PgColumn<{
        name: "business_id";
        tableName: "business_insight_surveys";
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
    businessName: import("drizzle-orm/pg-core").PgColumn<{
        name: "business_name";
        tableName: "business_insight_surveys";
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
    businessCity: import("drizzle-orm/pg-core").PgColumn<{
        name: "business_city";
        tableName: "business_insight_surveys";
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
    businessCategory: import("drizzle-orm/pg-core").PgColumn<{
        name: "business_category";
        tableName: "business_insight_surveys";
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
    businessAddress: import("drizzle-orm/pg-core").PgColumn<{
        name: "business_address";
        tableName: "business_insight_surveys";
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
    isMinorityOwned: import("drizzle-orm/pg-core").PgColumn<{
        name: "is_minority_owned";
        tableName: "business_insight_surveys";
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
    surveyType: import("drizzle-orm/pg-core").PgColumn<{
        name: "survey_type";
        tableName: "business_insight_surveys";
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
    submittedByUserId: import("drizzle-orm/pg-core").PgColumn<{
        name: "submitted_by_user_id";
        tableName: "business_insight_surveys";
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
    responses: import("drizzle-orm/pg-core").PgColumn<{
        name: "responses";
        tableName: "business_insight_surveys";
        dataType: "json";
        columnType: "PgJsonb";
        data: SafetySurveyResponses | EmployeeSurveyResponses;
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
    }, {}, {
        $type: SafetySurveyResponses | EmployeeSurveyResponses;
    }>;
    status: import("drizzle-orm/pg-core").PgColumn<{
        name: "status";
        tableName: "business_insight_surveys";
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
        length: 20;
    }>;
    moderatorNotes: import("drizzle-orm/pg-core").PgColumn<{
        name: "moderator_notes";
        tableName: "business_insight_surveys";
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
        tableName: "business_insight_surveys";
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
}, undefined, undefined>;
//# sourceMappingURL=business-insight-surveys.d.ts.map