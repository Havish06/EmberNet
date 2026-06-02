/**
 * Connection Manager Service
 * Handles establishment and lifecycle of encrypted connections between nodes
 */

import { getRedisClient } from './redis-client'

export interface ConnectionData {
  id: string
  sourceNodeId: string
  targetNodeId: string
  status: 'pending' | 'handshaking' | 'connected' | 'terminated'
  sessionKeyId: string
  sharedSecret?: string
  verificationStatus: 'unverified' | 'verifying' | 'verified'
  encryptionType: 'chacha20'
  establishedAt: number | null
  terminatedAt: number | null
  bytesIn: number
  bytesOut: number
  latency: number
  createdAt: number
}

const CONNECTIONS_KEY = 'connections:'
const CONNECTIONS_SET_KEY = 'connections:active'
const SESSION_KEYS_KEY = 'session_keys:'

/**
 * Create a new connection between two nodes
 */
export async function createConnection(
  sourceNodeId: string,
  targetNodeId: string
): Promise<ConnectionData> {
  const redis = getRedisClient()
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const sessionKeyId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`

  const connectionData: ConnectionData = {
    id: connectionId,
    sourceNodeId,
    targetNodeId,
    status: 'pending',
    sessionKeyId,
    verificationStatus: 'unverified',
    encryptionType: 'chacha20',
    establishedAt: null,
    terminatedAt: null,
    bytesIn: 0,
    bytesOut: 0,
    latency: 50,
    createdAt: Date.now()
  }

  await redis.setEx(
    `${CONNECTIONS_KEY}${connectionId}`,
    86400,
    JSON.stringify(connectionData)
  )

  await redis.sAdd(CONNECTIONS_SET_KEY, connectionId)
  await publishConnectionEvent(connectionId, 'created', connectionData)

  return connectionData
}

/**
 * Get connection by ID
 */
export async function getConnection(connectionId: string): Promise<ConnectionData | null> {
  const redis = getRedisClient()
  const data = await redis.get(`${CONNECTIONS_KEY}${connectionId}`)
  return data ? JSON.parse(data) : null
}

/**
 * Update connection status
 */
export async function updateConnectionStatus(
  connectionId: string,
  status: 'pending' | 'handshaking' | 'connected' | 'terminated'
): Promise<void> {
  const redis = getRedisClient()
  const connection = await getConnection(connectionId)

  if (!connection) throw new Error(`Connection ${connectionId} not found`)

  connection.status = status
  if (status === 'connected') {
    connection.establishedAt = Date.now()
  } else if (status === 'terminated') {
    connection.terminatedAt = Date.now()
  }

  await redis.setEx(
    `${CONNECTIONS_KEY}${connectionId}`,
    86400,
    JSON.stringify(connection)
  )

  await publishConnectionEvent(connectionId, 'updated', connection)
}

/**
 * Store session key (temporary, high security)
 */
export async function storeSessionKey(
  sessionKeyId: string,
  connectionId: string,
  sharedSecret: string,
  encryptionKey: string
): Promise<void> {
  const redis = getRedisClient()

  const keyData = {
    id: sessionKeyId,
    connectionId,
    sharedSecret,
    encryptionKey,
    createdAt: Date.now()
  }

  await redis.setEx(
    `${SESSION_KEYS_KEY}${sessionKeyId}`,
    3600,
    JSON.stringify(keyData)
  )
}

/**
 * Get session key (used for decryption)
 */
export async function getSessionKey(sessionKeyId: string): Promise<any | null> {
  const redis = getRedisClient()
  const data = await redis.get(`${SESSION_KEYS_KEY}${sessionKeyId}`)
  return data ? JSON.parse(data) : null
}

/**
 * Get all connections for a node
 */
export async function getNodeConnections(nodeId: string): Promise<ConnectionData[]> {
  const redis = getRedisClient()
  const connectionIds = await redis.sMembers(CONNECTIONS_SET_KEY)
  const connections: ConnectionData[] = []

  for (const connId of connectionIds) {
    const conn = await getConnection(connId)
    if (conn && (conn.sourceNodeId === nodeId || conn.targetNodeId === nodeId)) {
      connections.push(conn)
    }
  }

  return connections
}

/**
 * Terminate a connection
 */
export async function terminateConnection(connectionId: string): Promise<void> {
  const redis = getRedisClient()
  const connection = await getConnection(connectionId)

  if (!connection) throw new Error(`Connection ${connectionId} not found`)

  await updateConnectionStatus(connectionId, 'terminated')
  
  if (connection.sessionKeyId) {
    await redis.del(`${SESSION_KEYS_KEY}${connection.sessionKeyId}`)
  }

  await redis.sRem(CONNECTIONS_SET_KEY, connectionId)
}

/**
 * Publish connection event via Redis Pub/Sub
 */
async function publishConnectionEvent(
  connectionId: string,
  eventType: 'created' | 'updated' | 'terminated',
  connection: ConnectionData
): Promise<void> {
  const redis = getRedisClient()

  await redis.publish(`connections:${connectionId}`, JSON.stringify({
    eventType,
    connection,
    timestamp: Date.now()
  }))
}
