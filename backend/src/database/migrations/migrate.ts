import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import 'dotenv/config'
import { log } from "node:console";

// const databaseUrl = process.env.DATABASE_URL;

// if (!databaseUrl) {
// 	throw new Error('DATABASE_URL is not configured');
// }

const db = drizzle("");

async function main() {

    try{
        const currentTime = Date.now()

        await migrate(db, {
            migrationsFolder: './src/database/migrations/generated',
        });

        const completedTime = Date.now()
        log(`✅ Migration successfully completed in ${completedTime - currentTime} ms`
        )
    } catch(err) {
        log(`🔴 Migration failed. message: ${err}`)
        throw err
    }
}

main().finally(() => db.$client.end());