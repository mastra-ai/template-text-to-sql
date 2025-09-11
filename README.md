# BigQuery PostgreSQL Text-to-SQL Project

A comprehensive Mastra workflow system for BigQuery data analytics and natural language to SQL conversion. This project provides advanced tools for analyzing BigQuery datasets, generating SQL queries from natural language descriptions, and executing queries safely using Google Cloud BigQuery with cross-project support and intelligent schema introspection.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.9.0
- Google Cloud Project with BigQuery API enabled
- Google Cloud Service Account with BigQuery permissions
- Access to datasets you want to query (can be across multiple projects)

### Clone and Setup

1. **Clone the repository:**

```bash
git clone https://github.com/The-Caesar/bigquery-postgres-text-to-sql.git
cd bigquery-postgres-text-to-sql
```

2. **Install dependencies:**

```bash
npm install --legacy-peer-deps
# or
pnpm install --legacy-peer-deps
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
  "type": "service_account", // → GOOGLE_TYPE
  "project_id": "your-project-id", // → GOOGLE_PROJECT_ID & BIGQUERY_PROJECT_ID
  "private_key_id": "key-id", // → GOOGLE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE KEY-----...", // → GOOGLE_PRIVATE_KEY
  "client_email": "service-account@project.iam.gserviceaccount.com", // → GOOGLE_CLIENT_EMAIL
  "client_id": "client-id", // → GOOGLE_CLIENT_ID
  "auth_uri": "https://accounts.google.com/o/oauth2/auth", // → GOOGLE_AUTH_URI
  "token_uri": "https://oauth2.googleapis.com/token", // → GOOGLE_TOKEN_URI
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", // → GOOGLE_AUTH_PROVIDER_X509_CERT_URL
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...", // → GOOGLE_CLIENT_X509_CERT_URL
  "universe_domain": "googleapis.com" // → GOOGLE_UNIVERSE_DOMAIN
}
```

## 🏗️ BigQuery Architecture Overview

This project implements a sophisticated two-part workflow system that leverages advanced BigQuery capabilities for schema analysis and AI-powered query generation:

### Core Components

1. **BigQuery Connection Manager** (`bigquery-connextion.ts`)
   - Singleton pattern for efficient connection reuse
   - Runtime validation of service account credentials using Zod schemas
   - Automatic credential management and authentication

2. **Schema Introspection Engine** (`bigquery-inspection-tool.ts`)
   - Cross-project dataset analysis capabilities
   - Intelligent table and column metadata extraction
   - Relationship detection through ID-pattern analysis
   - Row count analysis using BigQuery's `__TABLES__` metadata

3. **AI-Powered Query Generator** (`query-generation-tool.ts`)
   - OpenRouter/OpenAI integration for natural language processing
   - Schema-aware SQL generation with confidence scoring
   - BigQuery-specific syntax optimization and validation

4. **Safe Query Executor** (`bigquery-query-excution.ts`)
   - Secure read-only query execution
   - Comprehensive error handling and job management
   - Result validation and formatting

## 🔄 Three BigQuery Workflow System

This project provides **three distinct workflows** for different BigQuery use cases, with particular focus on **Stack Overflow BigQuery public data** analysis:

### Workflow 1: Complete BigQuery Analysis (`bigqueryQueryWorkflow`)

**File:** `src/mastra/workflows/bigquery/bigquery-introspection-query-workflow.ts`

**Purpose:** A complete end-to-end workflow that provides immediate access to analyze **any BigQuery schema** including the popular **Stack Overflow public dataset**. This workflow combines schema introspection, query generation, and execution in a single interactive flow.

#### Key Features:

- **Universal BigQuery Access**: Works with any BigQuery dataset, including `bigquery-public-data.stackoverflow`
- **Interactive Schema Discovery**: Automatically introspects and presents schema information
- **Real-time Query Generation**: Converts natural language to SQL on-the-fly
- **Query Review and Approval**: Allows manual review and modification before execution
- **Complete Analysis Pipeline**: Handles the entire process from schema discovery to result analysis

#### Usage Example for Stack Overflow Data:

