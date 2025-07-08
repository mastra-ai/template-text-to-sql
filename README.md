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
│   │   ├── database-seeding-tool.ts        # Database seeding
│   │   ├── sql-generation-tool.ts          # Natural language to SQL conversion
│   │   └── sql-execution-tool.ts           # Safe SQL query execution
│   ├── workflows/
│   │   └── database-query-workflow.ts      # Main workflow orchestration
│   └── index.ts                           # Mastra instance configuration

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

### 2. Database Seeding Tool (`database-seeding-tool.ts`)

Seeds databases with sample data for testing:

- Creates cities table with proper schema
- Imports data from CSV or generates sample data
- Handles batch insertions efficiently
- Returns seeding statistics and metadata

**Input**: Database connection string
**Output**: Seeding results with record counts and success status

### 3. SQL Generation Tool (`sql-generation-tool.ts`)

Converts natural language queries to SQL using OpenAI's GPT-4:

- Analyzes database schema context
- Generates optimized SELECT queries
- Provides confidence scores and explanations
- Lists assumptions and tables used

**Input**: Natural language query + database schema
**Output**: SQL query with metadata and explanations

### 4. SQL Execution Tool (`sql-execution-tool.ts`)

Safely executes SQL queries:

- Restricts to SELECT queries only
- Manages connection pooling
- Provides detailed error handling
- Returns structured results

**Input**: Connection string + SQL query
**Output**: Query results or error information

## Enhanced SQL Agent

### Comprehensive Database Assistant

The SQL Agent (`sqlAgent`) now has the same capabilities as the workflow, providing a conversational interface for database operations:

#### **🔗 Database Connection & Analysis**

```typescript
const sqlAgent = mastra.getAgent('sqlAgent');

const result = await sqlAgent.generate(
  [
    {
      role: 'user',
      content:
        'Connect to postgresql://user:password@localhost:5432/database and analyze the schema',
    },
  ],
  { maxSteps: 5 }
);
```

#### **🌱 Database Seeding**

```typescript
const result = await sqlAgent.generate(
  [
    {
      role: 'user',
      content:
        'Seed the database with comprehensive business data including companies, employees, projects, and skills',
    },
  ],
  { maxSteps: 3 }
);
```

#### **🧠 Natural Language Queries**

```typescript
const result = await sqlAgent.generate(
  [
    {
      role: 'user',
      content: 'Show me the top 10 most populous cities in Europe',
    },
  ],
  { maxSteps: 5 }
);
```

#### **Agent Capabilities**

✅ **Multi-tool Orchestration** - Automatically uses the right tools for each task
✅ **Schema-Aware Queries** - Understands database structure for accurate SQL generation
✅ **Safe Execution** - Only allows SELECT queries with proper error handling
✅ **Conversational Interface** - Natural language interaction with detailed explanations
✅ **Complete Workflow** - Handles connection → seeding → introspection → querying → execution

## Workflows

### Database Query Workflow (Multi-Step with Suspend/Resume)

The main workflow (`databaseQueryWorkflow`) is a multi-step interactive workflow that performs:

#### Step 1: Database Connection

- **Suspends** to collect database connection string from user
- **Validates** connection to ensure database is accessible

#### Step 2: Database Seeding (Optional)

- **Suspends** to ask if user wants to seed database with sample data
- **Creates** cities table with sample data if requested
- **Provides** immediate data for testing and demonstration

#### Step 3: Schema Introspection

- **Automatically** introspects database schema (tables, columns, relationships, indexes)
- **Generates** human-readable schema presentation
- **Analyzes** database structure and relationships

#### Step 4: Natural Language to SQL Generation

- **Suspends** to collect natural language query from user
- **Shows** database schema information to help user formulate queries
- **Generates** SQL query using AI with confidence scores and explanations

#### Step 5: SQL Review and Execution

- **Suspends** to show generated SQL and get user approval
- **Allows** user to modify the SQL query if needed
- **Executes** the approved/modified query against the database
- **Returns** query results with metadata

**Usage**:

