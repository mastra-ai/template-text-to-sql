import { createOpenAI, openai } from "@ai-sdk/openai";
// import { openrouter } from "@ai-sdk/openrouter"; // Not available yet
// import { google } from "@ai-sdk/google"; // Not available yet
import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { bigqueryIntrospectionTool } from "../tools/bigquery/bigquery-inspection-tool";
import { excuteBigQueryTool } from "../tools/bigquery/bigquery-query-excution";
import { bigQueryGenerationTool } from "../tools/bigquery/query-generation-tool";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { AnswerRelevancyMetric, HallucinationMetric } from "@mastra/evals/llm";
import { ToneConsistencyMetric } from "@mastra/evals/nlp";
import { generateSQLSystemPrompt } from "../systemPrompt/bigqueyAgentgeneratesqlSystemprompt";

const model = getProviderModel();

const promptContext: string = generateSQLSystemPrompt()

const hallucinationMetric = new HallucinationMetric(model, {
  scale: 1,
  context: [promptContext],
});

const answerRelevancyMetric = new AnswerRelevancyMetric(model, {
    uncertaintyWeight: 0.5,
    scale: 1,
});

const toneConsistencyMetric = new ToneConsistencyMetric();


/**
 * Returns the model instance for the selected provider.
 * Only "openai" is currently supported. "openrouter" and "google" are stubs.
 */

// Initialize memory with LibSQLStore for persistence
const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../mastra.db", // Or your database URL
  }),
});

export const bigQuerySqlAgent = new Agent({
  name: "BigQuery Analytics Agent ",
  instructions: promptContext,
  model,
  tools: {
    "excute-bigquery": excuteBigQueryTool,
    "bigquery-introspection": bigqueryIntrospectionTool,
    "bigquery-generation": bigQueryGenerationTool,
  },
  memory,
  evals: {
    toneConsistencyMetric,
    answerRelevancyMetric,
    hallucinationMetric,
  },
});
  
  function getProviderModel() {
    const provider = process.env.PROVIDER || "openrouter";
    if (provider === "openai") {
      return openai("gpt-4o-mini");
    }
    // Stub for OpenRouter support
    if (provider === "openrouter") {
      const openrouter = createOpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      });
      return openrouter("gpt-4.1");
    }
    // Stub for Google support
    if (provider === "google") {
      throw new Error(
        "Google provider is not yet supported. Please use PROVIDER=openai."
      );
      // return google("models/gemini-1.5-pro-latest");
    }
    throw new Error(
      "Unsupported PROVIDER: " +
        provider +
        ". Only 'openai' is currently supported."
    );
  }