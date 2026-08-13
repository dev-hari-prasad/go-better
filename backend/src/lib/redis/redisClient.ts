import { Redis } from 'ioredis'

import '../../config/env.ts'

// Pull redis connection string url
const REDIS_URL = process.env.REDIS_URL

// Detect redis string unavlibility
if (!REDIS_URL) {
  throw new Error('REDIS_URL is not defined')
}

// Intalize redis
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
})

export default redis