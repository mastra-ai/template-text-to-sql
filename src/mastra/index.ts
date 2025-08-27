import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { sqlAgent } from "./agents/postgres-sql-agent";
import { databaseQueryWorkflow } from "./workflows/postgres/database-query-workflow";
import { bigQuerySqlAgent } from "./agents/bigquery-sql-agent";

export const mastra = new Mastra({
  agents: { sqlAgent, bigQuerySqlAgent },
  workflows: {
    databaseQueryWorkflow,
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
