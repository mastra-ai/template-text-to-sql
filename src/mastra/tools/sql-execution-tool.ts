import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Pool } from "pg";

const createDatabaseConnection = (connectionString: string) => {
  return new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
  });
};

const executeQuery = async (pool: Pool, query: string) => {
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

export const sqlExecutionTool = createTool({
  id: "sql-execution",
  inputSchema: z.object({
    connectionString: z.string().describe("PostgreSQL connection string"),
    query: z.string().describe("SQL query to execute"),
  }),
  description: "Executes SQL queries against a PostgreSQL database",
  execute: async ({ context: { connectionString, query } }) => {
    const pool = createDatabaseConnection(connectionString);

    try {
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith("select")) {
        throw new Error("Only SELECT queries are allowed for security reasons");
      }

      const result = await executeQuery(pool, query);

      return {
        success: true,
        data: result,
        rowCount: result.length,
        executedQuery: query,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executedQuery: query,
      };
    } finally {
      await pool.end();
    }
  },
});
