import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";
import { bigqueryIntrospectionTool } from "../../tools/bigquery/bigquery-inspection-tool";
import { bigQueryGenerationTool } from "../../tools/bigquery/query-generation-tool";
import { excuteBigQueryTool } from "../../tools/bigquery/bigquery-query-excution";
import { generateSQLSystemPrompt } from "../../systemPrompt/bigqueyAgentgeneratesqlSystemprompt";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { bigQueryGenerationSchema } from "../../Types/validation";

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
// Step 1: Get natural language query and generate SQL
const generateSQLStep = createStep({
  id: "generate-bigquery-sql",
  inputSchema: z.object({ naturalLanguageQuery: z.string() }),
  outputSchema: z.object({
    naturalLanguageQuery: z.string(),
    generatedSQL: z.object({
      sql: z.string(),
      explanation: z.string(),
      confidence: z.number(),
      assumptions: z.array(z.string()),
      tables_used: z.array(z.string()),
    }),
  }),
  execute: async ({ inputData }) => {
    const { naturalLanguageQuery } = inputData;

    try {
      console.log("🤖 Generating BigQuery SQL...");

      // Generate SQL from natural language query using BigQuery generation tool
      const systemPrompt = generateSQLSystemPrompt();
      const userPrompt = `Generate a BigQuery SQL query for this question: "${naturalLanguageQuery}"

Please provide:
1. The BigQuery SQL query (using Standard SQL syntax)
2. A clear explanation of what the query does
3. Your confidence level (0-1)
4. Any assumptions you made
5. List of tables used (in project.dataset.table format)`;

      const result = await generateObject({
        model: openrouter("gpt-4o"),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        schema: bigQueryGenerationSchema,
        temperature: 0.1, // Low temperature for more deterministic results
      });

      const resultObject = result.object;
      console.log(resultObject);
      // Type guard for generated SQL
      if (!resultObject.sql || typeof resultObject.sql !== "string") {
        throw new Error("Invalid SQL generation result");
      }

      return {
        naturalLanguageQuery,
        generatedSQL: resultObject,
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
    naturalLanguageQuery: z.string(),
    generatedSQL: z.object({
      sql: z.string(),
      explanation: z.string(),
      confidence: z.number(),
      assumptions: z.array(z.string()),
      tables_used: z.array(z.string()),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    naturalLanguageQuery: z.string(),
    rowCount: z.number().optional(),
    queryResult: z.any(),
    sql: z.string(),
    explanation: z.string(),
    confidence: z.number(),
    assumptions: z.array(z.string()),
    tables_used: z.array(z.string()),
    error: z.string().optional(),
  }),
  execute: async ({ inputData, runtimeContext }) => {
    const { naturalLanguageQuery, generatedSQL } = inputData;
    const finalSQL = generatedSQL.sql;

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
        rowCount: executionResult.length,
        naturalLanguageQuery,
        ...generatedSQL,
        queryResult: executionResult,
      };
    } catch (error) {
      return {
        success: false,
        ...generatedSQL,
        queryResult: null,
        naturalLanguageQuery,
        error: `Failed to execute BigQuery SQL: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  },
});

// Define the main BigQuery query workflow
export const bigqueryQueryWorkflowPart2 = createWorkflow({
  id: "bigquery-generate-excute-query-workflow-part-2",
  inputSchema: z.object({ naturalLanguageQuery: z.string() }),
  outputSchema: z.object({
    success: z.boolean(),
    finalSQL: z.string(),
    queryResult: z.any(),
    modifications: z.string().optional(),
    rowCount: z.number().optional(),
    error: z.string().optional(),
  }),
  steps: [generateSQLStep, reviewAndExecuteStep],
});

// Chain the steps together
bigqueryQueryWorkflowPart2
  .then(generateSQLStep)
  .then(reviewAndExecuteStep)
  .commit();
