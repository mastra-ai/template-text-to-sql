# BigQuery Data Analytics and Natural Language to SQL Workflow

This project provides a Mastra workflow system for BigQuery data analytics and natural language to SQL conversion. It includes tools for analyzing BigQuery datasets, generating SQL queries from natural language descriptions, and executing queries safely using Google Cloud BigQuery.

## Features

- **BigQuery Dataset Analysis**: Automatically analyzes BigQuery datasets including tables, columns, data types, and partitioning
- **Natural Language to SQL**: Converts natural language queries into BigQuery Standard SQL using OpenAI's GPT models
- **Schema Documentation**: Generates human-readable documentation of BigQuery dataset schemas
- **Safe Query Execution**: Executes SELECT queries with BigQuery's built-in security and access controls
- **Google Cloud Integration**: Built using Google Cloud BigQuery client with service account authentication
- **Workflow Integration**: Built using Mastra workflows for orchestration and management

## Project Structure

```
src/
├── mastra/
│   ├── agents/
│   │   ├── postgres-sql-agent.ts           # PostgreSQL agent for legacy support
│   │   └── bigquery-sql-agent.ts           # BigQuery agent for data analytics
│   ├── tools/
│   │   ├── postgres/                       # PostgreSQL tools (legacy)
│   │   │   ├── database-introspection-tool.ts
│   │   │   ├── database-seeding-tool.ts
│   │   │   ├── sql-generation-tool.ts
│   │   │   └── sql-execution-tool.ts
│   │   └── bigquery/                       # BigQuery tools
│   │       └── bigquery-inspection-tool.ts # BigQuery dataset analysis and query execution
│   ├── workflows/
│   │   ├── postgres/                       # PostgreSQL workflows (legacy)
│   │   └── bigquery/                       # BigQuery workflows
│   ├── Types/
│   │   └── validation.ts                   # Zod schemas for type validation
│   └── index.ts                           # Mastra instance configuration

```

## Tools Overview

### BigQuery Inspection Tool (`bigquery-inspection-tool.ts`)

Provides comprehensive BigQuery functionality:

- **Query Execution**: Executes BigQuery Standard SQL queries safely
- **Authentication**: Uses Google Cloud service account credentials
- **Job Management**: Leverages BigQuery's async query job system
- **Error Handling**: Provides detailed BigQuery-specific error messages
- **Type Validation**: Ensures query results match expected schemas

**Key Features**:
- Supports complex BigQuery Standard SQL syntax
- Handles large datasets efficiently with BigQuery's scalability
- Integrates with Google Cloud's security and access controls
- Supports all BigQuery data types and functions
- Manages BigQuery job lifecycle automatically

**Input**: BigQuery Standard SQL query
**Output**: Query results with full BigQuery metadata and type validation

### Authentication & Configuration

The BigQuery integration uses Google Cloud service account authentication with the following environment variables:

```env
# Google Cloud Service Account
GOOGLE_TYPE=service_account
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com
GOOGLE_UNIVERSE_DOMAIN=googleapis.com

# BigQuery Configuration
BIGQUERY_PROJECT_ID=your-bigquery-project-id
```

## Enhanced BigQuery Agent

### Comprehensive BigQuery Data Analytics Assistant

The BigQuery Agent (`bigQuerySqlAgent`) provides a conversational interface for BigQuery data analytics:

#### **🔍 Dataset Analysis & Queries**

```typescript
const bigQueryAgent = mastra.getAgent('bigQuerySqlAgent');

const result = await bigQueryAgent.generate(
  [
    {
      role: 'user',
      content: 'Analyze the top 10 most visited pages from our web analytics dataset',
    },
  ],
  { maxSteps: 3 },
);
```

#### **📊 Complex Analytics Queries**

```typescript
const result = await bigQueryAgent.generate(
  [
    {
      role: 'user',
      content: 'Show me monthly revenue trends with year-over-year comparison for the last 2 years',
    },
  ],
  { maxSteps: 3 },
);
```

#### **🔗 Multi-Dataset Analysis**

```typescript
const result = await bigQueryAgent.generate(
  [
    {
      role: 'user',
      content: 'Join our sales data with customer demographics to find our most valuable customer segments',
    },
  ],
  { maxSteps: 3 },
);
```

#### **BigQuery Agent Capabilities**

