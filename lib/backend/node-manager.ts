/**
 * Node Manager Service
 * Handles creation, registration, and lifecycle of network nodes
 */

import { createClient } from 'redis'

export interface NetworkNodeData {
  id: string
  userId: string
  deviceId: string
  type: 'relay' | 'endpoint' | 'gateway'
  publicKey: string
  status: 'online' | 'degraded' | 'offline'
  position: { x: number; y: number }
  connections: string[]
  battery: number
  trust: number
  createdAt: number
  lastSeen: number
}

export interface NodeRegistryData {
  totalNodes: number
  onlineNodes: number
  topology: Record<string, string[]>
  lastUpdate: number
}

const NODES_KEY = 'nodes:'
const NODES_SET_KEY = 'nodes:active'

let redisClient: ReturnType<typeof createClient> | null = null

export function initializeRedisClient(client: ReturnType<typeof createClient>) {
  redisClient = client
}

/**
 * Create a new network node for a user
 */
export async function createNode(
  userId: string,
  deviceId: string,
  nodeType: 'relay' | 'endpoint' | 'gateway',
  publicKey: string
): Promise<NetworkNodeData> {
  if (!redisClient) throw new Error('Redis client not initialized')

  const nodeId = `node_${Date.now()}_${Math.random().toString(36).substring(7)}`
  
  const nodeData: NetworkNodeData = {
    id: nodeId,
    userId,
    deviceId,
    type: nodeType,
    publicKey,
    status: 'online',
    position: { x: Math.random() * 1000, y: Math.random() * 1000 },
    connections: [],
    battery: 100,
    trust: 50,
    createdAt: Date.now(),
    lastSeen: Date.now()
  }

  await redisClient.setEx(
    `${NODES_KEY}${nodeId}`,
    86400,
    JSON.stringify(nodeData)
  )

  await redisClient.sAdd(NODES_SET_KEY, nodeId)
  await publishTopologyUpdate()

  return nodeData
}

/**
 * Get a node by ID
 */
export async function getNode(nodeId: string): Promise<NetworkNodeData | null> {
  if (!redisClient) throw new Error('Redis client not initialized')

  const data = await redisClient.get(`${NODES_KEY}${nodeId}`)
  return data ? JSON.parse(data) : null
}

/**
 * Get all active nodes
 */
export async function getAllNodes(): Promise<NetworkNodeData[]> {
  if (!redisClient) throw new Error('Redis client not initialized')

  const nodeIds = await redisClient.sMembers(NODES_SET_KEY)
  const nodes: NetworkNodeData[] = []

  for (const nodeId of nodeIds) {
    const node = await getNode(nodeId)
    if (node) {
      nodes.push(node)
    } else {
      await redisClient.sRem(NODES_SET_KEY, nodeId)
    }
  }

  return nodes
}

/**
 * Get current topology
 */
export async function getTopology(): Promise<NodeRegistryData> {
  if (!redisClient) throw new Error('Redis client not initialized')

  const nodes = await getAllNodes()
  const topology: Record<string, string[]> = {}

  for (const node of nodes) {
    topology[node.id] = node.connections
  }

  return {
    totalNodes: nodes.length,
    onlineNodes: nodes.filter(n => n.status === 'online').length,
    topology,
    lastUpdate: Date.now()
  }
}

/**
 * Publish topology update
 */
async function publishTopologyUpdate(): Promise<void> {
  if (!redisClient) throw new Error('Redis client not initialized')

  const topology = await getTopology()
  await redisClient.publish('topology:updates', JSON.stringify(topology))
}
