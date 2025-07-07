import { mastra } from "./mastra";
import * as readline from 'readline';

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function runInteractiveDatabaseWorkflow() {
  try {
    console.log("🚀 Starting Interactive Database Query Workflow");
    console.log("=" .repeat(60));

    // Get the workflow
    const workflow = mastra.getWorkflow("databaseQueryWorkflow");

    // Create a run
    const run = await workflow.createRunAsync();

    // Start the workflow (it will suspend immediately)
    let result = await run.start({
      inputData: {},
    });

    // Step 1: Get connection string
    if (result.status === "suspended") {
      console.log("\n📡 Step 1: Database Connection");
      console.log("-".repeat(40));

      const connectionString = await askQuestion(
        "Please enter your PostgreSQL connection string\n(e.g., postgresql://user:password@localhost:5432/database): "
      );

      console.log("\n🔍 Introspecting database schema...");

      result = await run.resume({
        step: "get-connection-and-introspect",
        resumeData: {
          connectionString,
        },
      });

      if (result.status === "failed") {
        console.error("❌ Failed to connect or introspect database:", result.error);
        rl.close();
        return;
      }

      console.log("✅ Database schema introspected successfully!");
    }

    // Step 2: Get natural language query
    if (result.status === "suspended") {
      console.log("\n🤖 Step 2: Natural Language Query");
      console.log("-".repeat(40));

      // Show schema information from suspend data
      if ('suspended' in result && result.suspended.length > 0) {
        const stepData = result.steps["generate-sql"];
        if (stepData && 'suspendData' in stepData && stepData.suspendData) {
          const suspendData = stepData.suspendData as any;
          if (suspendData.schemaPresentation) {
            console.log("\n📋 Database Schema:");
            console.log(suspendData.schemaPresentation);
          }
        }
      }

      const naturalLanguageQuery = await askQuestion(
        "\nPlease enter your query in natural language\n(e.g., 'Show me the top 10 cities by population'): "
      );

      console.log("\n🧠 Generating SQL query...");

      result = await run.resume({
        step: "generate-sql",
        resumeData: {
          naturalLanguageQuery,
        },
      });

      if (result.status === "failed") {
        console.error("❌ Failed to generate SQL:", result.error);
        rl.close();
        return;
      }

      console.log("✅ SQL query generated successfully!");
    }

    // Step 3: Review and execute SQL
    if (result.status === "suspended") {
      console.log("\n📝 Step 3: SQL Review and Execution");
      console.log("-".repeat(40));

      // Show generated SQL from suspend data
      if ('suspended' in result && result.suspended.length > 0) {
        const stepData = result.steps["review-and-execute"];
        if (stepData && 'suspendData' in stepData && stepData.suspendData) {
          const suspendData = stepData.suspendData as any;
          if (suspendData.generatedSQL) {
            const sql = suspendData.generatedSQL;
            console.log("\n🔍 Generated SQL Query:");
            console.log("─".repeat(50));
            console.log(`📊 SQL: ${sql.sql}`);
            console.log(`📖 Explanation: ${sql.explanation}`);
            console.log(`🎯 Confidence: ${(sql.confidence * 100).toFixed(1)}%`);
            console.log(`📋 Tables Used: ${sql.tables_used.join(", ")}`);
            if (sql.assumptions.length > 0) {
              console.log(`💭 Assumptions: ${sql.assumptions.join(", ")}`);
            }
            console.log("─".repeat(50));
          }
        }
      }

      const approved = await askQuestion(
        "\nDo you want to execute this SQL query? (y/n): "
      );

      let modifiedSQL: string | undefined;
      if (approved.toLowerCase() !== 'y' && approved.toLowerCase() !== 'yes') {
        const modify = await askQuestion(
          "Would you like to modify the SQL query? (y/n): "
        );

        if (modify.toLowerCase() === 'y' || modify.toLowerCase() === 'yes') {
          modifiedSQL = await askQuestion(
            "Please enter your modified SQL query: "
          );
        }
      }

      const isApproved = approved.toLowerCase() === 'y' || approved.toLowerCase() === 'yes' || !!modifiedSQL;

      if (isApproved) {
        console.log("\n⚡ Executing SQL query...");
      }

      result = await run.resume({
        step: "review-and-execute",
        resumeData: {
          approved: isApproved,
          modifiedSQL,
        },
      });
    }

    // Show final results
    console.log("\n🎉 Workflow Results");
    console.log("=".repeat(60));

    if (result.status === "success" && 'result' in result) {
      console.log(`✅ Success: ${result.result.success}`);
      console.log(`📝 Final SQL: ${result.result.finalSQL}`);
      console.log(`📊 Row Count: ${result.result.rowCount || 0}`);

      if (result.result.modifications) {
        console.log(`🔧 Modifications: ${result.result.modifications}`);
      }

      if (result.result.success && result.result.queryResult && result.result.queryResult.length > 0) {
        console.log("\n📋 Query Results (first 10 rows):");
        console.table(result.result.queryResult.slice(0, 10));
      } else if (!result.result.success) {
        console.log(`❌ Execution failed: ${(result.result as any).error || 'Unknown error'}`);
      }
    } else if (result.status === "failed") {
      console.log(`❌ Workflow failed: ${result.error}`);
    } else {
      console.log("⚠️  Workflow ended in unexpected state:", result.status);
    }

  } catch (error) {
    console.error("💥 Unexpected error:", error);
  } finally {
    rl.close();
  }
}

async function main() {
  console.log("🔧 Interactive Database Query Workflow Demo");
  console.log("This demo will walk you through each step of the workflow\n");

  await runInteractiveDatabaseWorkflow();

  console.log("\n👋 Demo completed. Thank you!");
}

if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
  });
}

export { runInteractiveDatabaseWorkflow };
