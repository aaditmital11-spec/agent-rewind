import { Pool } from "pg";

// One pool for the whole app. Each query borrows a connection and returns it.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
