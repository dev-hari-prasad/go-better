import 
    { pgTable, uuid, primaryKey, varchar, timestamp, boolean, pgEnum, numeric, text }
from 'drizzle-orm/pg-core'

// Enums
export const loginMethods = pgEnum("loginMethod", 
    ['github', 'email']
)

// Stores user accounts and notification settings.
const users = pgTable("users", {
    id: uuid("user_id").primaryKey().defaultRandom(),
    name: varchar("user_name", {length: 56}).notNull(),
    email: varchar("email", {length: 264}).unique(),
    passWord: varchar('password'),
    loginMethod: loginMethods('login_method').notNull(),
    githubProfile: varchar("github_profile").unique(),
    githubID: numeric('github_id').unique(),
    githubAccessToken: text('github_access_token'),
    isGithubConnected: boolean('is_github_connected').default(false).notNull(),
    isActive: boolean().default(true).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }).defaultNow().notNull(),
    emailNotification: boolean('email_notifications_enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export default users 