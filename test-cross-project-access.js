// Test script to demonstrate cross-project BigQuery access
// This shows how to use the updated bigqueryIntrospectionTool with external projects

const testCrossProjectAccess = {
  // Example 1: Mix of default project and external project datasets
  datasets: [
    {
      name: "stackoverflow", // This will use bigquery-public-data project
      projectId: "bigquery-public-data",
      tables: ["posts_questions", "posts_answers", "users"]
    },
    {
      name: "my_dataset", // This will use the default project from BIGQUERY_PROJECT_ID
      tables: ["my_table1", "my_table2"]
      // No projectId specified, so it uses the default from environment
    },
    {
      name: "census_bureau_usa", // Another external project example
      projectId: "bigquery-public-data", 
      tables: ["population_by_zip_2010"]
    }
  ]
};

// Example 2: All external projects
const allExternalProjects = {
  datasets: [
    {
      name: "stackoverflow",
      projectId: "bigquery-public-data",
      tables: ["posts_questions", "posts_answers"]
    },
    {
      name: "github_repos", 
      projectId: "bigquery-public-data",
      tables: ["commits", "files"]
    }
  ]
};

console.log("Test configurations for cross-project BigQuery access:");
console.log("\n1. Mixed projects (default + external):");
console.log(JSON.stringify(testCrossProjectAccess, null, 2));

console.log("\n2. All external projects:");
console.log(JSON.stringify(allExternalProjects, null, 2));

console.log("\nKey improvements in the updated tool:");
console.log("- ✅ Supports optional projectId for each dataset");
console.log("- ✅ Falls back to BIGQUERY_PROJECT_ID when projectId not specified");
console.log("- ✅ Validates project IDs to prevent SQL injection");
console.log("- ✅ Includes project_id in all result objects for identification");
console.log("- ✅ Shows projects_accessed in summary for transparency");
console.log("- ✅ Maintains backward compatibility with existing code");

module.exports = {
  testCrossProjectAccess,
  allExternalProjects
};
