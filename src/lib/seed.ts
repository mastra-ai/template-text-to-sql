import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";
import * as dotenv from "dotenv";

dotenv.config();

interface City {
  popularity: number;
  geoname_id: number;
  name_en: string;
  country_code: string;
  population: number;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  continent: string;
  code2: string;
  code: string;
  province: string;
}

async function createCitiesTable(client: Client): Promise<void> {
  try {
    await client.query("DROP TABLE IF EXISTS cities");

    const createTableQuery = `
      CREATE TABLE cities (
        id SERIAL PRIMARY KEY,
        popularity INTEGER,
        geoname_id INTEGER,
        name_en VARCHAR(255),
        country_code VARCHAR(10),
        population BIGINT,
        latitude DECIMAL(10, 6),
        longitude DECIMAL(10, 6),
        country VARCHAR(255),
        region VARCHAR(255),
        continent VARCHAR(255),
        code2 VARCHAR(10),
        code VARCHAR(10),
        province VARCHAR(255)
      )
    `;

    await client.query(createTableQuery);
    console.log("Cities table created successfully");
  } catch (error) {
    console.error("Error creating cities table:", error);
    throw error;
  }
}

// Function to parse CSV and insert data into the table
async function importCitiesData(client: Client): Promise<void> {
  const csvFilePath = path.resolve(process.cwd(), "world_cities_geoname.csv");

  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found at ${csvFilePath}`);
  }

  const parser = fs.createReadStream(csvFilePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  );

  try {
    await client.query("BEGIN");

    let count = 0;
    const batchSize = 1000;
    let batch: City[] = [];

    for await (const record of parser) {
      const city: City = {
        popularity: parseInt(record.popularity) || 0,
        geoname_id: parseInt(record.geoname_id) || 0,
        name_en: record.name_en || "",
        country_code: record.country_code || "",
        population: parseInt(record.population) || 0,
        latitude: parseFloat(record.latitude) || 0,
        longitude: parseFloat(record.longitude) || 0,
        country: record.country || "",
        region: record.region || "",
        continent: record.continent || "",
        code2: record.code2 || "",
        code: record.code || "",
        province: record.province || "",
      };

      batch.push(city);

      if (batch.length >= batchSize) {
        await insertBatch(client, batch);
        count += batch.length;
        console.log(`Inserted ${count} records`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatch(client, batch);
      count += batch.length;
    }

    await client.query("COMMIT");
    console.log(`Import completed. Total records: ${count}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error importing data:", error);
    throw error;
  }
}

async function insertBatch(client: Client, batch: City[]): Promise<void> {
  const values = batch
    .map((city) => {
      return `(${city.popularity}, ${city.geoname_id}, '${escapeSql(city.name_en)}', '${escapeSql(city.country_code)}',
    ${city.population}, ${city.latitude}, ${city.longitude}, '${escapeSql(city.country)}',
    '${escapeSql(city.region)}', '${escapeSql(city.continent)}', '${escapeSql(city.code2)}',
    '${escapeSql(city.code)}', '${escapeSql(city.province)}')`;
    })
    .join(",\n");

  const query = `
    INSERT INTO cities (
      popularity, geoname_id, name_en, country_code, population,
      latitude, longitude, country, region, continent, code2, code, province
    ) VALUES \n${values}
  `;

  await client.query(query);
}

function escapeSql(str: string): string {
  if (!str) return "";
  return str.replace(/'/g, "''");
}

async function seed(): Promise<void> {
  const client = new Client();

  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    await createCitiesTable(client);
    await importCitiesData(client);

    console.log("Seed process completed successfully");
  } catch (error) {
    console.error("Seed process failed:", error);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seed().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

export { seed };
