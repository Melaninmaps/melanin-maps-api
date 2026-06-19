import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export class Storage {
  async getUser(id: string) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user;
  }
}

export const storage = new Storage();
