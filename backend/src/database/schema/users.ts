import 
    { pgTable, uuid, primaryKey, varchar, timestamp, boolean, pgEnum }
from 'drizzle-orm/pg-core'

// Enums
export const loginMethods = pgEnum("loginMethod", 
    ['github', 'google', 'email', 'gitlab', 'phone']
)

// Stores user accounts and notification settings.
const users = pgTable("users", {
    id: uuid("user_id").primaryKey(),
    name: varchar("user_name", {length: 56}).notNull(),
    email: varchar("email", {length: 264}).unique(),
    loginMethod: loginMethods('login_method').notNull(),
    githubProfile: varchar("github_profile").unique(),
    githubID: varchar('github_id').unique(),
    role: varchar('role').notNull(),
    isActive: boolean().default(true).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }).defaultNow().notNull(),
    emailNotification: boolean('email_notifications_enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export default users 