import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
    schema: './src/database/schema/index.ts',
    out: './src/database/migrations/generated',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    },
    verbose: true,
    strict: true
}) 
