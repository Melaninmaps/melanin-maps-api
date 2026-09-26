import { z } from "zod/v4";
export declare const founderProductKnowledgeTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "founder_product_knowledge";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "founder_product_knowledge";
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
        question: import("drizzle-orm/pg-core").PgColumn<{
            name: "question";
            tableName: "founder_product_knowledge";
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
        answer: import("drizzle-orm/pg-core").PgColumn<{
            name: "answer";
            tableName: "founder_product_knowledge";
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
            length: 6000;
        }>;
        keywords: import("drizzle-orm/pg-core").PgColumn<{
            name: "keywords";
            tableName: "founder_product_knowledge";
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
        approved: import("drizzle-orm/pg-core").PgColumn<{
            name: "approved";
            tableName: "founder_product_knowledge";
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
        archivedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "archived_at";
            tableName: "founder_product_knowledge";
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
        createdByUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by_user_id";
            tableName: "founder_product_knowledge";
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
        updatedByUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_by_user_id";
            tableName: "founder_product_knowledge";
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "founder_product_knowledge";
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
            tableName: "founder_product_knowledge";
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
export declare const founderProductKnowledgeAuditTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "founder_product_knowledge_audit";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "founder_product_knowledge_audit";
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
        knowledgeId: import("drizzle-orm/pg-core").PgColumn<{
            name: "knowledge_id";
            tableName: "founder_product_knowledge_audit";
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
        actorUserId: import("drizzle-orm/pg-core").PgColumn<{
            name: "actor_user_id";
            tableName: "founder_product_knowledge_audit";
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
        action: import("drizzle-orm/pg-core").PgColumn<{
            name: "action";
            tableName: "founder_product_knowledge_audit";
            dataType: "string";
            columnType: "PgVarchar";
            data: "approved" | "created" | "updated" | "unapproved" | "archived" | "restored";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["created", "updated", "approved", "unapproved", "archived", "restored"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        before: import("drizzle-orm/pg-core").PgColumn<{
            name: "before";
            tableName: "founder_product_knowledge_audit";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, unknown> | null;
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
            $type: Record<string, unknown> | null;
        }>;
        after: import("drizzle-orm/pg-core").PgColumn<{
            name: "after";
            tableName: "founder_product_knowledge_audit";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, unknown> | null;
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
            $type: Record<string, unknown> | null;
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "founder_product_knowledge_audit";
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
export declare const insertFounderProductKnowledgeSchema: z.ZodObject<{
    approved: z.ZodOptional<z.ZodBoolean>;
    keywords: z.ZodOptional<z.ZodType<string[], string[], z.core.$ZodTypeInternals<string[], string[]>>>;
    createdByUserId: z.ZodString;
    archivedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    question: z.ZodString;
    answer: z.ZodString;
    updatedByUserId: z.ZodString;
}, {
    out: {};
    in: {};
}>;
export declare const selectFounderProductKnowledgeSchema: import("drizzle-zod").BuildSchema<"select", {
    id: import("drizzle-orm/pg-core").PgColumn<{
        name: "id";
        tableName: "founder_product_knowledge";
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
    question: import("drizzle-orm/pg-core").PgColumn<{
        name: "question";
        tableName: "founder_product_knowledge";
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
    answer: import("drizzle-orm/pg-core").PgColumn<{
        name: "answer";
        tableName: "founder_product_knowledge";
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
        length: 6000;
    }>;
    keywords: import("drizzle-orm/pg-core").PgColumn<{
        name: "keywords";
        tableName: "founder_product_knowledge";
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
    approved: import("drizzle-orm/pg-core").PgColumn<{
        name: "approved";
        tableName: "founder_product_knowledge";
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
    archivedAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "archived_at";
        tableName: "founder_product_knowledge";
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
    createdByUserId: import("drizzle-orm/pg-core").PgColumn<{
        name: "created_by_user_id";
        tableName: "founder_product_knowledge";
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
    updatedByUserId: import("drizzle-orm/pg-core").PgColumn<{
        name: "updated_by_user_id";
        tableName: "founder_product_knowledge";
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
    createdAt: import("drizzle-orm/pg-core").PgColumn<{
        name: "created_at";
        tableName: "founder_product_knowledge";
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
        tableName: "founder_product_knowledge";
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
export type FounderProductKnowledge = typeof founderProductKnowledgeTable.$inferSelect;
export type InsertFounderProductKnowledge = z.infer<typeof insertFounderProductKnowledgeSchema>;
//# sourceMappingURL=founder-product-knowledge.d.ts.map