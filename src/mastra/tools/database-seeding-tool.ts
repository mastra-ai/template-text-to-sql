import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse";

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

async function importCitiesData(client: Client): Promise<number> {
  const csvFilePath = path.resolve(process.cwd(), "world_cities_geoname.csv");

  if (!fs.existsSync(csvFilePath)) {
    // If no CSV file, create a simple sample dataset
    console.log("CSV file not found, creating sample data...");
    return await createSampleData(client);
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
    return count;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error importing data:", error);
    throw error;
  }
}

async function createSampleData(client: Client): Promise<number> {
  const sampleCities = [
    { name_en: "New York", country: "United States", continent: "North America", population: 8336817, latitude: 40.7128, longitude: -74.0060 },
    { name_en: "London", country: "United Kingdom", continent: "Europe", population: 8982000, latitude: 51.5074, longitude: -0.1278 },
    { name_en: "Tokyo", country: "Japan", continent: "Asia", population: 13929286, latitude: 35.6762, longitude: 139.6503 },
    { name_en: "Paris", country: "France", continent: "Europe", population: 2165423, latitude: 48.8566, longitude: 2.3522 },
    { name_en: "Sydney", country: "Australia", continent: "Oceania", population: 5312163, latitude: -33.8688, longitude: 151.2093 },
    { name_en: "São Paulo", country: "Brazil", continent: "South America", population: 12325232, latitude: -23.5505, longitude: -46.6333 },
    { name_en: "Mumbai", country: "India", continent: "Asia", population: 20411274, latitude: 19.0760, longitude: 72.8777 },
    { name_en: "Cairo", country: "Egypt", continent: "Africa", population: 9120350, latitude: 30.0444, longitude: 31.2357 },
    { name_en: "Berlin", country: "Germany", continent: "Europe", population: 3669491, latitude: 52.5200, longitude: 13.4050 },
    { name_en: "Los Angeles", country: "United States", continent: "North America", population: 3971883, latitude: 34.0522, longitude: -118.2437 },
  ];

  try {
    await client.query("BEGIN");

    for (const city of sampleCities) {
      await client.query(`
        INSERT INTO cities (
          popularity, geoname_id, name_en, country_code, population,
          latitude, longitude, country, region, continent, code2, code, province
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        1, // popularity
        Math.floor(Math.random() * 1000000), // geoname_id
        city.name_en,
        city.country === "United States" ? "US" : city.country === "United Kingdom" ? "GB" : "XX", // country_code
        city.population,
        city.latitude,
        city.longitude,
        city.country,
        city.name_en, // region
        city.continent,
        city.country === "United States" ? "US" : city.country === "United Kingdom" ? "GB" : "XX", // code2
        city.country === "United States" ? "USA" : city.country === "United Kingdom" ? "GBR" : "XXX", // code
        city.name_en // province
      ]);
    }

    await client.query("COMMIT");
    console.log(`Sample data created. Total records: ${sampleCities.length}`);
    return sampleCities.length;
  } catch (error) {
    await client.query("ROLLBACK");
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

export const databaseSeedingTool = createTool({
  id: "database-seeding",
  inputSchema: z.object({
    connectionString: z.string().describe("PostgreSQL connection string"),
  }),
  description: "Seeds the database with cities data (creates cities table and populates with sample data)",
  execute: async ({ context: { connectionString } }) => {
    const client = new Client({ connectionString });

    try {
      await client.connect();
      console.log("Connected to PostgreSQL for seeding");

      await createCitiesTable(client);
      const recordCount = await importCitiesData(client);

      return {
        success: true,
        message: `Database seeded successfully with ${recordCount} cities`,
        recordCount,
        tablesCreated: ["cities"],
      };
    } catch (error) {
      throw new Error(`Failed to seed database: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await client.end();
    }
  },
});
