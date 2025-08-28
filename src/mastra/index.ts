import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { sqlAgent } from "./agents/postgres-sql-agent";
import { databaseQueryWorkflow } from "./workflows/postgres/database-query-workflow";
import { bigQuerySqlAgent } from "./agents/bigquery-sql-agent";
import { openRouterGPTagent } from "./agents/openrouter";
import { bigqueryQueryWorkflow } from "./workflows/bigquery/bigquery-introspection-query-workflow";
import { bigquerysystemPrompQueryWorkflow } from "./workflows/bigquery/bigquery-generate-systemPrompt-part1";
import { bigqueryQueryWorkflowPart2 } from "./workflows/bigquery/bigquery-query-workflow-part2";

export const mastra = new Mastra({
  agents: {
    sqlAgent,
    bigQuerySqlAgent,
    openRouterGPTagent,
  },
  workflows: {
    databaseQueryWorkflow,
    bigqueryQueryWorkflow,
    bigquerysystemPrompQueryWorkflow,
    bigqueryQueryWorkflowPart2,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
