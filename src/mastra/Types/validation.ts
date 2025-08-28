import { z } from "zod";

// Service Account JSON structure
export const ServiceAccountSchema = z.object({
  type: z.literal("service_account"),
  project_id: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_email: z.string().email(),
  client_id: z.string(),
  auth_uri: z.string().url(),
  token_uri: z.string().url(),
  auth_provider_x509_cert_url: z.string().url(),
  client_x509_cert_url: z.string().url(),
});

// BigQuery result row
export const BigQueryRowSchema = z.record(z.any());

export const StackoverflowDatasetsSchema = z.object({
  datasets: z.array(
    z.object({
      name: z.string(),
      projectId: z.string().optional().describe("Optional project ID for cross-project access. If not provided, uses BIGQUERY_PROJECT_ID from environment"),
      tables: z.array(z.string()),
    })
  ),
});

// Define the schema for BigQuery SQL generation output
export const bigQueryGenerationSchema = z.object({
  sql: z.string().describe("The generated BigQuery SQL query"),
  explanation: z.string().describe("Explanation of what the query does"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence level in the generated query (0-1)"),
  assumptions: z
    .array(z.string())
    .describe("Any assumptions made while generating the query"),
  tables_used: z
    .array(z.string())
    .describe(
      "List of tables used in the query (in project.dataset.table format)"
    ),
});