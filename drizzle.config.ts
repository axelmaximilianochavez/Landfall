import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
});
