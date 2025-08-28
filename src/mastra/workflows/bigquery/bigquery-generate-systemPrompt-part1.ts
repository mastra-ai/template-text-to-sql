import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";
import { bigqueryIntrospectionTool } from "../../tools/bigquery/bigquery-inspection-tool";
import {
  createBigQuerySchemaDescription,
} from "../../tools/bigquery/query-generation-tool";

// Step 1: Get dataset information from user
const getDatasetInfoStep = createStep({
  id: "get-bigquery-info",
  inputSchema: z.object({}),
  outputSchema: z.object({
    datasets: z.array(
      z.object({
        name: z.string(),
        projectId: z.string().optional(),
        tables: z.array(z.string()),
      })
    ),
  }),
  resumeSchema: z.object({
    datasets: z.array(
      z.object({
        name: z.string(),
        projectId: z.string().optional(),
        tables: z.array(z.string()),
      })
    ),
  }),
  suspendSchema: z.object({
    message: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData?.datasets) {
      await suspend({
        message:
          "Please provide your BigQuery dataset information in the following format:\n" +
          "{\n" +
          '  "datasets": [\n' +
          "    {\n" +
          '      "name": "your-dataset-name",\n' +
          '      "projectId": "your-project-id" (optional),\n' +
          '      "tables": ["table1", "table2", "table3"]\n' +
          "    }\n" +
          "  ]\n" +
          "}",
      });

      return {
        datasets: [],
      };
    }

    const { datasets } = resumeData;
    return { datasets };
  },
});