```typescript
const workflow = mastra.getWorkflow('databaseQueryWorkflow');
const run = await workflow.createRunAsync();

// Start workflow (will suspend for connection string)
let result = await run.start({ inputData: {} });

// Step 1: Provide connection string
result = await run.resume({
  step: 'get-connection',
  resumeData: { connectionString: 'postgresql://...' },
});

// Step 2: Choose whether to seed database
result = await run.resume({
  step: 'seed-database',
  resumeData: { seedDatabase: true },
});

// Step 3: Database introspection happens automatically

// Step 4: Provide natural language query
result = await run.resume({
  step: 'generate-sql',
  resumeData: { naturalLanguageQuery: 'Show me top 10 cities by population' },
});

// Step 5: Review and approve SQL
result = await run.resume({
  step: 'review-and-execute',
  resumeData: {
    approved: true,
    modifiedSQL: 'optional modified query',
  },
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
- **~400-500 Employees** with realistic salary distributions
- **~40-60 Projects** with various statuses and budgets
- **Relationships**: Employee-skill mappings, project assignments, salary history

### **🔍 Complex Query Examples**

The enhanced dataset enables sophisticated queries:

```sql
-- Employee analysis with skills
SELECT e.first_name, e.last_name, jt.title, d.name as department,
       c.name as company, e.salary,
       STRING_AGG(s.name, ', ') as skills
FROM employees e
JOIN job_titles jt ON e.job_title_id = jt.id
JOIN departments d ON e.department_id = d.id
JOIN companies c ON e.company_id = c.id
LEFT JOIN employee_skills es ON e.id = es.employee_id
LEFT JOIN skills s ON es.skill_id = s.id
GROUP BY e.id, jt.title, d.name, c.name, e.salary
ORDER BY e.salary DESC LIMIT 10;

-- Project team composition
SELECT p.name as project, c.name as company, p.budget, p.status,
       COUNT(pa.employee_id) as team_size,
       STRING_AGG(DISTINCT s.name, ', ') as team_skills
FROM projects p
JOIN companies c ON p.company_id = c.id
LEFT JOIN project_assignments pa ON p.id = pa.project_id
LEFT JOIN employees e ON pa.employee_id = e.id
LEFT JOIN employee_skills es ON e.id = es.employee_id
LEFT JOIN skills s ON es.skill_id = s.id
GROUP BY p.id, c.name, p.budget, p.status
ORDER BY p.budget DESC;

-- Salary analysis by department
SELECT c.name as company, d.name as department,
       AVG(e.salary) as avg_salary, COUNT(e.id) as employee_count,
       MIN(e.salary) as min_salary, MAX(e.salary) as max_salary
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN companies c ON e.company_id = c.id
GROUP BY c.name, d.name
ORDER BY avg_salary DESC;
```

### **🎯 Demo Script**

Run the enhanced seeding demonstration:

```bash
npx tsx src/demo-enhanced-seeding.ts
```

This demo will:

1. Seed the database with comprehensive business data
2. Run 8 different complex query examples
3. Show the types of insights possible with the dataset

### **🛠️ Bug Fixes & Improvements**

Recent fixes to resolve seeding issues:

```bash
npx tsx src/test-seeding-fix.ts
```

#### **✅ Email Uniqueness Fixed**
- **Problem**: Duplicate emails causing `employees_email_key` constraint violations
- **Solution**: Emails now include employee ID (e.g., `john.smith.42@company.com`)
- **Benefit**: Eliminates unique constraint errors during seeding

#### **✅ Foreign Key Constraints Fixed**
- **Problem**: Manager references to non-existent employee IDs causing `employees_manager_id_fkey` violations
- **Solution**: Insert all employees first, then update manager relationships in a separate step
- **Benefit**: Prevents foreign key constraint errors during parallel employee insertion

#### **✅ Connection Stability**
- **Improved Timeouts**: 30s connection, 3min statements/queries
- **Auto Table Dropping**: Automatically drops/recreates tables to prevent conflicts
- **Parallel Processing**: Uses `Promise.all()` for faster, more efficient inserts
- **Better Error Handling**: Clear messages for unique & foreign key constraint violations with troubleshooting hints

#### **✅ Transaction Management**
- **Batched Operations**: Data inserted in smaller, manageable chunks
- **Proper Rollback**: Clean transaction cleanup on failures
- **Progress Logging**: Shows exactly where seeding process is at each step
- **Memory Efficiency**: Processes large datasets without memory issues

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
