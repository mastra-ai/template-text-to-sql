# BigQuery PostgreSQL Text-to-SQL Project

A comprehensive Mastra workflow system for BigQuery data analytics and natural language to SQL conversion. This project provides tools for analyzing BigQuery datasets, generating SQL queries from natural language descriptions, and executing queries safely using Google Cloud BigQuery.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.9.0
- Google Cloud Project with BigQuery API enabled
- Google Cloud Service Account with BigQuery permissions

### Clone and Setup

1. **Clone the repository:**
```bash
git clone https://github.com/The-Caesar/bigquery-postgres-text-to-sql.git
cd bigquery-postgres-text-to-sql
```

2. **Install dependencies:**
```bash
npm install
# or
pnpm install
```

3. **Environment Configuration:**
Copy the example environment file and configure your credentials:
```bash
cp .env.example .env
```

4. **Configure your `.env` file** (see [Environment Setup](#environment-setup) section below)

5. **Run the development server:**
```bash
npm run dev
# or
pnpm dev
```

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# AI API Keys
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key

# BigQuery Configuration
BIGQUERY_PROJECT_ID=your-bigquery-project-id

# Google Cloud Service Account Credentials
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GOOGLE_TYPE=service_account
GOOGLE_PROJECT_ID=your-google-cloud-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com
GOOGLE_UNIVERSE_DOMAIN=googleapis.com

# Optional
PROVIDER=your-preferred-ai-provider
POSTHOG_DISABLED=true
```

### 🔑 Google Cloud Service Account Setup

#### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID (you'll need this for `GOOGLE_PROJECT_ID` and `BIGQUERY_PROJECT_ID`)

#### Step 2: Enable BigQuery API
1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "BigQuery API"
3. Click on it and press **Enable**

#### Step 3: Create a Service Account
1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Enter a name (e.g., "bigquery-text-to-sql")
4. Add description: "Service account for BigQuery text-to-SQL project"
5. Click **Create and Continue**

#### Step 4: Assign Permissions
Assign the following roles to your service account:
- **BigQuery Data Viewer** - To read data from BigQuery datasets
- **BigQuery Job User** - To run BigQuery jobs/queries
- **BigQuery Metadata Viewer** - To access dataset and table metadata

#### Step 5: Generate Service Account Key
1. Click on your newly created service account
2. Go to the **Keys** tab
3. Click **Add Key > Create New Key**
4. Select **JSON** format
5. Download the JSON file and save it as `service-account.json` in your project root

#### Step 6: Extract Credentials for Environment Variables
Open the downloaded `service-account.json` file and extract the following values for your `.env` file:

```json
{
  "type": "service_account",                    // → GOOGLE_TYPE
  "project_id": "your-project-id",              // → GOOGLE_PROJECT_ID & BIGQUERY_PROJECT_ID
  "private_key_id": "key-id",                   // → GOOGLE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE KEY-----...", // → GOOGLE_PRIVATE_KEY
  "client_email": "service-account@project.iam.gserviceaccount.com", // → GOOGLE_CLIENT_EMAIL
  "client_id": "client-id",                     // → GOOGLE_CLIENT_ID
  "auth_uri": "https://accounts.google.com/o/oauth2/auth", // → GOOGLE_AUTH_URI
  "token_uri": "https://oauth2.googleapis.com/token", // → GOOGLE_TOKEN_URI
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", // → GOOGLE_AUTH_PROVIDER_X509_CERT_URL
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...", // → GOOGLE_CLIENT_X509_CERT_URL
  "universe_domain": "googleapis.com"           // → GOOGLE_UNIVERSE_DOMAIN
}
```

## 🔄 Two-Part Workflow System

This project implements a sophisticated two-part workflow system for BigQuery schema analysis and query generation:

### Part 1: System Prompt Generation (`bigquerysystemPrompQueryWorkflow`)

**File:** `src/mastra/workflows/bigquery/bigquery-generate-systemPrompt-part1.ts`

**Purpose:** Analyzes your BigQuery datasets and generates a comprehensive system prompt with complete schema information.

#### Workflow Steps:
1. **Dataset Information Collection** - Prompts user for BigQuery dataset details
2. **Schema Introspection** - Analyzes tables, columns, relationships, and row counts
3. **System Prompt Generation** - Creates a detailed system prompt with schema information

#### How to Use:
```typescript
import { bigquerysystemPrompQueryWorkflow } from './src/mastra/workflows/bigquery/bigquery-generate-systemPrompt-part1.ts';

// Run the workflow
const result = await bigquerysystemPrompQueryWorkflow.execute({});

// The workflow will suspend and ask for dataset information in this format:
{
  "datasets": [
    {
      "name": "your-dataset-name",
      "projectId": "your-project-id", // optional
      "tables": ["table1", "table2", "table3"]
    }
  ]
}
```

#### Output:
- Generates a comprehensive system prompt with complete schema information
- Updates `src/mastra/systemPrompt/bigqueyAgentgeneratesqlSystemprompt.ts` with your dataset schema
- Provides detailed table structures, column types, and relationships

### Part 2: Query Generation and Execution (`bigqueryQueryWorkflowPart2`)

**File:** `src/mastra/workflows/bigquery/bigquery-query-workflow-part2.ts`

**Purpose:** Uses the generated system prompt to convert natural language queries into BigQuery SQL and execute them.

#### Workflow Steps:
1. **SQL Generation** - Converts natural language to BigQuery SQL using the schema-aware system prompt
2. **Query Execution** - Safely executes the generated SQL query on BigQuery

#### How to Use:
```typescript
import { bigqueryQueryWorkflowPart2 } from './src/mastra/workflows/bigquery/bigquery-query-workflow-part2.ts';

// Run the workflow with a natural language query
const result = await bigqueryQueryWorkflowPart2.execute({
  naturalLanguageQuery: "Show me the top 10 most popular programming languages based on Stack Overflow questions"
});
```

#### Output:
- Generated BigQuery SQL query
- Query explanation and confidence score
- Execution results with row count
- Error handling and debugging information

### 🔄 Complete Workflow Process

1. **First, run Part 1** to analyze your datasets and generate the system prompt:
   ```bash
   # This will introspect your BigQuery datasets and update the system prompt
   npm run dev
   # Execute: bigquerysystemPrompQueryWorkflow
   ```

2. **Then, run Part 2** to generate and execute queries:
   ```bash
   # This will use the generated system prompt to answer natural language queries
   npm run dev
   # Execute: bigqueryQueryWorkflowPart2
   ```

## 🏗️ Project Structure

```
src/
├── mastra/
│   ├── agents/
│   │   ├── bigquery-sql-agent.ts           # BigQuery conversational agent
│   │   ├── openrouter.ts                   # OpenRouter AI integration
│   │   └── postgres-sql-agent.ts           # PostgreSQL agent (legacy)
│   ├── tools/
│   │   ├── bigquery/
│   │   │   ├── bigquery-connextion.ts      # BigQuery connection utilities
│   │   │   ├── bigquery-inspection-tool.ts # Dataset introspection tool
│   │   │   ├── bigquery-query-excution.ts  # Query execution tool
│   │   │   └── query-generation-tool.ts    # SQL generation utilities
│   │   └── postgres/                       # PostgreSQL tools (legacy)
│   ├── workflows/
│   │   ├── bigquery/
│   │   │   ├── bigquery-generate-systemPrompt-part1.ts  # Part 1: Schema analysis
│   │   │   ├── bigquery-query-workflow-part2.ts         # Part 2: Query generation
│   │   │   └── bigquery-introspection-query-workflow.ts # Combined workflow
│   │   └── postgres/                       # PostgreSQL workflows (legacy)
│   ├── systemPrompt/
│   │   ├── bigqueyAgentgeneratesqlSystemprompt.ts       # Generated system prompt
│   │   └── bigqueryAgentPrompt.ts          # Base agent prompt
│   ├── Types/
│   │   └── validation.ts                   # Zod schemas for validation
│   └── index.ts                           # Mastra instance configuration
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start Mastra development server
pnpm dev            # Alternative with pnpm

# Production
npm run build       # Build the project
npm run start       # Start production server

# Testing
npm test           # Run tests (currently not configured)
```

## 🔧 Tools Overview

### BigQuery Inspection Tool
**File:** `src/mastra/tools/bigquery/bigquery-inspection-tool.ts`

- **Schema Analysis** - Analyzes tables, columns, data types, and relationships
- **Row Count Analysis** - Gets accurate row counts for each table
- **Cross-Project Support** - Works with multiple BigQuery projects
- **Metadata Extraction** - Extracts creation dates, table types, and more

### Query Generation Tool
**File:** `src/mastra/tools/bigquery/query-generation-tool.ts`

- **Natural Language Processing** - Converts English to BigQuery SQL
- **Schema-Aware Generation** - Uses complete schema context for accurate queries
- **BigQuery Optimization** - Generates optimized queries with proper syntax
- **Confidence Scoring** - Provides confidence levels for generated queries

### Query Execution Tool
**File:** `src/mastra/tools/bigquery/bigquery-query-excution.ts`

- **Safe Execution** - Only allows SELECT queries for security
- **Job Management** - Handles BigQuery job lifecycle
- **Error Handling** - Comprehensive error reporting and debugging
- **Result Processing** - Formats and validates query results

## 🤖 BigQuery Agent

The BigQuery Agent provides a conversational interface for data analytics:

```typescript
import { mastra } from './src/mastra/index.ts';

const bigQueryAgent = mastra.getAgent('bigQuerySqlAgent');

// Example usage
const result = await bigQueryAgent.generate([
  {
    role: 'user',
    content: 'Show me the top 10 users with the most reputation on Stack Overflow'
  }
], { maxSteps: 3 });
```

### Agent Capabilities
- ✅ **Natural Language to SQL** - Converts questions to BigQuery queries
- ✅ **Schema-Aware** - Uses complete dataset schema for context
- ✅ **Multi-Step Reasoning** - Can break down complex queries
- ✅ **Error Recovery** - Handles and explains query errors
- ✅ **Result Explanation** - Provides clear explanations of results

## 🔒 Security Features

- **Read-Only Operations** - Only SELECT queries are allowed
- **Service Account Authentication** - Secure Google Cloud integration
- **Input Validation** - Comprehensive input sanitization with Zod
- **Error Handling** - Safe error reporting without exposing sensitive data
- **Access Control** - Respects BigQuery dataset permissions

## 📊 Supported BigQuery Features

- **Standard SQL Syntax** - Full BigQuery Standard SQL support
- **Cross-Project Queries** - Query across multiple Google Cloud projects
- **Complex Data Types** - ARRAY, STRUCT, and nested data support
- **Window Functions** - Advanced analytical functions
- **Common Table Expressions** - WITH clauses for complex queries
- **Date/Time Functions** - Comprehensive temporal data handling
- **Approximate Functions** - APPROX_COUNT_DISTINCT for large datasets
- **Safe Functions** - SAFE_CAST, SAFE_DIVIDE for error handling

## 🚀 Example Workflows

### Analyzing Stack Overflow Data
```typescript
// Part 1: Generate system prompt with Stack Overflow schema
const schemaResult = await bigquerysystemPrompQueryWorkflow.execute({});

// Part 2: Query the data
const queryResult = await bigqueryQueryWorkflowPart2.execute({
  naturalLanguageQuery: "What are the most popular programming languages based on question tags?"
});
```

### Custom Dataset Analysis
```typescript
// Part 1: Analyze your custom datasets
const schemaResult = await bigquerysystemPrompQueryWorkflow.execute({});
// Provide your dataset information when prompted

// Part 2: Query your data
const queryResult = await bigqueryQueryWorkflowPart2.execute({
  naturalLanguageQuery: "Show me monthly revenue trends for the last year"
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your service account JSON file is correct
   - Check that BigQuery API is enabled
   - Ensure service account has proper permissions

2. **Query Execution Errors**
   - Verify dataset and table names are correct
   - Check that you have read permissions on the datasets
   - Ensure your BigQuery project has sufficient quota

3. **Environment Variable Issues**
   - Double-check all required environment variables are set
   - Verify the private key format (should include \n characters)
   - Ensure no extra spaces or quotes in environment values

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
```

## 📝 Dependencies

### Core Dependencies
- `@mastra/core` - Workflow orchestration framework
- `@google-cloud/bigquery` - Google Cloud BigQuery client
- `@ai-sdk/openai` - OpenAI integration for AI-powered features
- `ai` - AI SDK for structured generation
- `zod` - Schema validation and type safety

### AI Providers
- `@ai-sdk/google` - Google AI integration
- `@openrouter/ai-sdk-provider` - OpenRouter AI provider

### Utilities
- `dotenv` - Environment variable management
- `csv-parse` - CSV parsing utilities
- `typescript` - TypeScript support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🔗 Related Links

- [Mastra Framework Documentation](https://mastra.ai/docs)
- [Google Cloud BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [BigQuery Standard SQL Reference](https://cloud.google.com/bigquery/docs/reference/standard-sql)
- [Google Cloud Service Account Setup](https://cloud.google.com/iam/docs/service-accounts)

---

**Built with ❤️ using the Mastra framework for workflow orchestration and Google Cloud BigQuery for data analytics.**
