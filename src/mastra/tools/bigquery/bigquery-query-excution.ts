import { createTool } from "@mastra/core";
import { BigQueryRowSchema } from "../../Types/validation";
import { createBigQueryClient } from "./bigquery-connextion";
import z from "zod";

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