```typescript
import { bigqueryQueryWorkflow } from './src/mastra/workflows/bigquery/bigquery-introspection-query-workflow.ts';

// Execute the complete workflow
const result = await bigqueryQueryWorkflow.execute({});

// When prompted, provide Stack Overflow dataset configuration:
{
  "datasets": [
    {
      "name": "stackoverflow",
      "projectId": "bigquery-public-data",
      "tables": ["posts_questions", "posts_answers", "users", "badges", "comments"]
    }
  ]
}

// Then provide your natural language query:
"Show me the top 10 programming languages by question volume on Stack Overflow"

// The workflow will:
// 1. Analyze the Stack Overflow schema
// 2. Generate optimized BigQuery SQL
// 3. Present the query for review
// 4. Execute and return results
```

### Workflow 2: Schema Analysis and System Prompt Generation (`bigquerysystemPrompQueryWorkflow`)

**File:** `src/mastra/workflows/bigquery/bigquery-generate-systemPrompt-part1.ts`

**Purpose:** Performs deep analysis of BigQuery datasets and generates a comprehensive, schema-aware system prompt for AI-powered query generation.

#### Technical Implementation:

1. **Dataset Information Collection**
   - Interactive user prompt for dataset configuration
   - Support for cross-project dataset access
   - Flexible project.dataset format parsing
   - Validation of project ID format and naming conventions

2. **Advanced Schema Introspection**
   - **Table Metadata Extraction**: Uses `INFORMATION_SCHEMA.TABLES` to gather table types, creation timestamps, and DDL information
   - **Column Analysis**: Comprehensive column metadata including data types, nullability, and ordinal positions
   - **Primary Key Detection**: Automatic identification of primary key constraints where available
   - **Relationship Mapping**: Intelligent detection of potential foreign key relationships through ID-pattern analysis
   - **Row Count Analysis**: Efficient row counting using BigQuery's `__TABLES__` metadata system
   - **Cross-Project Support**: Seamless analysis across multiple Google Cloud projects

3. **System Prompt Generation**
   - Creates a detailed, schema-aware system prompt
   - Includes BigQuery-specific syntax rules and optimization guidelines
   - Incorporates table relationships and data distribution information
   - Updates the system prompt file for Part 2 workflow consumption

#### Advanced Features:

- **Project ID Validation**: Validates Google Cloud project ID format (6-63 characters, lowercase, no trailing dashes)
- **SQL Injection Prevention**: Comprehensive input validation and sanitization
- **Error Recovery**: Graceful handling of permission issues and missing metadata
- **Metadata Aggregation**: Intelligent summarization of schema information across datasets

#### Usage Example:

```typescript
import { bigquerysystemPrompQueryWorkflow } from './src/mastra/workflows/bigquery/bigquery-generate-systemPrompt-part1.ts';

// Execute the schema analysis workflow
const result = await bigquerysystemPrompQueryWorkflow.execute({});

// The workflow will suspend and prompt for dataset information:
{
  "datasets": [
    {
      "name": "stackoverflow",           // Dataset name
      "projectId": "bigquery-public-data", // Optional: specify different project
      "tables": ["posts", "users", "comments", "badges"]
    },
    {
      "name": "my-analytics-dataset",    // Can mix projects in single workflow
      "projectId": "my-company-project",
      "tables": ["events", "users", "sessions"]
    }
  ]
}
```

#### Output Schema:

The workflow generates a comprehensive schema presentation including:

- **Summary Statistics**: Total datasets, tables, columns, relationships, and projects
- **Table Metadata**: Creation timestamps, table types, row counts
- **Column Details**: Data types, nullability, primary keys, ordinal positions
- **Relationship Analysis**: Potential foreign key relationships and join patterns
- **BigQuery-Specific Optimizations**: Partitioning and clustering recommendations

### Workflow 3: AI-Powered Query Generation and Execution (`bigqueryQueryWorkflowPart2`)

**File:** `src/mastra/workflows/bigquery/bigquery-query-workflow-part2.ts`

**Purpose:** Leverages the generated schema-aware system prompt to convert natural language queries into optimized BigQuery SQL and execute them safely.

#### Technical Implementation:

1. **AI-Powered SQL Generation**
   - **Model Integration**: Uses OpenRouter with GPT-4o for high-quality query generation
   - **Schema Context**: Leverages the comprehensive system prompt from Part 1
   - **Temperature Control**: Low temperature (0.1) for deterministic, reliable results
   - **Structured Output**: Uses Zod schemas for validated response formatting

