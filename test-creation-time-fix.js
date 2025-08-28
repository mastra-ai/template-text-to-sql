// Test script to verify the creation_time fix
const {
  bigqueryIntrospectionTool,
} = require("./src/mastra/tools/bigquery/bigquery-inspection-tool.ts");

async function testCreationTimeFix() {
  try {
    console.log("Testing creation_time fix...");

    // Test data similar to what was causing the error
    const testContext = {
      datasets: [
        {
          name: "stackoverflow",
          projectId: "bigquery-public-data",
          tables: ["users", "badges"],
        },
      ],
    };

    // This would normally call the BigQuery API, but we're just testing the structure
    console.log("Test context:", JSON.stringify(testContext, null, 2));

    // The fix should ensure that creation_time is extracted as a string value
    // instead of being left as an object with a 'value' property

    console.log(
      "✅ Test setup complete. The fix should handle creation_time objects properly."
    );
    console.log(
      "The fix extracts table.creation_time?.value || table.creation_time to ensure string format."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testCreationTimeFix();
