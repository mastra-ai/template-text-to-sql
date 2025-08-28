import { BigQuery } from "@google-cloud/bigquery";
import z from "zod";
import { createTool } from "@mastra/core";
import {
  BigQueryRowSchema,
  StackoverflowDatasetsSchema,
} from "../../Types/validation";
import { createBigQueryClient } from "./bigquery-connextion";

export async function executeQuery(client: BigQuery, sql: string) {
  try {
    const [job] = await client.createQueryJob({ query: sql });
    const [rows] = await job.getQueryResults();
    // Validate each row
    const validatedRows = rows.map((row) => BigQueryRowSchema.parse(row));
    return validatedRows;
  } catch (error: any) {
    throw new Error(`BigQuery Error: ${error.message}`);
  }
}

export async function executeQuerytool(sql: string) {
  try {
    const client = createBigQueryClient();
    const [job] = await client.createQueryJob({ query: sql });
    const [rows] = await job.getQueryResults();
    // Validate each row
    const validatedRows = rows.map((row) => BigQueryRowSchema.parse(row));
    return validatedRows;
  } catch (error: any) {
    throw new Error(`BigQuery Error: ${error.message}`);
  }
}

// Helper function to parse project.dataset format and validate project ID
function parseProjectDataset(input: string): {
  projectId: string;
  datasetId: string;
} {
  const parts = input.split(".");
  if (parts.length === 2) {
    const [projectId, datasetId] = parts;
    // Validate project ID format - must be 6-63 characters total
    // Must start with lowercase letter, contain only lowercase letters, digits, or dashes
    // Must not end with a dash
    if (!/^[a-z][a-z0-9-]{5,62}$/.test(projectId) || projectId.endsWith("-")) {
      throw new Error(
        `Invalid project ID format: ${projectId}. Project IDs must contain 6-63 lowercase letters, digits, or dashes, start with a letter, and not end with a dash.`
      );
    }
    return { projectId, datasetId };
  }
  throw new Error(`Invalid project.dataset format: ${input}`);
}

// Helper function to validate dataset and table names for SQL injection prevention
function validateIdentifier(name: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(name);
}