✅ **BigQuery Standard SQL** - Supports full BigQuery SQL syntax and functions
✅ **Large-Scale Analytics** - Leverages BigQuery's massive parallel processing
✅ **Multi-Dataset Queries** - Handles queries across multiple BigQuery datasets
✅ **Real-time Analytics** - Executes queries on streaming data and real-time tables
✅ **Safe Execution** - Uses BigQuery's built-in security and access controls
✅ **Conversational Interface** - Natural language to BigQuery SQL translation
✅ **Google Cloud Integration** - Seamless integration with Google Cloud ecosystem

## BigQuery Analytics Workflow

### Direct Query Execution

The BigQuery integration uses a direct execution model optimized for analytics:

#### **Immediate Query Processing**

Unlike traditional database connections, BigQuery uses Google Cloud authentication and project-based access:

1. **Authentication** - Uses service account credentials for secure access
2. **Query Submission** - Submits SQL queries as BigQuery jobs
3. **Async Processing** - Leverages BigQuery's distributed processing
4. **Results Retrieval** - Returns processed results with metadata

#### **Example Usage Patterns**

**Simple Analytics Query:**
```typescript
const result = await bigQueryAgent.generate([
  {
    role: 'user',
    content: 'What are our top 5 products by revenue this quarter?'
  }
], { maxSteps: 2 });
```

**Complex Multi-Table Analysis:**
```typescript
const result = await bigQueryAgent.generate([
  {
    role: 'user', 
    content: 'Analyze customer retention rates by cohort for users who signed up in 2023, including demographic breakdowns'
  }
], { maxSteps: 3 });
```

**Time-Series Analytics:**
```typescript
const result = await bigQueryAgent.generate([
  {
    role: 'user',
    content: 'Show daily active users trend with 7-day moving average for the past 90 days'
  }
], { maxSteps: 2 });
```

## Setup and Installation

1. **Install Dependencies**:

```bash
pnpm install
```

2. **Environment Setup**:
   Create a `.env` file with your database connection:

```env
OPENAI_API_KEY=your-openai-api-key
```

## Security Notes

- Only SELECT queries are allowed for security
- Connection strings should be securely managed
- The system uses connection pooling for efficiency
- All database operations are logged for audit trails

## Current Features

✅ **Database Schema Introspection** - Automatically analyzes database structure
✅ **Database Seeding** - Optional sample data creation for testing and demos
✅ **Human-readable Documentation** - Generates beautiful schema presentations
✅ **Natural Language to SQL** - AI-powered query generation with explanations
✅ **Interactive Workflows** - Multi-step suspend/resume for human-in-the-loop
✅ **Conversational Agent** - Enhanced SQL agent with full workflow capabilities
✅ **SQL Review & Editing** - User can approve or modify generated queries
✅ **Safe Query Execution** - Only allows SELECT queries with result display
✅ **Multi-tool Orchestration** - Agent automatically uses appropriate tools
✅ **Type Safety** - Full TypeScript support with Zod validation
✅ **Error Handling** - Comprehensive error management throughout workflow

## Enhanced Dataset

The seeding tool now provides a comprehensive business dataset with realistic relationships:

### **📊 Dataset Overview**

- **5 Companies** across different industries (Technology, Finance, Healthcare, etc.)
- **7 Office Locations** with geographic distribution
- **14 Departments** with budgets and head counts
- **20 Job Titles** with career levels (Junior, Mid, Senior, Staff, Management)
- **20 Skills** across programming languages, frameworks, and tools
- **~100-150 Employees** with realistic salary distributions
- **~40-60 Projects** with various statuses and budgets
- **Relationships**: Employee-skill mappings, project assignments, salary history

### **💡 Query Ideas**

The enhanced dataset supports queries about:

- Employee hierarchies and reporting structures
- Skill distributions and proficiency levels
- Project team compositions and allocations
- Salary analysis and career progression
- Cross-company comparisons and analytics
- Geographic workforce distribution
- Department budgets and performance
- Employee-skill matching for projects
- Compensation history and trends
- Multi-table joins with complex relationships

## Dependencies

Key dependencies:

- `@mastra/core`: Workflow orchestration
- `@ai-sdk/openai`: AI integration
- `ai`: AI SDK for structured generation
- `pg`: PostgreSQL client
- `zod`: Schema validation

## License

This project is part of the Mastra ecosystem and follows the same licensing terms.
