import { BigQuery } from "@google-cloud/bigquery";
import { ServiceAccountSchema } from "../../Types/validation";

class BigQuerySingleton {
  private static instance: BigQuery | null = null;
  private static isInitialized: boolean = false;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static getInstance(): BigQuery {
    if (!BigQuerySingleton.instance || !BigQuerySingleton.isInitialized) {
      BigQuerySingleton.instance = BigQuerySingleton.createClient();
      BigQuerySingleton.isInitialized = true;
    }
    return BigQuerySingleton.instance;
  }

  private static createClient(): BigQuery {
    const requiredEnvVars = [
      "GOOGLE_TYPE",
      "GOOGLE_PROJECT_ID",
      "GOOGLE_PRIVATE_KEY_ID",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_CLIENT_EMAIL",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_AUTH_URI",
      "GOOGLE_TOKEN_URI",
      "GOOGLE_AUTH_PROVIDER_X509_CERT_URL",
      "GOOGLE_CLIENT_X509_CERT_URL",
      "GOOGLE_UNIVERSE_DOMAIN",
      "BIGQUERY_PROJECT_ID",
    ];

    for (const key of requiredEnvVars) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    const credentials = {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
    };

    ServiceAccountSchema.parse(credentials); // Validate at runtime
    return new BigQuery({
      projectId: process.env.BIGQUERY_PROJECT_ID,
      credentials,
    });
  }

  // Method to reset the singleton (useful for testing)
  public static reset(): void {
    BigQuerySingleton.instance = null;
    BigQuerySingleton.isInitialized = false;
  }
}

// Export the singleton instance getter
export function createBigQueryClient(): BigQuery {
  return BigQuerySingleton.getInstance();
}

// Export the singleton class for advanced usage
export { BigQuerySingleton };