2. **Query Analysis and Validation**
   - **Confidence Scoring**: AI-generated confidence levels (0-1) for each query
   - **Assumption Tracking**: Documents assumptions made during query generation
   - **Table Usage Analysis**: Identifies all tables and projects referenced
   - **BigQuery Syntax Optimization**: Ensures proper Standard SQL syntax and BigQuery-specific features

3. **Safe Query Execution**
   - **Read-Only Enforcement**: Only SELECT queries are permitted for security
   - **Job Management**: Proper BigQuery job lifecycle handling
   - **Result Processing**: Validation and formatting of query results
   - **Error Recovery**: Comprehensive error handling with detailed debugging information

#### Advanced AI Features:

- **Schema-Aware Generation**: Deep understanding of table relationships and data types
- **BigQuery Optimization**: Leverages window functions, CTEs, and BigQuery-specific functions
- **Cross-Project Queries**: Generates proper cross-project table references
- **Performance Considerations**: Includes LIMIT clauses and cost-optimization strategies

#### Usage Example:

```typescript
import { bigqueryQueryWorkflowPart2 } from "./src/mastra/workflows/bigquery/bigquery-query-workflow-part2.ts";

// Execute natural language to SQL workflow
const result = await bigqueryQueryWorkflowPart2.execute({
  naturalLanguageQuery:
    "Show me the top 10 most active Stack Overflow users by total posts and comments, including their reputation scores",
});

// Result includes:
// - Generated BigQuery SQL with proper syntax
// - Confidence score and explanation
// - List of assumptions made
// - Tables used in the query
// - Execution results with row count
// - Error handling if issues occur
```

#### Output Schema:

```typescript
{
  success: boolean,
  naturalLanguageQuery: string,
  generatedSQL: {
    sql: string,              // Optimized BigQuery SQL
    explanation: string,      // Human-readable explanation
    confidence: number,       // Confidence score (0-1)
    assumptions: string[],    // Documented assumptions
    tables_used: string[]     // Tables referenced (project.dataset.table format)
  },
  queryResult: any[],        // Actual query results
  rowCount: number,          // Number of rows returned
  error?: string             // Error message if execution failed
}
```

### 🔄 Complete Workflow Process

#### Option A: Quick Analysis (Workflow 1 - Recommended for Stack Overflow Data)

```bash
# Start the Mastra development server
npm run dev

# Execute the complete workflow for immediate analysis
# Perfect for Stack Overflow BigQuery public data exploration
```

**Stack Overflow Dataset Configuration:**

```json
{
  "datasets": [
    {
      "name": "stackoverflow",
      "projectId": "bigquery-public-data",
      "tables": [
        "posts_questions",
        "posts_answers",
        "users",
        "badges",
        "comments"
      ]
    }
  ]
}
```

**Example Natural Language Queries for Stack Overflow:**

- "What are the most popular programming language tags?"
- "Show me users with the highest reputation who asked Python questions"
- "Analyze the relationship between question score and answer count"
- "Find the most active Stack Overflow contributors in machine learning topics"

#### Option B: Advanced Two-Part Process (Workflows 2 & 3)

#### Step 1: Schema Analysis and System Prompt Generation (Workflow 2)

```bash
# Start the Mastra development server
npm run dev

# Execute the schema analysis workflow
# This will prompt you for dataset information and generate the system prompt
```

**Dataset Configuration Example:**

```json
{
  "datasets": [
    {
      "name": "bigquery-public-data.stackoverflow",
      "tables": ["posts_questions", "posts_answers", "users", "badges"]
    },
    {
      "name": "my-analytics",
      "projectId": "my-company-project",
      "tables": ["user_events", "sessions", "conversions"]
    }
  ]
}
```

#### Step 2: Query Generation and Execution (Workflow 3)

```bash
# Execute the query generation workflow
# For macOS (with SSL configuration):
NODE_TLS_REJECT_UNAUTHORIZED=0 npm start

# For Windows:
npm start
```

**Natural Language Query Examples for Stack Overflow Data:**

- "What are the most popular programming language tags on Stack Overflow?"
- "Show me user engagement trends over the last 6 months"
- "Find users with the highest reputation who asked questions about machine learning"
- "Analyze the relationship between question length and answer quality"
- "Which programming languages have the highest answer-to-question ratio?"
- "Show me the most upvoted Python questions from the last year"

## 🛠️ Project Structure

