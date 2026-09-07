import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import 'dotenv/config'
import { log } from "node:console";

const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_T9XcWohSgOL5@ep-frosty-sky-a1k7c990-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const db = drizzle(databaseUrl);

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