export const bigqueryIntrospectionTool = createTool({
  id: "bigquery-introspection",
  description:
    "Introspects BigQuery datasets to understand their schema, tables, columns, and relationships. Supports cross-project access when projectId is specified for datasets.",
  inputSchema: StackoverflowDatasetsSchema,
  execute: async ({ context }) => {
    console.log("starting bigqueryIntrospectionTool!!");
    const defaultProjectId = process.env.BIGQUERY_PROJECT_ID;
    if (!defaultProjectId) {
      throw new Error("BIGQUERY_PROJECT_ID environment variable is required");
    }

    // Validate all dataset and table names to prevent SQL injection
    if (context.datasets.length === 0) {
      throw new Error("At least one dataset is required");
    }

    const allTables: any[] = [];
    const allColumns: any[] = [];
    const allRelationships: any[] = [];
    const allRowCounts: any[] = [];

    console.log("🔌 Starting BigQuery introspection...");
    console.log("🔌 context.datasets...", context.datasets);

    for (const dataset of context.datasets) {
      // Handle cases where dataset.name might contain project.dataset format
      let projectId: string;
      let datasetName: string;

      if (dataset.projectId) {
        // Explicit project ID provided
        projectId = dataset.projectId;
        datasetName = dataset.name;
      } else if (dataset.name.includes(".")) {
        // Parse project.dataset format from dataset name
        try {
          const parsed = parseProjectDataset(dataset.name);
          projectId = parsed.projectId;
          datasetName = parsed.datasetId;
          console.log(
            `🔍 Parsed dataset name "${dataset.name}" as project: ${projectId}, dataset: ${datasetName}`
          );
        } catch (error) {
          console.log(
            `⚠️ Failed to parse "${dataset.name}" as project.dataset format, using as dataset name with default project`
          );
          projectId = defaultProjectId;
          datasetName = dataset.name;
        }
      } else {
        // Use default project ID
        projectId = defaultProjectId;
        datasetName = dataset.name;
      }

      console.log(
        `📊 Processing dataset: ${datasetName} in project: ${projectId}`
      );

      try {
        // Get tables metadata for this dataset
        const tablesListold = dataset.tables
          .map((table) => `'${table}'`)
          .join(", ");
        const tablesList = tablesListold
          .replace(/['"]/g, "") // Remove all quotes
          .split(",") // Split by comma
          .map((table) => `'${table.trim()}'`) // Trim whitespace and add single quotes
          .join(", ");

        const tablesQuery = `
          SELECT
            table_schema AS dataset_name,
            table_catalog AS project_id,
            table_name,
            table_type,
            creation_time,
            ddl
          FROM \`${projectId}.${datasetName}\`.INFORMATION_SCHEMA.TABLES
          WHERE table_name IN (${tablesList})
          ORDER BY table_name
        `;

        const tables = await executeQuerytool(tablesQuery);
        // Add project ID to table results for cross-project identification and fix creation_time format
        const tablesWithProject = tables.map((table: any) => ({
          ...table,
          project_id: projectId,
          // Extract the string value from creation_time object if it exists
          creation_time: table.creation_time?.value || table.creation_time,
        }));
        allTables.push(...tablesWithProject);

        // Get row counts for tables in this dataset using __TABLES__ metadata
        try {
          const rowCountQuery = `
            SELECT
              table_id AS table_name,
              row_count
            FROM \`${projectId}.${datasetName}.__TABLES__\`
            WHERE table_id IN (${tablesList})
          `;

          const rowCountResults = await executeQuerytool(rowCountQuery);
          const processedRowCounts = rowCountResults.map((row: any) => ({
            project_id: projectId,
            dataset_name: datasetName,
            table_name: row.table_name,
            row_count: row.row_count
              ? parseInt(row.row_count.toString())
              : null,
          }));
          allRowCounts.push(...processedRowCounts);
        } catch (rowCountError) {
          console.log(
            `    ⚠️ Could not fetch row counts for dataset ${datasetName}: ${rowCountError}`
          );
          // Add entries with null row counts for all tables
          for (const table of dataset.tables) {
            allRowCounts.push({
              project_id: projectId,
              dataset_name: datasetName,
              table_name: table,
              row_count: null,
              error:
                rowCountError instanceof Error
                  ? rowCountError.message
                  : String(rowCountError),
            });
          }
        }

        // Get columns for all tables in this dataset at once
        try {
          const columnsQuery = `
            SELECT
              table_schema AS dataset_name,
              table_name,
              column_name,
              data_type,
              is_nullable,
              ordinal_position
            FROM \`${projectId}\`.${datasetName}.INFORMATION_SCHEMA.COLUMNS
            WHERE table_name IN (${tablesList})
            ORDER BY table_name, ordinal_position
          `;

          const columns = await executeQuerytool(columnsQuery);

          // Get primary key information for all tables (if any)
          let primaryKeyColumns: any[] = [];
          try {
            const primaryKeyQuery = `
              SELECT
                kcu.table_name,
                kcu.column_name
              FROM \`${projectId}.${datasetName}\`.INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
              JOIN \`${projectId}.${datasetName}\`.INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
                ON kcu.constraint_name = tc.constraint_name
                AND kcu.table_schema = tc.table_schema
                AND kcu.table_name = tc.table_name
              WHERE tc.constraint_type = 'PRIMARY KEY'
                AND kcu.table_name IN (${tablesList})
            `;

            const pkResults = await executeQuerytool(primaryKeyQuery);
            primaryKeyColumns = pkResults;
          } catch (error) {
            // Primary key constraints may not be available in all BigQuery datasets
            console.log(
              `    ⚠️ Could not fetch primary keys for dataset ${datasetName}: ${error}`
            );
          }

          // Mark primary key columns and add project ID to results
          const enhancedColumns = columns.map((col: any) => ({
            ...col,
            project_id: projectId,
            is_primary_key: primaryKeyColumns.some(
              (pk: any) =>
                pk.table_name === col.table_name &&
                pk.column_name === col.column_name
            ),
          }));
          allColumns.push(...enhancedColumns);

          // Get potential foreign key relationships by identifying ID-like columns
          try {
            const foreignKeyQuery = `
              SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable
              FROM 
                \`${projectId}\`.${datasetName}.INFORMATION_SCHEMA.COLUMNS
              WHERE 
                table_name IN (${tablesList})
                AND (
                    column_name LIKE '%_id' OR 
                    column_name = 'id' OR
                    column_name LIKE '%id%'
                )
              ORDER BY 
                table_name, column_name
            `;
            const relationships = await executeQuerytool(foreignKeyQuery);
            // Add project ID and dataset name to relationship results
            const relationshipsWithProject = relationships.map((rel: any) => ({
              ...rel,
              project_id: projectId,
              dataset_name: datasetName,
            }));
            allRelationships.push(...relationshipsWithProject);
          } catch (error) {
            // ID column detection may fail in some cases
            console.log(
              `    ⚠️ Could not fetch ID columns for dataset ${datasetName}: ${error}`
            );
          }
        } catch (error) {
          console.log(
            `    ⚠️ Could not fetch columns for dataset ${datasetName}: ${error}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing dataset ${datasetName} in project ${projectId}:`,
          error
        );
        // Add error entries for all tables in this dataset
        for (const table of dataset.tables) {
          allRowCounts.push({
            project_id: projectId,
            dataset_name: datasetName,
            table_name: table,
            row_count: null,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    console.log("✅ BigQuery introspection completed");

    return {
      tables: allTables,
      columns: allColumns,
      relationships: allRelationships,
      rowCounts: allRowCounts,
      summary: {
        total_datasets: context.datasets.length,
        total_tables: allTables.length,
        total_columns: allColumns.length,
        total_relationships: allRelationships.length,
        projects_accessed: [
          ...new Set(
            context.datasets.map((d) => d.projectId || defaultProjectId)
          ),
        ],
      },
    };
  },
});
