import { pgTable, varchar, json } from "drizzle-orm/pg-core";

const otpVerification = pgTable('otp_verification', {
    emailKey: varchar('key').notNull(),
    value: json('value').notNull()
})

export default otpVerification