import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { bigquerySystemPropmt } from "../systemPrompt/bigqueryAgentPrompt";
import { bigqueryIntrospectionTool } from "../tools/bigquery/bigquery-inspection-tool";
import { excuteBigQueryTool } from "../tools/bigquery/bigquery-query-excution";

/* global process */

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const openRouterGPTagent = new Agent({
  name: "Business Intelligence Agent Instructions with gpt 5",
  instructions: bigquerySystemPropmt(),
  // model: openrouter("deepseek/deepseek-r1-distill-llama-70b:free"),
  // model: openrouter("openai/gpt-5-chat"),
  model: openrouter("openai/gpt-4o-mini"),
  tools: { bigqueryIntrospectionTool, excuteBigQueryTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db", // path is relative to the .mastra/output directory
    }),
  }),
});

export const openRouterDeepR1seekReportAgent = new Agent({
  name: "Business Intelligence Agent Instructions",
  instructions: bigquerySystemPropmt(),
  model: openrouter("deepseek/deepseek-r1-distill-llama-70b:free"),
  // model: openrouter("openai/chatgpt-4o-latest"),
  tools: { excuteBigQueryTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db", // path is relative to the .mastra/output directory
    }),
  }),
});

export const openRouterDeepV3seekReportAgent = new Agent({
  name: "Business Intelligence Agent Instructions",
  instructions: bigquerySystemPropmt(),
  model: openrouter("deepseek/deepseek-chat-v3-0324:free"),
  tools: { excuteBigQueryTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db", // path is relative to the .mastra/output directory
    }),
  }),
});
