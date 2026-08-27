/**
 * User Identity Context Schema
 *
 * Private, voluntary, changeable member context for:
 *   - Age-appropriate content delivery (age range — uses existing user_age_assurance table)
 *   - Medically relevant context (sex assigned at birth — opt-in only)
 *   - Respectful language (gender identity, pronouns — opt-in only)
 *   - Voluntary safety-feedback aggregation (stored on business_safety_experiences, not here)
 *
 * DATA MINIMIZATION RULE:
 *   Store only the member's explicit selections.
 *   Never infer sex, gender, pronouns, pregnancy status, culture, ethnicity,
 *   or minority status from a name, photo, voice, language, location,
 *   searches, behavior, or social graph.
 *
 *   Never expose these fields on public profiles, business pages, community posts,
 *   Circles, creator cards, business-owner dashboards, or any analytics export.
 */
export declare const userIdentityContext: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "user_identity_context";
    schema: undefined;
    columns: {
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "user_identity_context";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        sexAssignedAtBirth: import("drizzle-orm/pg-core").PgColumn<{
            name: "sex_assigned_at_birth";
            tableName: "user_identity_context";
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
            length: 24;
        }>;
        genderIdentity: import("drizzle-orm/pg-core").PgColumn<{
            name: "gender_identity";
            tableName: "user_identity_context";
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
            length: 24;
        }>;
        pronounSet: import("drizzle-orm/pg-core").PgColumn<{
            name: "pronoun_set";
            tableName: "user_identity_context";
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
            length: 24;
        }>;
        customPronounsCiphertext: import("drizzle-orm/pg-core").PgColumn<{
            name: "custom_pronouns_ciphertext";
            tableName: "user_identity_context";
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
        customPronounsKeyVersion: import("drizzle-orm/pg-core").PgColumn<{
            name: "custom_pronouns_key_version";
            tableName: "user_identity_context";
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
            length: 32;
        }>;
        allowMedicallyRelevantContext: import("drizzle-orm/pg-core").PgColumn<{
            name: "allow_medically_relevant_context";
            tableName: "user_identity_context";
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
        allowPronounAwareLanguage: import("drizzle-orm/pg-core").PgColumn<{
            name: "allow_pronoun_aware_language";
            tableName: "user_identity_context";
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
        version: import("drizzle-orm/pg-core").PgColumn<{
            name: "version";
            tableName: "user_identity_context";
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
            tableName: "user_identity_context";
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
            tableName: "user_identity_context";
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
export declare const userIdentityContextAudit: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "user_identity_context_audit";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "user_identity_context_audit";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 100;
        }>;
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "user_identity_context_audit";
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
            tableName: "user_identity_context_audit";
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
        changedFields: import("drizzle-orm/pg-core").PgColumn<{
            name: "changed_fields";
            tableName: "user_identity_context_audit";
            dataType: "array";
            columnType: "PgArray";
            data: string[];
            driverParam: string | string[];
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: import("drizzle-orm").Column<{
                name: "changed_fields";
                tableName: "user_identity_context_audit";
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
            identity: undefined;
            generated: undefined;
        }, {}, {
            baseBuilder: import("drizzle-orm/pg-core").PgColumnBuilder<{
                name: "changed_fields";
                dataType: "string";
                columnType: "PgText";
                data: string;
                enumValues: [string, ...string[]];
                driverParam: string;
            }, {}, {}, import("drizzle-orm").ColumnBuilderExtraConfig>;
            size: undefined;
        }>;
        reason: import("drizzle-orm/pg-core").PgColumn<{
            name: "reason";
            tableName: "user_identity_context_audit";
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
            length: 40;
        }>;
        occurredAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "occurred_at";
            tableName: "user_identity_context_audit";
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
export declare const userIdentityContextRelations: import("drizzle-orm").Relations<"user_identity_context", {
    user: import("drizzle-orm").One<"users", true>;
}>;
//# sourceMappingURL=user-identity-context.d.ts.map