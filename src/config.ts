import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface EnvConfig {
  clientId: string;
  tenantId: string;
  clientSecret: string;
}

export function getEnvConfig(): EnvConfig {
  const clientId = process.env.CLIENT_ID;
  const tenantId = process.env.TENANT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!clientId || !tenantId || !clientSecret) {
    throw new Error('Missing required environment variables: CLIENT_ID, TENANT_ID, CLIENT_SECRET');
  }

  return {
    clientId,
    tenantId,
    clientSecret,
  };
} 