# BigQuery Cross-Project Access Update

This document describes the updates made to the BigQuery introspection tool to support accessing datasets and tables across multiple projects, not just the current project.

## Overview

The `bigqueryIntrospectionTool` has been enhanced to allow the Google service account to access datasets and tables from external projects like `bigquery-public-data.stackoverflow` and other projects the service account has permissions for.

## Key Changes

### 1. Updated Validation Schema

**File:** `src/mastra/Types/validation.ts`

The `StackoverflowDatasetsSchema` now includes an optional `projectId` field:

```typescript
export const StackoverflowDatasetsSchema = z.object({
  datasets: z.array(
    z.object({
      name: z.string(),
      projectId: z.string().optional().describe("Optional project ID for cross-project access. If not provided, uses BIGQUERY_PROJECT_ID from environment"),
      tables: z.array(z.string()),
    })
  ),
});
```

### 2. Enhanced BigQuery Introspection Tool

**File:** `src/mastra/tools/bigquery/bigquery-inspection-tool.ts`

Key improvements:

- **Cross-project support**: Each dataset can specify its own `projectId`
- **Fallback mechanism**: Uses `BIGQUERY_PROJECT_ID` from environment when no `projectId` is specified
- **Enhanced validation**: Added `validateProjectId()` function to prevent SQL injection
- **Project identification**: All result objects now include `project_id` for clear identification
- **Summary enhancement**: Added `projects_accessed` array to show which projects were queried

### 3. Updated BigQuery Agent

**File:** `src/mastra/agents/bigquery-sql-agent.ts`

- Added the `bigqueryIntrospectionTool` to the agent's available tools
- Agent can now perform cross-project dataset introspection

## Usage Examples

### Example 1: Mixed Projects (Default + External)

```javascript
const mixedProjectsExample = {
  datasets: [
    {
      name: "stackoverflow",
      projectId: "bigquery-public-data", // External project
      tables: ["posts_questions", "posts_answers", "users"]
    },
    {
      name: "my_dataset", // Uses default project from BIGQUERY_PROJECT_ID
      tables: ["my_table1", "my_table2"]
    }
  ]
};
```

### Example 2: All External Projects

```javascript
const allExternalExample = {
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
```

### Example 3: Backward Compatibility

```javascript
// This still works exactly as before
const backwardCompatible = {
  datasets: [
    {
      name: "my_dataset",
      tables: ["table1", "table2"] // Uses BIGQUERY_PROJECT_ID
    }
  ]
};
```

## Security Features

### Input Validation

1. **Dataset names**: Must match `/^[A-Za-z0-9_]+$/` (alphanumeric + underscores)
2. **Table names**: Must match `/^[A-Za-z0-9_]+$/` (alphanumeric + underscores)  
3. **Project IDs**: Must match `/^[a-z0-9\-]+$/` (lowercase letters, numbers, hyphens)

### SQL Injection Prevention

All identifiers are validated before being used in SQL queries to prevent injection attacks.

## Result Structure

The tool now returns enhanced results with project identification:

```javascript
{
  tables: [
    {
      dataset_name: "stackoverflow",
      table_name: "posts_questions",
      table_type: "BASE TABLE",
      project_id: "bigquery-public-data", // NEW: Project identification
      creation_time: "2023-01-01T00:00:00Z",
      last_altered_time: "2023-01-01T00:00:00Z"
    }
  ],
  columns: [
    {
      dataset_name: "stackoverflow", 
      table_name: "posts_questions",
      column_name: "id",
      data_type: "INT64",
      project_id: "bigquery-public-data", // NEW: Project identification
      is_primary_key: false
    }
  ],
  relationships: [...], // Also includes project_id
  rowCounts: [...],     // Also includes project_id
  summary: {
    total_datasets: 2,
    total_tables: 5,
    total_columns: 50,
    total_relationships: 3,
    projects_accessed: ["bigquery-public-data", "apitranslate-316220"] // NEW
  }
}
```

## Prerequisites

### Service Account Permissions

Your Google service account must have the following permissions for external projects:

1. **BigQuery Data Viewer** role on the target datasets
2. **BigQuery Metadata Viewer** role on the target projects
3. Access to `INFORMATION_SCHEMA` views in the target projects

### Common Public Datasets

Popular public datasets you can access (if your service account has permissions):

- `bigquery-public-data.stackoverflow.*`
- `bigquery-public-data.github_repos.*`
- `bigquery-public-data.census_bureau_usa.*`
- `bigquery-public-data.covid19_public_forecasts.*`

## Error Handling

The tool gracefully handles:

- **Permission errors**: Logs warnings and continues with other datasets
- **Invalid project IDs**: Throws validation errors before execution
- **Network issues**: Provides detailed error messages
- **Missing datasets/tables**: Logs errors and includes them in results

## Backward Compatibility

✅ **Fully backward compatible** - existing code will continue to work without any changes.

The `projectId` field is optional, so all existing implementations will use the default project from `BIGQUERY_PROJECT_ID` environment variable.

## Testing

See `test-cross-project-access.js` for example configurations and test cases.

## Environment Variables

Required environment variables remain the same:

```bash
BIGQUERY_PROJECT_ID=your-default-project-id
GOOGLE_TYPE=service_account
GOOGLE_PROJECT_ID=your-service-account-project
GOOGLE_PRIVATE_KEY_ID=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_CLIENT_EMAIL=...
# ... other Google Cloud credentials
```

## Benefits

1. **🌐 Cross-project access**: Query datasets from multiple Google Cloud projects
2. **🔒 Secure**: Enhanced validation prevents SQL injection attacks  
3. **🔄 Backward compatible**: Existing code continues to work unchanged
4. **📊 Enhanced results**: Clear project identification in all results
5. **🛡️ Error resilient**: Graceful handling of permission and network issues
6. **📈 Scalable**: Support for any number of projects and datasets

This update enables powerful cross-project analytics while maintaining security and backward compatibility.