// Step 2: Introspect BigQuery datasets
const introspectBigQueryStep = createStep({
  id: "introspect-bigquery",
  inputSchema: z.object({
    datasets: z.array(
      z.object({
        name: z.string(),
        projectId: z.string().optional(),
        tables: z.array(z.string()),
      })
    ),
  }),
  outputSchema: z.object({
    datasets: z.array(
      z.object({
        name: z.string(),
        projectId: z.string().optional(),
        tables: z.array(z.string()),
      })
    ),
    schema: z.object({
      tables: z.array(z.any()),
      columns: z.array(z.any()),
      relationships: z.array(z.any()),
      rowCounts: z.array(z.any()),
      summary: z.object({
        total_datasets: z.number(),
        total_tables: z.number(),
        total_columns: z.number(),
        total_relationships: z.number(),
        projects_accessed: z.array(z.string()),
      }),
    }),
    schemaPresentation: z.string(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { datasets } = inputData;

    try {
      console.log("🔍 Starting BigQuery introspection...");

      // Use the BigQuery introspection tool
      if (!bigqueryIntrospectionTool.execute) {
        throw new Error("BigQuery introspection tool is not available");
      }

      const schemaData = await bigqueryIntrospectionTool.execute({
        context: { datasets },
        runtimeContext: runtimeContext || new RuntimeContext(),
      });

      // Type guard to ensure we have schema data
      if (!schemaData || typeof schemaData !== "object") {
        throw new Error("Invalid schema data returned from introspection");
      }

      // Create a human-readable presentation
      const schemaPresentation = createBigQuerySchemaPresentation(schemaData);

      return {
        datasets,
        schema: schemaData as any,
        schemaPresentation,
      };
    } catch (error) {
      throw new Error(
        `Failed to introspect BigQuery datasets: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
});

// Step 3: Get natural language query and generate SQL
const generateSystempromptStep = createStep({
  id: "generate-system-prompt",
  inputSchema: z.object({
    datasets: z.array(
      z.object({
        name: z.string(),
        projectId: z.string().optional(),
        tables: z.array(z.string()),
      })
    ),
    schema: z.object({
      tables: z.array(z.any()),
      columns: z.array(z.any()),
      relationships: z.array(z.any()),
      rowCounts: z.array(z.any()),
      summary: z.object({
        total_datasets: z.number(),
        total_tables: z.number(),
        total_columns: z.number(),
        total_relationships: z.number(),
        projects_accessed: z.array(z.string()),
      }),
    }),
    schemaPresentation: z.string(),
  }),
  outputSchema: z.object({ systemPrompt: z.string() }),
  execute: async ({ inputData }) => {
    const { schema } = inputData;

    try {
      console.log("🤖 Generating bigquery system prompt SQL...");

      const schemaDescription = createBigQuerySchemaDescription(schema);
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
      return {
        systemPrompt: systemPrompt,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate BigQuery SQL: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
});


// Define the main BigQuery query workflow
export const bigquerysystemPrompQueryWorkflow = createWorkflow({
  id: "bigquery-system-prompt-workflow-part-1",
  inputSchema: z.object({}),
  outputSchema: z.object({ systemPrompt: z.string() }),
  steps: [getDatasetInfoStep, introspectBigQueryStep, generateSystempromptStep],
});

// Chain the steps together
bigquerysystemPrompQueryWorkflow
  .then(getDatasetInfoStep)
  .then(introspectBigQueryStep)
  .then(generateSystempromptStep)
  .commit();

// Helper function to create human-readable BigQuery schema presentation
function createBigQuerySchemaPresentation(schema: any): string {
  let presentation = "# BigQuery Schema Overview\n\n";

  presentation += `## Summary\n`;
  presentation += `- **Datasets**: ${schema.summary.total_datasets}\n`;
  presentation += `- **Tables**: ${schema.summary.total_tables}\n`;
  presentation += `- **Columns**: ${schema.summary.total_columns}\n`;
  presentation += `- **Relationships**: ${schema.summary.total_relationships}\n`;
  presentation += `- **Projects**: ${schema.summary.projects_accessed.join(", ")}\n\n`;

  // Group columns by project, dataset, and table
  const tableColumns = new Map<string, any[]>();
  schema.columns.forEach((column: any) => {
    const tableKey = `${column.project_id}.${column.dataset_name}.${column.table_name}`;
    if (!tableColumns.has(tableKey)) {
      tableColumns.set(tableKey, []);
    }
    tableColumns.get(tableKey)?.push(column);
  });

  presentation += `## Tables and Columns\n\n`;

  schema.tables.forEach((table: any) => {
    const tableKey = `${table.project_id}.${table.dataset_name}.${table.table_name}`;
    const columns = tableColumns.get(tableKey) || [];
    const rowCount = schema.rowCounts.find(
      (rc: any) =>
        rc.project_id === table.project_id &&
        rc.dataset_name === table.dataset_name &&
        rc.table_name === table.table_name
    );

    presentation += `### \`${table.project_id}.${table.dataset_name}.${table.table_name}\``;
    if (rowCount && rowCount.row_count !== null) {
      presentation += ` (${rowCount.row_count.toLocaleString()} rows)`;
    } else if (rowCount && rowCount.error) {
      presentation += ` (Row count unavailable)`;
    }
    presentation += `\n\n`;

    presentation += `**Type**: ${table.table_type}\n`;
    if (table.creation_time) {
      presentation += `**Created**: ${table.creation_time}\n`;
    }
    presentation += `\n`;

    presentation += `| Column | Type | Nullable | Primary Key | Position |\n`;
    presentation += `|--------|------|----------|-------------|----------|\n`;

    // Sort columns by ordinal position
    const sortedColumns = columns.sort(
      (a, b) => a.ordinal_position - b.ordinal_position
    );

    sortedColumns.forEach((column: any) => {
      const nullable = column.is_nullable === "YES" ? "✓" : "✗";
      const primaryKey = column.is_primary_key ? "✓" : "";

      presentation += `| ${column.column_name} | ${column.data_type} | ${nullable} | ${primaryKey} | ${column.ordinal_position} |\n`;
    });

    presentation += `\n`;
  });

  if (schema.relationships.length > 0) {
    presentation += `## Potential Relationships (ID-like columns)\n\n`;

    const relationshipsByTable = new Map<string, any[]>();
    schema.relationships.forEach((rel: any) => {
      const tableKey = `${rel.project_id}.${rel.dataset_name}.${rel.table_name}`;
      if (!relationshipsByTable.has(tableKey)) {
        relationshipsByTable.set(tableKey, []);
      }
      relationshipsByTable.get(tableKey)?.push(rel);
    });

    relationshipsByTable.forEach((rels, tableKey) => {
      presentation += `**Table**: \`${tableKey}\`\n`;
      rels.forEach((rel: any) => {
        presentation += `- ${rel.column_name} (${rel.data_type})`;
        if (rel.is_nullable === "NO") {
          presentation += " [NOT NULL]";
        }
        presentation += "\n";
      });
      presentation += `\n`;
    });
  }

  presentation += `---\n\n`;
  presentation += `**BigQuery schema introspection complete!**\n`;
  presentation += `You can now use this information to:\n`;
  presentation += `- Generate BigQuery SQL queries from natural language\n`;
  presentation += `- Understand table relationships and structure\n`;
  presentation += `- Analyze data distribution across projects and datasets\n`;
  presentation += `- Leverage BigQuery-specific features and optimizations\n`;

  return presentation;
}