```
src/
├── mastra/
│   ├── agents/
│   │   ├── bigquery-sql-agent.ts           # Conversational BigQuery agent
│   │   ├── openrouter.ts                   # OpenRouter AI integration
│   │   └── postgres-sql-agent.ts           # PostgreSQL agent (legacy)
│   ├── tools/
│   │   ├── bigquery/
│   │   │   ├── bigquery-connextion.ts      # Singleton connection manager
│   │   │   ├── bigquery-inspection-tool.ts # Advanced schema introspection
│   │   │   ├── bigquery-query-excution.ts  # Safe query execution engine
│   │   │   └── query-generation-tool.ts    # AI-powered SQL generation
│   │   └── postgres/                       # PostgreSQL tools (legacy)
│   ├── workflows/
│   │   ├── bigquery/
│   │   │   ├── bigquery-generate-systemPrompt-part1.ts  # Schema analysis workflow
│   │   │   ├── bigquery-query-workflow-part2.ts         # Query generation workflow
│   │   │   └── bigquery-introspection-query-workflow.ts # Combined workflow
│   │   └── postgres/                       # PostgreSQL workflows (legacy)
│   ├── systemPrompt/
│   │   ├── bigqueyAgentgeneratesqlSystemprompt.ts       # Dynamic system prompt
│   │   └── bigqueryAgentPrompt.ts          # Base agent prompt
│   ├── Types/
│   │   └── validation.ts                   # Zod schemas for type safety
│   └── index.ts                           # Mastra instance configuration
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start Mastra development server with hot reload
pnpm dev            # Alternative with pnpm

# Production
npm run build       # Build the project for production
npm run start       # Start production server

# Testing
npm test           # Run tests (configure as needed)
```

## 🔧 Advanced BigQuery Tools

### BigQuery Connection Manager

**File:** `src/mastra/tools/bigquery/bigquery-connextion.ts`

- **Singleton Pattern**: Ensures efficient connection reuse across the application
- **Credential Validation**: Runtime validation using Zod schemas
- **Environment Management**: Comprehensive environment variable validation
- **Error Handling**: Detailed error messages for missing or invalid credentials
- **Reset Capability**: Useful for testing and development scenarios

```typescript
import { createBigQueryClient, BigQuerySingleton } from "./bigquery-connextion";

// Get the singleton instance
const client = createBigQueryClient();

// Reset for testing (if needed)
BigQuerySingleton.reset();
```

### BigQuery Introspection Tool

**File:** `src/mastra/tools/bigquery/bigquery-inspection-tool.ts`

#### Core Capabilities:

- **Multi-Project Analysis**: Seamlessly analyze datasets across different Google Cloud projects
- **Schema Discovery**: Comprehensive table and column metadata extraction
- **Relationship Detection**: Intelligent identification of potential foreign key relationships
- **Row Count Analysis**: Efficient counting using BigQuery's metadata tables
- **Security Validation**: SQL injection prevention and input sanitization

#### Technical Features:

- **Project ID Validation**: Ensures proper Google Cloud project ID format
- **Cross-Project Support**: Handles `project.dataset` format parsing
- **Metadata Aggregation**: Combines table, column, and relationship information
- **Error Recovery**: Graceful handling of permission and access issues

#### Usage Example:

```typescript
import { bigqueryIntrospectionTool } from "./bigquery-introspection-tool";

const schemaData = await bigqueryIntrospectionTool.execute({
  context: {
    datasets: [
      {
        name: "stackoverflow",
        projectId: "bigquery-public-data",
        tables: ["posts", "users", "comments"],
      },
    ],
  },
  runtimeContext: new RuntimeContext(),
});
```

### Query Generation Tool

**File:** `src/mastra/tools/bigquery/query-generation-tool.ts`

- **AI Integration**: OpenRouter/OpenAI powered natural language processing
- **Schema-Aware Generation**: Leverages complete dataset schema for context
- **BigQuery Optimization**: Generates optimized queries with proper BigQuery syntax
- **Confidence Scoring**: Provides reliability metrics for generated queries
- **Structured Output**: Uses Zod schemas for validated response formatting

### Query Execution Tool

**File:** `src/mastra/tools/bigquery/bigquery-query-excution.ts`

#### Security Features:

- **Read-Only Enforcement**: Only SELECT queries are permitted
- **Input Validation**: Comprehensive query validation and sanitization
- **Job Management**: Proper BigQuery job lifecycle handling
- **Result Processing**: Formatted and validated query results

