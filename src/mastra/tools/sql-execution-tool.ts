import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Client } from 'pg';

const createDatabaseConnection = (connectionString: string) => {
  return new Client({
    connectionString,
    connectionTimeoutMillis: 30000, // 30 seconds
    statement_timeout: 60000, // 1 minute
    query_timeout: 60000, // 1 minute
  });
};

const executeQuery = async (client: Client, query: string) => {
  try {
    console.log('Executing query:', query);
    const result = await client.query(query);
    console.log('Query result:', result.rows);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to execute query: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const ALLOWED_FUNCTIONS = new Set([
  'count', 'sum', 'avg', 'min', 'max',
  'upper', 'lower', 'length', 'substring',
  'date_part', 'now', 'current_timestamp', 'current_date',
  'coalesce', 'greatest', 'least'
]);

const validateQuery = (query: string) => {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery.startsWith('select')) {
    throw new Error('Only SELECT queries are allowed for security reasons');
  }

  // Block common dangerous patterns
  const dangerousPatterns = [
    /pg_\w+\(/i,           // PostgreSQL system functions
    /\bcopy\b/i,           // COPY command
    /\binto\s+outfile/i,   // File operations
    /\bload_file\b/i,      // File loading
    /\beval\b/i,           // Code evaluation
    /\bexecute\b/i,        // Dynamic execution
    /\bsleep\b/i,          // Sleep execution
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedQuery)) {
      throw new Error('Query contains potentially dangerous operations');
    }
  }

  // Check function calls against allow list
  const functionMatches = trimmedQuery.match(/\b(\w+)\s*\(/g);
  if (functionMatches) {
    for (const match of functionMatches) {
      const functionName = match.replace(/\s*\(/, '').toLowerCase();
      if (!ALLOWED_FUNCTIONS.has(functionName)) {
        throw new Error(`Function '${functionName}' is not allowed for security reasons`);
      }
    }
  }
};

export const sqlExecutionTool = createTool({
  id: 'sql-execution',
  inputSchema: z.object({
    connectionString: z.string().describe('PostgreSQL connection string'),
    query: z.string().describe('SQL query to execute'),
  }),
  description: 'Executes SQL queries against a PostgreSQL database',
  execute: async ({ context: { connectionString, query } }) => {
    const client = createDatabaseConnection(connectionString);

    try {
      await client.connect();

      // Layer 1: Input validation
      validateQuery(query); // Your function whitelist approach

      // Layer 2: Read-only transaction
      await client.query('BEGIN TRANSACTION READ ONLY');

      // Layer 3: Query timeout (prevent resource exhaustion)
      await client.query('SET statement_timeout = 30000'); // 30 seconds

      const result = await client.query(query);
      await client.query('COMMIT');

      return {
        success: true,
        data: result.rows,
        rowCount: result.rows.length,
        executedQuery: query,
      };
    } catch (error) {
      // Always rollback
      try {
        await client.query('ROLLBACK');
      } catch {}

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executedQuery: query,
      };
    } finally {
      await client.end();
    }
  },
});
