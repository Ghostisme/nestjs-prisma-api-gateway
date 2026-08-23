import path from 'node:path';
import { existsSync } from 'node:fs';
import { defineConfig, env } from 'prisma/config';

const envFile = path.join(__dirname, `.env.${process.env.NODE_ENV ?? 'development'}`);
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
});