#### Error Handling:

- **Comprehensive Logging**: Detailed error reporting and debugging information
- **Graceful Degradation**: Handles various BigQuery error scenarios
- **Result Validation**: Ensures query results match expected schemas

```typescript
import { excuteBigQueryTool } from "./bigquery-query-excution";

const results = await excuteBigQueryTool.execute({
  context: {
    sql: "SELECT COUNT(*) as total_posts FROM `bigquery-public-data.stackoverflow.posts_questions` LIMIT 10",
  },
  runtimeContext: new RuntimeContext(),
});
```

## 🤖 BigQuery Agent

The BigQuery Agent provides an advanced conversational interface for data analytics with multi-step reasoning capabilities:

```typescript
import { mastra } from "./src/mastra/index.ts";

const bigQueryAgent = mastra.getAgent("bigQuerySqlAgent");

// Advanced conversational query
const result = await bigQueryAgent.generate(
  [
    {
      role: "user",
      content:
        "Analyze the relationship between Stack Overflow question complexity and answer quality. Consider factors like question length, number of tags, and answer upvotes.",
    },
  ],
  {
    maxSteps: 5, // Allow multi-step reasoning
    temperature: 0.1, // Deterministic results
  }
);
```

### Agent Capabilities

- ✅ **Advanced Natural Language Processing** - Understands complex analytical questions
- ✅ **Schema-Aware Query Generation** - Uses complete dataset context for accurate queries
- ✅ **Multi-Step Reasoning** - Can break down complex analysis into multiple queries
- ✅ **Cross-Project Analysis** - Seamlessly queries across multiple BigQuery projects
- ✅ **Error Recovery and Explanation** - Handles and explains query errors intelligently
- ✅ **Result Interpretation** - Provides clear explanations and insights from query results
- ✅ **Performance Optimization** - Generates cost-effective and efficient queries

## 🔒 Security Features

### Authentication and Authorization

- **Service Account Authentication**: Secure Google Cloud integration with proper credential management
- **IAM-Based Access Control**: Respects BigQuery dataset permissions and project boundaries
- **Credential Validation**: Runtime validation of service account credentials using Zod schemas

### Query Security

- **Read-Only Operations**: Only SELECT queries are permitted for data safety
- **SQL Injection Prevention**: Comprehensive input validation and sanitization
- **Query Validation**: Structured validation of all SQL queries before execution
- **Error Sanitization**: Safe error reporting without exposing sensitive information

### Data Protection

- **Access Control**: Respects BigQuery dataset and table-level permissions
- **Audit Logging**: Comprehensive logging of all database operations
- **Connection Security**: Secure connection management through singleton pattern

## 📊 Supported BigQuery Features

### Core SQL Capabilities

- **Standard SQL Syntax**: Full BigQuery Standard SQL support with proper syntax validation
- **Cross-Project Queries**: Query across multiple Google Cloud projects seamlessly
- **Complex Data Types**: ARRAY, STRUCT, and nested data support with proper handling
- **Window Functions**: Advanced analytical functions with OVER clause optimization
- **Common Table Expressions**: WITH clauses for complex query organization

### BigQuery-Specific Features

- **Partitioning and Clustering**: Optimization recommendations for large datasets
- **Approximate Functions**: APPROX_COUNT_DISTINCT for efficient large dataset analysis
- **Safe Functions**: SAFE_CAST, SAFE_DIVIDE for robust error handling
- **Date/Time Functions**: Comprehensive temporal data handling with BigQuery functions
- **Geographic Functions**: Support for BigQuery GIS and geography data types

### Performance Optimizations

- **Query Cost Management**: Automatic LIMIT clause insertion for cost control
- **Slot Optimization**: Efficient query planning for BigQuery's distributed architecture
- **Metadata Utilization**: Leverages BigQuery's metadata tables for efficient operations
- **Connection Pooling**: Singleton pattern for efficient connection management

## 🚀 Example Workflows

### Quick Stack Overflow Analysis (Single Workflow)

