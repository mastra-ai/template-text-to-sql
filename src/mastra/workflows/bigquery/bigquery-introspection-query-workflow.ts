import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";
import { bigqueryIntrospectionTool } from "../../tools/bigquery/bigquery-inspection-tool";
import { bigQueryGenerationTool } from "../../tools/bigquery/query-generation-tool";
import { excuteBigQueryTool } from "../../tools/bigquery/bigquery-query-excution";

// Step 1: Get dataset information from user
const getDatasetInfoStep = createStep({
  id: "get-dataset-info",
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
const generateSQLStep = createStep({
  id: "generate-sql",
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
  outputSchema: z.object({
    datasets: z.array(
      z.object({
        name: z.string(),
        projectId: z.string().optional(),
        tables: z.array(z.string()),
      })
    ),
    naturalLanguageQuery: z.string(),
    generatedSQL: z.object({
      sql: z.string(),
      explanation: z.string(),
      confidence: z.number(),
      assumptions: z.array(z.string()),
      tables_used: z.array(z.string()),
    }),
    schemaPresentation: z.string(),
  }),
  resumeSchema: z.object({
    naturalLanguageQuery: z.string(),
  }),
  suspendSchema: z.object({
    schemaPresentation: z.string(),
    message: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend, runtimeContext }) => {
    const { datasets, schema, schemaPresentation } = inputData;

    if (!resumeData?.naturalLanguageQuery) {
      await suspend({
        schemaPresentation,
        message:
          "Please enter your natural language query (e.g., 'Show me the top 10 posts by score', 'Find users with the most reputation'):",
      });

      return {
        datasets,
        naturalLanguageQuery: "",
        generatedSQL: {
          sql: "",
          explanation: "",
          confidence: 0,
          assumptions: [],
          tables_used: [],
        },
        schemaPresentation,
      };
    }

    const { naturalLanguageQuery } = resumeData;

    try {
      console.log("🤖 Generating BigQuery SQL...");

      // Generate SQL from natural language query using BigQuery generation tool
      if (!bigQueryGenerationTool.execute) {
        throw new Error("BigQuery generation tool is not available");
      }

      const generatedSQL = await bigQueryGenerationTool.execute({
        context: {
          naturalLanguageQuery,
          databaseSchema: schema,
        },
        runtimeContext: runtimeContext || new RuntimeContext(),
      });

      // Type guard for generated SQL
      if (!generatedSQL || typeof generatedSQL !== "object") {
        throw new Error("Invalid SQL generation result");
      }

      return {
        datasets,
        naturalLanguageQuery,
        generatedSQL: generatedSQL as any,
        schemaPresentation,
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

// Step 4: Review SQL and execute query
const reviewAndExecuteStep = createStep({
  id: "review-and-execute",
  inputSchema: z.object({
    datasets: z.array(
      z.object({
        name: z.string(),
        projectId: z.string().optional(),
        tables: z.array(z.string()),
      })
    ),
    naturalLanguageQuery: z.string(),
    generatedSQL: z.object({
      sql: z.string(),
      explanation: z.string(),
      confidence: z.number(),
      assumptions: z.array(z.string()),
      tables_used: z.array(z.string()),
    }),
    schemaPresentation: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    finalSQL: z.string(),
    queryResult: z.any(),
    modifications: z.string().optional(),
    rowCount: z.number().optional(),
    error: z.string().optional(),
  }),
  resumeSchema: z.object({
    approved: z.boolean().optional(),
    modifiedSQL: z.string().optional(),
  }),
  suspendSchema: z.object({
    generatedSQL: z.object({
      sql: z.string(),
      explanation: z.string(),
      confidence: z.number(),
      assumptions: z.array(z.string()),
      tables_used: z.array(z.string()),
    }),
    message: z.string(),
  }),
  execute: async ({ inputData, resumeData, suspend, runtimeContext }) => {
    const { naturalLanguageQuery, generatedSQL } = inputData;

    if (!resumeData) {
      await suspend({
        generatedSQL,
        message:
          "Do you want to approve this BigQuery SQL query or make modifications? (approved: true/false, modifiedSQL: 'your modified query' if needed)",
      });

      return {
        success: false,
        finalSQL: generatedSQL.sql,
        queryResult: null,
      };
    }

    const { approved, modifiedSQL } = resumeData;
    const finalSQL = modifiedSQL || generatedSQL.sql;

    if (!approved) {
      return {
        success: false,
        finalSQL,
        queryResult: null,
        modifications: modifiedSQL
          ? "Query was modified but not approved"
          : "Query was not approved",
      };
    }

    try {
      console.log("⚡ Executing BigQuery SQL...");

      // Execute the SQL query using BigQuery execution tool
      if (!excuteBigQueryTool.execute) {
        throw new Error("BigQuery execution tool is not available");
      }

      const result = await excuteBigQueryTool.execute({
        context: {
          sql: finalSQL,
        },
        runtimeContext: runtimeContext || new RuntimeContext(),
      });

      // Type guard for execution result
      if (!result) {
        throw new Error("Invalid BigQuery execution result");
      }

      const executionResult = Array.isArray(result) ? result : [result];

      return {
        success: true,
        finalSQL,
        queryResult: executionResult,
        modifications: modifiedSQL ? "Query was modified by user" : undefined,
        rowCount: executionResult.length,
      };
    } catch (error) {
      return {
        success: false,
        finalSQL,
        queryResult: null,
        modifications: modifiedSQL ? "Query was modified by user" : undefined,
        error: `Failed to execute BigQuery SQL: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
});

// Define the main BigQuery query workflow
export const bigqueryQueryWorkflow = createWorkflow({
  id: "bigquery-query-workflow",
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    finalSQL: z.string(),
    queryResult: z.any(),
    modifications: z.string().optional(),
    rowCount: z.number().optional(),
    error: z.string().optional(),
  }),
  steps: [
    getDatasetInfoStep,
    introspectBigQueryStep,
    generateSQLStep,
    reviewAndExecuteStep,
  ],
});

// Chain the steps together
bigqueryQueryWorkflow
  .then(getDatasetInfoStep)
  .then(introspectBigQueryStep)
  .then(generateSQLStep)
  .then(reviewAndExecuteStep)
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
