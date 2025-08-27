import { BigQuery } from "@google-cloud/bigquery";
import z from "zod";
import { createTool } from "@mastra/core";
import {
  BigQueryRowSchema,
  ServiceAccountSchema,
} from "../../Types/validation";

export function createBigQueryClient() {
  const credentials = {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
  };

  ServiceAccountSchema.parse(credentials); // Validate at runtime
  return new BigQuery({
    projectId: process.env.BIGQUERY_PROJECT_ID,
    credentials,
  });
}

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

export const excuteBigQueryTool = createTool({
  id: "excute-bigquery",
  description: "excute slq query on bigquery",
  inputSchema: z.object({
    sql: z.string().describe("query to be excuted"),
  }),
  outputSchema: z.array(z.record(z.any())),
  execute: async ({ context }) => {
    return await executeQuerytool(context.sql);
  },
});