```typescript
// Complete analysis in one workflow - perfect for Stack Overflow exploration
const stackOverflowAnalysis = await bigqueryQueryWorkflow.execute({});

// When prompted, provide Stack Overflow configuration:
{
  "datasets": [
    {
      "name": "stackoverflow",
      "projectId": "bigquery-public-data",
      "tables": ["posts_questions", "posts_answers", "users", "badges", "comments"]
    }
  ]
}

// Then ask questions like:
// "Show me the evolution of JavaScript questions on Stack Overflow over the past 5 years"
// "Which users have the most reputation in Python-related questions?"
// "What's the average time between question posting and first answer?"
```

### Advanced Stack Overflow Analysis (Two-Part Workflow)

```typescript
// Workflow 2: Generate schema-aware system prompt for Stack Overflow
const schemaResult = await bigquerysystemPrompQueryWorkflow.execute({});

// Provide Stack Overflow dataset configuration when prompted:
{
  "datasets": [
    {
      "name": "stackoverflow",
      "projectId": "bigquery-public-data",
      "tables": ["posts_questions", "posts_answers", "users", "badges", "comments"]
    }
  ]
}

// Workflow 3: Execute complex analytical queries on Stack Overflow data
const analysisResults = await bigqueryQueryWorkflowPart2.execute({
  naturalLanguageQuery: "Analyze the correlation between user reputation and question quality metrics for Stack Overflow users, including average answers per question and answer acceptance rates"
});
```

### Cross-Project Business Intelligence (Including Stack Overflow Data)

```typescript
// Analyze data across multiple projects including Stack Overflow public data
const crossProjectAnalysis = await bigquerysystemPrompQueryWorkflow.execute({});

// Configuration combining Stack Overflow with business data:
{
  "datasets": [
    {
      "name": "stackoverflow",
      "projectId": "bigquery-public-data",
      "tables": ["posts_questions", "posts_answers", "users", "badges"]
    },
    {
      "name": "google_analytics_sample",
      "projectId": "bigquery-public-data",
      "tables": ["ga_sessions"]
    },
    {
      "name": "business_data",
      "projectId": "my-company-analytics",
      "tables": ["customers", "orders", "products"]
    }
  ]
}

// Query across projects combining Stack Overflow insights with business metrics
const businessIntelligence = await bigqueryQueryWorkflowPart2.execute({
  naturalLanguageQuery: "Analyze technology adoption trends from Stack Overflow data and correlate with our customer product preferences"
});
```

### Stack Overflow Time-Series Analysis

```typescript
const stackOverflowTrends = await bigqueryQueryWorkflowPart2.execute({
  naturalLanguageQuery:
    "Analyze monthly trends in Stack Overflow question volume, segmented by programming language tags, with year-over-year growth calculations for the past 5 years",
});

// Or using the complete workflow for immediate analysis
const quickTrendAnalysis = await bigqueryQueryWorkflow.execute({});
// Then provide: "Show me how Python's popularity has changed on Stack Overflow compared to Java and JavaScript"
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Errors

**Symptoms:**

- "Missing required environment variable" errors
- "Authentication failed" messages
- "Permission denied" on BigQuery operations

**Solutions:**

```bash
# Verify all environment variables are set
echo $GOOGLE_PROJECT_ID
echo $BIGQUERY_PROJECT_ID

# Check service account file exists
ls -la service-account.json

# Validate JSON format
cat service-account.json | jq .

# Test BigQuery connection
bq ls  # If you have gcloud CLI installed
```

#### 2. Query Execution Errors

**Symptoms:**

- "Table not found" errors
- "Access denied" on specific datasets
- Query timeout issues

**Solutions:**

```typescript
// Verify dataset access
const testQuery = `
  SELECT table_name 
  FROM \`your-project.your-dataset\`.INFORMATION_SCHEMA.TABLES 
  LIMIT 5
`;

// Check cross-project permissions
const crossProjectTest = `
  SELECT COUNT(*) 
  FROM \`bigquery-public-data.stackoverflow.posts_questions\` 
  LIMIT 1
`;
```

#### 3. Environment Variable Issues

**Common Problems:**

- Incorrect private key format
- Missing newline characters in private key
- Extra spaces or quotes in environment values

**Solutions:**

```bash
# Correct private key format (must include \n)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Verify environment loading
node -e "require('dotenv').config(); console.log(process.env.GOOGLE_PROJECT_ID);"
```

#### 4. Cross-Project Access Issues

**Setup Cross-Project Access:**

1. **Grant Service Account Access:**

   ```bash
   # Add service account to target project
   gcloud projects add-iam-policy-binding TARGET_PROJECT_ID \
     --member="serviceAccount:your-service-account@your-project.iam.gserviceaccount.com" \
     --role="roles/bigquery.dataViewer"
   ```

2. **Verify Project ID Format:**
   ```typescript
   // Correct format: project-id.dataset-name.table-name
   const query = `
     SELECT * FROM \`bigquery-public-data.stackoverflow.posts_questions\` 
     LIMIT 10
   `;
   ```

### Debug Mode

Enable comprehensive debugging:

```env
# Add to .env file
DEBUG=true
NODE_ENV=development

