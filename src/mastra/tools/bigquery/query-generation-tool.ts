import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { fi } from "zod/v4/locales";
import { bigQueryGenerationSchema } from "../../Types/validation";

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const bigQueryGenerationTool = createTool({
  id: "bigquery-generation",
  inputSchema: z.object({
    naturalLanguageQuery: z
      .string()
      .describe("Natural language query from the user"),
    databaseSchema: z.object({
      tables: z.array(
        z.object({
          dataset_name: z.string(),
          project_id: z.string(),
          table_name: z.string(),
          table_type: z.string(),
          creation_time: z.string().optional(),
          ddl: z.string().optional(),
        })
      ),
      columns: z.array(
        z.object({
          dataset_name: z.string(),
          project_id: z.string(),
          table_name: z.string(),
          column_name: z.string(),
          data_type: z.string(),
          is_nullable: z.string(),
          ordinal_position: z.number(),
          is_primary_key: z.boolean(),
        })
      ),
      relationships: z.array(
        z.object({
          project_id: z.string(),
          dataset_name: z.string(),
          table_name: z.string(),
          column_name: z.string(),
          data_type: z.string(),
          is_nullable: z.string(),
        })
      ),
      rowCounts: z.array(
        z.object({
          project_id: z.string(),
          dataset_name: z.string(),
          table_name: z.string(),
          row_count: z.number().nullable(),
          error: z.string().optional(),
        })
      ),
      summary: z.object({
        total_datasets: z.number(),
        total_tables: z.number(),
        total_columns: z.number(),
        total_relationships: z.number(),
        projects_accessed: z.array(z.string()),
      }),
    }),
  }),
  description:
    "Generates BigQuery SQL queries from natural language descriptions using database schema information",
  execute: async ({ context: { naturalLanguageQuery, databaseSchema } }) => {
    try {
      console.log(
        "🔌 Generating BigQuery SQL query for:",
        naturalLanguageQuery
      );
      // Create a comprehensive schema description for the AI
      const schemaDescription = createBigQuerySchemaDescription(databaseSchema);
      const systemPrompt = `You are an expert BigQuery SQL query generator. Your task is to convert natural language questions into accurate BigQuery SQL queries.

DATABASE SCHEMA:
${schemaDescription}

BIGQUERY SYNTAX RULES:
1. Only generate SELECT queries for data retrieval
2. Use proper BigQuery Standard SQL syntax (not Legacy SQL)
3. Always use backticks (\`) around table references in the format \`project_id.dataset_name.table_name\`
4. Use proper BigQuery functions and syntax (e.g., ARRAY_AGG, STRUCT, UNNEST)
5. For string operations, use LIKE (case-sensitive) or REGEXP_CONTAINS for pattern matching
6. Use proper BigQuery data types (STRING, INT64, FLOAT64, TIMESTAMP, DATE, etc.)
7. Format queries with proper indentation and line breaks
8. Include appropriate WHERE clauses to filter results
9. Use LIMIT when appropriate to prevent overly large result sets (BigQuery has slot limits)
10. Consider BigQuery-specific optimizations (partitioning, clustering)
11. Use SAFE functions when appropriate to handle potential errors (SAFE_CAST, SAFE_DIVIDE)
12. For date/time operations, use BigQuery date functions (DATE(), TIMESTAMP(), etc.)

BIGQUERY SPECIFIC FEATURES:
- Use ARRAY and STRUCT types when appropriate
- Leverage window functions with OVER clause
- Use WITH clauses for complex queries (Common Table Expressions)
- Consider using APPROX_COUNT_DISTINCT for large datasets
- Use EXTRACT() for date/time parts
- Use PARSE_DATE/PARSE_TIMESTAMP for string to date conversions

QUERY ANALYSIS:
- Analyze the user's question carefully
- Identify which tables and columns are needed
- Determine if JOINs are required (use proper BigQuery JOIN syntax)
- Consider aggregation functions if needed
- Think about appropriate filtering conditions
- Consider ordering and limiting results
- Account for BigQuery's distributed nature and potential costs

Provide a high-confidence BigQuery SQL query that accurately answers the user's question.`;

      const userPrompt = `Generate a BigQuery SQL query for this question: "${naturalLanguageQuery}"

Please provide:
1. The BigQuery SQL query (using Standard SQL syntax)
2. A clear explanation of what the query does
3. Your confidence level (0-1)
4. Any assumptions you made
5. List of tables used (in project.dataset.table format)`;

      const result = await generateObject({
        model: openrouter("gpt-4.1"),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        schema: bigQueryGenerationSchema,
        temperature: 0.1, // Low temperature for more deterministic results
      });

      return result.object;
    } catch (error) {
      console.log("error", error);
      throw new Error(
        `Failed to generate BigQuery SQL query: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export function createBigQuerySchemaDescription(databaseSchema: any): string {
  let description = "";

  // Group columns by project, dataset, and table
  const tableColumns = new Map<string, any[]>();
  databaseSchema.columns.forEach((column: any) => {
    const tableKey = `${column.project_id}.${column.dataset_name}.${column.table_name}`;
    if (!tableColumns.has(tableKey)) {
      tableColumns.set(tableKey, []);
    }
    tableColumns.get(tableKey)?.push(column);
  });

  // Create table descriptions
  databaseSchema.tables.forEach((table: any) => {
    const tableKey = `${table.project_id}.${table.dataset_name}.${table.table_name}`;
    const columns = tableColumns.get(tableKey) || [];
    const rowCount = databaseSchema.rowCounts.find(
      (rc: any) =>
        rc.project_id === table.project_id &&
        rc.dataset_name === table.dataset_name &&
        rc.table_name === table.table_name
    );

    description += `\nTable: \`${table.project_id}.${table.dataset_name}.${table.table_name}\``;
    description += ` (Type: ${table.table_type})`;
    if (rowCount && rowCount.row_count !== null) {
      description += ` (${rowCount.row_count.toLocaleString()} rows)`;
    } else if (rowCount && rowCount.error) {
      description += ` (Row count unavailable: ${rowCount.error})`;
    }
    description += "\nColumns:\n";

    // Sort columns by ordinal position
    const sortedColumns = columns.sort(
      (a, b) => a.ordinal_position - b.ordinal_position
    );

    sortedColumns.forEach((column: any) => {
      description += `  - ${column.column_name}: ${column.data_type}`;
      if (column.is_primary_key) {
        description += " [PRIMARY KEY]";
      }
      if (column.is_nullable === "NO") {
        description += " [NOT NULL]";
      }
      description += "\n";
    });

    // Add table creation info if available
    if (table.creation_time) {
      description += `  Created: ${table.creation_time}\n`;
    }
  });

  // Add relationship information (ID-like columns that might indicate relationships)
  if (databaseSchema.relationships.length > 0) {
    description += "\nPotential Relationships (ID-like columns):\n";
    const relationshipsByTable = new Map<string, any[]>();

    databaseSchema.relationships.forEach((rel: any) => {
      const tableKey = `${rel.project_id}.${rel.dataset_name}.${rel.table_name}`;
      if (!relationshipsByTable.has(tableKey)) {
        relationshipsByTable.set(tableKey, []);
      }
      relationshipsByTable.get(tableKey)?.push(rel);
    });

    relationshipsByTable.forEach((rels, tableKey) => {
      description += `  Table: \`${tableKey}\`\n`;
      rels.forEach((rel: any) => {
        description += `    - ${rel.column_name} (${rel.data_type})`;
        if (rel.is_nullable === "NO") {
          description += " [NOT NULL]";
        }
        description += "\n";
      });
    });
  }

  // Add summary information
  if (databaseSchema.summary) {
    description += "\nSchema Summary:\n";
    description += `  - Total Datasets: ${databaseSchema.summary.total_datasets}\n`;
    description += `  - Total Tables: ${databaseSchema.summary.total_tables}\n`;
    description += `  - Total Columns: ${databaseSchema.summary.total_columns}\n`;
    description += `  - Projects Accessed: ${databaseSchema.summary.projects_accessed.join(", ")}\n`;
  }

  // Add BigQuery-specific notes
  description += "\nBigQuery Notes:\n";
  description +=
    "  - Use backticks around table references: `project.dataset.table`\n";
  description += "  - BigQuery uses Standard SQL syntax\n";
  description += "  - Consider query costs and slot usage\n";
  description += "  - Use LIMIT to control result size\n";

  return description;
}
