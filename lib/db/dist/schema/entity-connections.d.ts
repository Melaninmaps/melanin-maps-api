export declare const entityConnectionsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "entity_connections";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "entity_connections";
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
        fromId: import("drizzle-orm/pg-core").PgColumn<{
            name: "from_id";
            tableName: "entity_connections";
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
        fromType: import("drizzle-orm/pg-core").PgColumn<{
            name: "from_type";
            tableName: "entity_connections";
            dataType: "string";
            columnType: "PgVarchar";
            data: "user" | "business" | "event" | "neighborhood" | "creator" | "community_group";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["business", "event", "creator", "neighborhood", "community_group", "user"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        toId: import("drizzle-orm/pg-core").PgColumn<{
            name: "to_id";
            tableName: "entity_connections";
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
        toType: import("drizzle-orm/pg-core").PgColumn<{
            name: "to_type";
            tableName: "entity_connections";
            dataType: "string";
            columnType: "PgVarchar";
            data: "user" | "business" | "event" | "neighborhood" | "creator" | "community_group";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["business", "event", "creator", "neighborhood", "community_group", "user"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        connectionType: import("drizzle-orm/pg-core").PgColumn<{
            name: "connection_type";
            tableName: "entity_connections";
            dataType: "string";
            columnType: "PgVarchar";
            data: "created_by" | "hosts" | "recommends" | "located_in" | "affiliated_with" | "attended_by" | "similar_to" | "part_of";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["hosts", "recommends", "located_in", "affiliated_with", "created_by", "attended_by", "similar_to", "part_of"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        strength: import("drizzle-orm/pg-core").PgColumn<{
            name: "strength";
            tableName: "entity_connections";
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
        label: import("drizzle-orm/pg-core").PgColumn<{
            name: "label";
            tableName: "entity_connections";
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "entity_connections";
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
export type EntityConnection = typeof entityConnectionsTable.$inferSelect;
export type InsertEntityConnection = typeof entityConnectionsTable.$inferInsert;
//# sourceMappingURL=entity-connections.d.ts.map