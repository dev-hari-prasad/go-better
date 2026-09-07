import { lt } from "drizzle-orm";
import { db } from "../database/dbClient.ts";
import sessions from "../database/schema/sessions.ts";

const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;

export async function cleanExpiredSessions() {
	await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

setInterval(() => {
	cleanExpiredSessions().catch((error) => {
		console.error("Failed to clean expired sessions:", error);
	});
}, FIFTEEN_DAYS);