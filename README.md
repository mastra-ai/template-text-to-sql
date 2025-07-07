# Database Introspection and Natural Language to SQL Workflow

This project provides a Mastra workflow system for database introspection and natural language to SQL conversion. It includes tools for analyzing database schemas, generating SQL queries from natural language descriptions, and executing queries safely.

## Features

- **Database Introspection**: Automatically analyzes PostgreSQL database schemas including tables, columns, relationships, and indexes
- **Natural Language to SQL**: Converts natural language queries into SQL using OpenAI's GPT models
- **Schema Presentation**: Generates human-readable documentation of database schemas
- **Safe Query Execution**: Only allows SELECT queries for security
- **Workflow Integration**: Built using Mastra workflows for orchestration and management

## Project Structure

```
src/
├── mastra/
│   ├── agents/
│   │   └── sql-agent.ts                    # SQL agent for query generation
│   ├── tools/
│   │   ├── database-introspection-tool.ts  # Database schema analysis
│   │   ├── sql-generation-tool.ts          # Natural language to SQL conversion
│   │   ├── sql-execution-tool.ts           # Safe SQL query execution
│   │   └── population-info-tool.ts         # Original population query tool
│   ├── workflows/
│   │   └── database-query-workflow.ts      # Main workflow orchestration
│   └── index.ts                           # Mastra instance configuration
├── lib/
│   └── seed.ts                            # Database seeding utilities
└── test-database-workflow.ts             # Testing script
```

## Tools Overview

### 1. Database Introspection Tool (`database-introspection-tool.ts`)

Analyzes a PostgreSQL database to extract:
- Table structure and metadata
- Column definitions with types and constraints
- Primary key and foreign key relationships
- Index definitions
- Row counts for each table

**Input**: Database connection string
**Output**: Complete schema information with summary statistics

### 2. SQL Generation Tool (`sql-generation-tool.ts`)

Converts natural language queries to SQL using OpenAI's GPT-4:
- Analyzes database schema context
- Generates optimized SELECT queries
- Provides confidence scores and explanations
- Lists assumptions and tables used

**Input**: Natural language query + database schema
**Output**: SQL query with metadata and explanations

### 3. SQL Execution Tool (`sql-execution-tool.ts`)

Safely executes SQL queries:
- Restricts to SELECT queries only
- Manages connection pooling
- Provides detailed error handling
- Returns structured results

**Input**: Connection string + SQL query
**Output**: Query results or error information

## Workflows

### Database Query Workflow (Multi-Step with Suspend/Resume)

The main workflow (`databaseQueryWorkflow`) is a multi-step interactive workflow that performs:

#### Step 1: Connection and Introspection
- **Suspends** to collect database connection string from user
- **Introspects** database schema including tables, columns, relationships, and indexes
- **Generates** human-readable schema presentation

#### Step 2: Natural Language to SQL Generation
- **Suspends** to collect natural language query from user
- **Shows** database schema information to help user formulate queries
- **Generates** SQL query using AI with confidence scores and explanations

#### Step 3: SQL Review and Execution
- **Suspends** to show generated SQL and get user approval
- **Allows** user to modify the SQL query if needed
- **Executes** the approved/modified query against the database
- **Returns** query results with metadata

**Usage**:
```typescript
const workflow = mastra.getWorkflow("databaseQueryWorkflow");
const run = await workflow.createRunAsync();

// Start workflow (will suspend for connection string)
let result = await run.start({ inputData: {} });

// Step 1: Provide connection string
result = await run.resume({
  step: "get-connection-and-introspect",
  resumeData: { connectionString: "postgresql://..." }
});

// Step 2: Provide natural language query
result = await run.resume({
  step: "generate-sql",
  resumeData: { naturalLanguageQuery: "Show me top 10 cities by population" }
});

// Step 3: Review and approve SQL
result = await run.resume({
  step: "review-and-execute",
  resumeData: {
    approved: true,
    modifiedSQL: "optional modified query"
  }
});
```

