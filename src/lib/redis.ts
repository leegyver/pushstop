import Redis from 'ioredis'
// @ts-ignore - Redlock exports map has issues with bundler resolution
import Redlock from 'redlock'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
})

export const redlock = new Redlock([redis], {
  driftFactor: 0.01,
  retryCount: 10,
  retryDelay: 200,
  retryJitter: 200,
})

redis.on('error', (err) => {
  console.error('Redis error:', err)
})