# Enable BigQuery job debugging
BIGQUERY_DEBUG=true
```

### Performance Optimization

#### Query Optimization Tips:

1. **Use LIMIT clauses** for exploratory queries
2. **Leverage partitioned tables** when available
3. **Use APPROX functions** for large dataset aggregations
4. **Optimize JOIN operations** with proper table ordering

#### Connection Optimization:

```typescript
// Monitor connection usage
import { BigQuerySingleton } from "./src/mastra/tools/bigquery/bigquery-connextion";

// Reset connections if needed (development only)
if (process.env.NODE_ENV === "development") {
  BigQuerySingleton.reset();
}
```

## 📝 Dependencies

### Core Dependencies

- **`@mastra/core`** - Advanced workflow orchestration framework with step-based processing
- **`@google-cloud/bigquery`** - Official Google Cloud BigQuery client with full API support
- **`@ai-sdk/openai`** - OpenAI integration for structured AI-powered features
- **`ai`** - AI SDK for structured generation with schema validation
- **`zod`** - Runtime schema validation and type safety

### AI and Machine Learning

- **`@ai-sdk/google`** - Google AI integration for additional model options
- **`@openrouter/ai-sdk-provider`** - OpenRouter AI provider for diverse model access

### Data Processing and Validation

- **`csv-parse`** - CSV parsing utilities for data import/export
- **`pg`** - PostgreSQL client (for legacy PostgreSQL functionality)
- **`dotenv`** - Secure environment variable management

### Development Tools

- **`typescript`** - Type-safe development with full TypeScript support
- **`mastra`** - Mastra CLI for development and deployment
- **`@types/node`** - Node.js type definitions
- **`@types/pg`** - PostgreSQL client type definitions

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/enhanced-bigquery-analysis
   ```
3. **Set up development environment:**
   ```bash
   npm install --legacy-peer-deps
   cp .env.example .env
   # Configure your .env file
   ```
4. **Run tests:**
   ```bash
   npm test
   npm run dev  # Test workflows
   ```
5. **Commit your changes:**
   ```bash
   git commit -am 'Add enhanced BigQuery schema analysis'
   ```
6. **Push to the branch:**
   ```bash
   git push origin feature/enhanced-bigquery-analysis
   ```
7. **Submit a pull request**

### Code Standards

- **TypeScript**: Use strict TypeScript with proper typing
- **Zod Validation**: Validate all inputs and outputs with Zod schemas
- **Error Handling**: Implement comprehensive error handling
- **Documentation**: Document all new features and tools
- **Testing**: Add tests for new functionality

### Areas for Contribution

- **Additional BigQuery Features**: Support for more BigQuery-specific functions
- **Enhanced AI Models**: Integration with additional AI providers
- **Performance Optimization**: Query optimization and caching strategies
- **Security Enhancements**: Additional security validations and features
- **Documentation**: Improved examples and tutorials

## 📄 License

This project is licensed under the ISC License. See the LICENSE file for details.

## 🔗 Related Links

- [Mastra Framework Documentation](https://mastra.ai/docs) - Comprehensive workflow orchestration
- [Google Cloud BigQuery Documentation](https://cloud.google.com/bigquery/docs) - Official BigQuery documentation
- [BigQuery Standard SQL Reference](https://cloud.google.com/bigquery/docs/reference/standard-sql) - SQL syntax reference
- [Google Cloud Service Account Setup](https://cloud.google.com/iam/docs/service-accounts) - Authentication setup
- [OpenRouter AI Documentation](https://openrouter.ai/docs) - AI model integration
- [Zod Documentation](https://zod.dev/) - Schema validation library

---

**Built with ❤️ using the Mastra framework for advanced workflow orchestration, Google Cloud BigQuery for enterprise-scale data analytics, and AI-powered natural language processing for intuitive data exploration.**
