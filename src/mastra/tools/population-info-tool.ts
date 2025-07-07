import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Pool } from "pg";

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

const executeQuery = async (query: string) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    throw new Error(
      `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    client.release();
  }
};

export const populationInfo = createTool({
  id: "Execute SQL Query",
  inputSchema: z.object({
    query: z
      .string()
      .describe("SQL query to execute against the cities database"),
  }),
  description: `Executes a SQL query against the cities database and returns the results`,
  execute: async ({ context: { query } }) => {
    try {
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith("select")) {
        throw new Error("Only SELECT queries are allowed for security reasons");
      }

      return await executeQuery(query);
    } catch (error) {
      throw new Error(
        `Failed to execute SQL query: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});
