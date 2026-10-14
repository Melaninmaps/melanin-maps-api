/**
 * APPROVAL REQUIRED — SOURCE ONLY. A deliberately confirmed, owner-only reference
 * between an existing private Trip and an existing Temporary Stay. This relation
 * stores no location/address/coordinates, encrypted payload, provider result,
 * booking identifier, or itinerary content.
 */
export declare const kinfolkTripTemporaryStaysTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "kinfolk_trip_temporary_stays";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "kinfolk_trip_temporary_stays";
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
        tripId: import("drizzle-orm/pg-core").PgColumn<{
            name: "trip_id";
            tableName: "kinfolk_trip_temporary_stays";
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
        temporaryStayId: import("drizzle-orm/pg-core").PgColumn<{
            name: "temporary_stay_id";
            tableName: "kinfolk_trip_temporary_stays";
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
            tableName: "kinfolk_trip_temporary_stays";
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
        memberConfirmedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "member_confirmed_at";
            tableName: "kinfolk_trip_temporary_stays";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
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
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "kinfolk_trip_temporary_stays";
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
            tableName: "kinfolk_trip_temporary_stays";
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
export type KinfolkTripTemporaryStay = typeof kinfolkTripTemporaryStaysTable.$inferSelect;
export type InsertKinfolkTripTemporaryStay = typeof kinfolkTripTemporaryStaysTable.$inferInsert;
//# sourceMappingURL=kinfolk-trip-temporary-stays.d.ts.map