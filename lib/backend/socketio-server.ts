/**
 * Socket.IO Server Setup
 * Handles real-time communication and topology updates
 */

import { Server as HTTPServer } from 'http'
import { Socket, Server as SocketIOServer } from 'socket.io'
import { getRedisClient } from './redis-client'
import { getAllNodes, getTopology } from './node-manager'
import { getNodeConnections } from './connection-manager'

let io: SocketIOServer | null = null

export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Handle node subscription
    socket.on('subscribe:topology', async () => {
      console.log(`Client ${socket.id} subscribed to topology updates`)
      socket.join('topology_updates')

      const topology = await getTopology()
      socket.emit('topology:initial', topology)
    })

    // Handle node selection
    socket.on('select:node', async (nodeId: string) => {
      socket.join(`node_${nodeId}`)
      const connections = await getNodeConnections(nodeId)
      socket.emit('node:connections', connections)
    })

    // Handle unsubscribe
    socket.on('unsubscribe:topology', () => {
      socket.leave('topology_updates')
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })

  // Subscribe to Redis topology updates
  subscribeToRedisUpdates()

  return io
}

export function getSocketIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

async function subscribeToRedisUpdates() {
  const redis = getRedisClient()
  const subscriber = redis.duplicate()

  try {
    await subscriber.connect()

    await subscriber.subscribe('topology:updates', (message) => {
      try {
        const topology = JSON.parse(message)
        if (io) {
          io.to('topology_updates').emit('topology:update', topology)
        }
      } catch (error) {
        console.error('Failed to parse topology update:', error)
      }
    })

    await subscriber.subscribe('connections:*', (message) => {
      try {
        const event = JSON.parse(message)
        if (io) {
          io.emit('connection:update', event)
        }
      } catch (error) {
        console.error('Failed to parse connection update:', error)
      }
    })

    console.log('Redis subscriber initialized')
  } catch (error) {
    console.error('Failed to setup Redis subscriptions:', error)
  }
}
