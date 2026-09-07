// redisKeys.ts
export const REDIS_KEYS = {
  byok: (userId: string) => `byok:${userId}`,
  session: (userId: string) => `session:${userId}`,
  settings: (userId: string) => `settings:${userId}`,
  freeUsage: (freeUsage: string) => `freeUsage:${freeUsage}`,
  signUp: (email: string) => `signUp:${email}`,
  forgotPassword: (email: string) => `forgotPassword:${email}`
};