## Setup and Installation

1. **Install Dependencies**:
```bash
pnpm install
```

2. **Environment Setup**:
Create a `.env` file with your database connection:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
OPENAI_API_KEY=your-openai-api-key
```

3. **Database Setup**:
If you want to test with the cities database:
```bash
# Run the seed script to populate the database
npx tsx src/lib/seed.ts
```

## Usage Examples

### Testing the Workflow

#### Automated Test Script
Run the automated test script to see the full workflow in action:
```bash
npx tsx src/test-database-workflow.ts
```

#### Interactive Demo
Run the interactive demo to manually walk through each step:
```bash
npx tsx src/demo-interactive-workflow.ts
```

This interactive demo will:
1. Prompt you for a database connection string
2. Show you the introspected schema
3. Ask for your natural language query
4. Show the generated SQL with explanations
5. Let you approve or modify the query
6. Execute and display results

### Using in Your Application

```typescript
import { mastra } from "./src/mastra";

async function analyzeDatabase() {
  const workflow = mastra.getWorkflow("databaseIntrospectionWorkflow");
  const run = await workflow.createRunAsync();

  const result = await run.start({
    inputData: {
      connectionString: process.env.DATABASE_URL
    }
  });

  if (result.status === "success") {
    console.log("Schema:", result.result.schema);
    console.log("Presentation:", result.result.schemaPresentation);
  }
}
```

### Using Individual Tools

```typescript
import { databaseIntrospectionTool } from "./src/mastra/tools/database-introspection-tool";
import { RuntimeContext } from "@mastra/core/di";

// Direct tool usage
const schema = await databaseIntrospectionTool.execute({
  context: { connectionString: "postgresql://..." },
  runtimeContext: new RuntimeContext()
});
```

## Development

### Running in Development Mode

```bash
pnpm dev
```

This starts the Mastra development server with the workflow playground available at `http://localhost:4111/workflows`.

### Building for Production

```bash
pnpm build
```

### Running Tests

```bash
npx tsx src/test-database-workflow.ts
```

## Configuration

The system is configured in `src/mastra/index.ts`:

```typescript
export const mastra = new Mastra({
  agents: { sqlAgent },
  workflows: {
    databaseIntrospectionWorkflow,
    testWorkflow,
  },
  storage: new LibSQLStore({
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
```

## Security Notes

- Only SELECT queries are allowed for security
- Connection strings should be securely managed
- The system uses connection pooling for efficiency
- All database operations are logged for audit trails

## Current Features

✅ **Database Schema Introspection** - Automatically analyzes database structure
✅ **Human-readable Documentation** - Generates beautiful schema presentations
✅ **Natural Language to SQL** - AI-powered query generation with explanations
✅ **Interactive Workflows** - Multi-step suspend/resume for human-in-the-loop
✅ **SQL Review & Editing** - User can approve or modify generated queries
✅ **Safe Query Execution** - Only allows SELECT queries with result display
✅ **Type Safety** - Full TypeScript support with Zod validation
✅ **Error Handling** - Comprehensive error management throughout workflow

## Future Enhancements

This system provides a foundation for additional advanced features:

1. **Multi-Database Support**: Extend to MySQL, SQL Server, Oracle, etc.
2. **Query Optimization**: Add query performance analysis and suggestions
3. **Data Visualization**: Generate charts and graphs from query results
4. **API Endpoints**: Expose workflows as REST/GraphQL APIs
5. **Query History**: Save and reuse previous queries
6. **Batch Operations**: Support multiple queries in sequence
7. **Real-time Collaboration**: Multiple users working on same database
8. **Advanced Analytics**: Statistical analysis and data insights

## Dependencies

Key dependencies:
- `@mastra/core`: Workflow orchestration
- `@ai-sdk/openai`: AI integration
- `ai`: AI SDK for structured generation
- `pg`: PostgreSQL client
- `zod`: Schema validation

## License

This project is part of the Mastra ecosystem and follows the same licensing terms.
