/**
 * Redis Configuration
 * Centralized Redis client and connection management
 */

import { createClient, RedisClientType } from 'redis'

let client: RedisClientType | null = null

export async function initializeRedis(): Promise<RedisClientType> {
  if (client) return client

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis connection failed after 10 retries')
          return new Error('Redis connection failed')
        }
        return Math.min(retries * 50, 500)
      }
    }
  })

  client.on('error', (err) => {
    console.error('Redis error:', err)
  })

  client.on('connect', () => {
    console.log('Redis connected')
  })

  client.on('reconnecting', () => {
    console.log('Redis reconnecting...')
  })

  try {
    await client.connect()
    console.log('Redis client initialized')
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    throw error
  }

  return client
}

export function getRedisClient(): RedisClientType {
  if (!client) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.')
  }
  return client
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit()
    client = null
  }
}
