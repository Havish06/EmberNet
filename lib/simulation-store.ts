'use client'

import { create } from 'zustand'
import { 
  generateSigningKeys, 
  generateEncryptionKeys, 
  generateSharedSecret, 
  encryptWithSharedSecret, 
  decryptWithSharedSecret,
  signMessage,
  verifySignedMessage,
  hashSHA256,
  Certificate
} from './crypto-utils'
import {
  initializeNodeSecrets,
  trustCertificate,
  verifyCertificateChain,
  SessionKeyStore,
  NodeSecrets
} from './certificate-manager'
import {
  findShortestPath,
  findAlternativePaths,
  calculateRouteQuality,
  findSecurePath,
  RouteNode
} from './routing-engine'

export type NodeType = 'relay' | 'endpoint' | 'gateway'
export type NodeStatus = 'online' | 'degraded' | 'offline'
export type ConnectionStatus = 'pending' | 'handshaking' | 'connected' | 'terminated' | 'failed'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed'

export interface NetworkNode {
  id: string
  label: string
  type: NodeType
  status: NodeStatus
  battery: number
  trust: number
  latency: number
  packetsSent: number
  packetsReceived: number
  packetsTransmitted: number
  packetsDropped: number
  position: { x: number; y: number }
  connections: string[]
}

export interface DiscoveredPeer {
  id: string
  label: string
  type: NodeType
  signalStrength: number // 0-100
  distance: number // simulated meters
  trust: number
  discoveredAt: number
  lastSeen: number
  isConnectable: boolean
}

export interface Connection {
  id: string
  localNodeId: string
  remoteNodeId: string
  remotePeerLabel: string
  status: ConnectionStatus
  establishedAt: number | null
  terminatedAt: number | null
  handshakeProgress: number // 0-100
  bytesIn: number
  bytesOut: number
  packetsIn: number
  packetsOut: number
  latency: number
  encryption: 'none' | 'aes-256' | 'chacha20'
  protocol: 'tcp' | 'udp' | 'mesh'
  // Security fields
  sessionKeyId?: string
  remoteCertificate?: Certificate
  sharedSecret?: string
  handshakeChallenge?: string
  verificationStatus: 'unverified' | 'verifying' | 'verified' | 'failed'
}

export interface Message {
  id: string
  connectionId: string
  direction: 'inbound' | 'outbound'
  content: string
  timestamp: number
  status: MessageStatus
  size: number
  // Security fields
  encrypted: boolean
  encryptedContent?: string
  signature?: string
  verified: boolean
}

export interface Packet {
  id: string
  sourceId: string
  targetId: string
  currentNodeId: string
  path: string[]
  progress: number
  type: 'data' | 'heartbeat' | 'discovery' | 'handshake' | 'message'
  size: number
  ttl: number
  createdAt: number
  connectionId?: string
  // Security fields
  encryptedPayload?: string
  signature?: string
  route?: string[] // Dijkstra-computed route
  routeQuality?: number
}

export type TrafficStage = 'sent' | 'transmitted' | 'received' | 'dropped'

export interface TrafficRecord {
  id: string
  packetId: string
  timestamp: number
  stage: TrafficStage
  packetType: Packet['type']
  sourceId: string
  fromNodeId: string
  toNodeId: string | null
  currentNodeId: string
  route: string[]
  connectionId?: string
  size: number
  encrypted: boolean
}

export interface NetworkEvent {
  id: string
  timestamp: number
  type: 'packet_sent' | 'packet_delivered' | 'packet_dropped' | 'node_status_change' | 'chaos_event' | 'route_change' | 'peer_discovered' | 'peer_lost' | 'connection_request' | 'connection_established' | 'connection_terminated' | 'message_sent' | 'message_received' | 'handshake_start' | 'handshake_complete'
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  nodeId?: string
  packetId?: string
  connectionId?: string
}

export interface ChaosConfig {
  packetLoss: number
  latencySpike: number
  nodeFailureRate: number
  batteryDrain: number
  enabled: boolean
}

export interface NetworkMetrics {
  totalPacketsSent: number
  totalPacketsDelivered: number
  totalPacketsDropped: number
  avgLatency: number
  networkUptime: number
  activeNodes: number
  totalNodes: number
  throughput: number
  history: {
    timestamp: number
    throughput: number
    latency: number
    packetLoss: number
  }[]
}

interface SimulationState {
  // Core state
  nodes: NetworkNode[]
  packets: Packet[]
  events: NetworkEvent[]
  metrics: NetworkMetrics
  chaos: ChaosConfig
  
  // Discovery state
  discoveredPeers: DiscoveredPeer[]
  isScanning: boolean
  scanRadius: number
  traffic: TrafficRecord[]
  
  // Connection state
  connections: Connection[]
  pendingConnections: string[]
  
  // Messaging state
  messages: Message[]
  
  // Security state
  nodeSecrets: NodeSecrets | null
  sessionKeyStore: SessionKeyStore | null
  routingGraph: Record<string, RouteNode>
  
  // Simulation control
  isRunning: boolean
  speed: number
  tickCount: number
  selectedNodeId: string | null
  selectedConnectionId: string | null
  activeEnvironment: 'discovery' | 'management'
  
  // Actions
  tick: () => void
  start: () => void
  pause: () => void
  reset: () => void
  setSpeed: (speed: number) => void
  selectNode: (nodeId: string | null) => void
  selectConnection: (connectionId: string | null) => void
  setActiveEnvironment: (env: 'discovery' | 'management') => void
  
  // Chaos actions
  setChaos: (config: Partial<ChaosConfig>) => void
  toggleChaos: () => void
  
  // Node actions
  toggleNodeStatus: (nodeId: string) => void
  killNode: (nodeId: string) => void
  reviveNode: (nodeId: string) => void
  
  // Discovery actions
  startScan: () => void
  stopScan: () => void
  setScanRadius: (radius: number) => void
  
  // Connection actions
  initiateConnection: (peerId: string) => void
  acceptConnection: (connectionId: string) => void
  rejectConnection: (connectionId: string) => void
  terminateConnection: (connectionId: string) => void
  
  // Messaging actions
  sendMessage: (connectionId: string, content: string) => void
  
  // Security actions
  initializeSecrets: () => void
  performKeyExchange: (connectionId: string) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// Initial network topology
const initialNodes: NetworkNode[] = [
  { id: 'gw-1', label: 'Gateway Alpha', type: 'gateway', status: 'online', battery: 100, trust: 95, latency: 12, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 400, y: 50 }, connections: ['relay-1', 'relay-2'] },
  { id: 'gw-2', label: 'Gateway Beta', type: 'gateway', status: 'online', battery: 100, trust: 92, latency: 15, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 800, y: 50 }, connections: ['relay-2', 'relay-3'] },
  { id: 'relay-1', label: 'Relay Node 01', type: 'relay', status: 'online', battery: 87, trust: 88, latency: 25, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 200, y: 200 }, connections: ['gw-1', 'relay-4', 'end-1', 'end-2'] },
  { id: 'relay-2', label: 'Relay Node 02', type: 'relay', status: 'online', battery: 92, trust: 91, latency: 18, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 600, y: 180 }, connections: ['gw-1', 'gw-2', 'relay-4', 'relay-5'] },
  { id: 'relay-3', label: 'Relay Node 03', type: 'relay', status: 'online', battery: 76, trust: 85, latency: 32, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 1000, y: 200 }, connections: ['gw-2', 'relay-5', 'end-5', 'end-6'] },
  { id: 'relay-4', label: 'Relay Node 04', type: 'relay', status: 'online', battery: 64, trust: 79, latency: 45, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 400, y: 350 }, connections: ['relay-1', 'relay-2', 'end-2', 'end-3'] },
  { id: 'relay-5', label: 'Relay Node 05', type: 'relay', status: 'degraded', battery: 34, trust: 72, latency: 78, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 800, y: 350 }, connections: ['relay-2', 'relay-3', 'end-4', 'end-5'] },
  { id: 'end-1', label: 'Device A1', type: 'endpoint', status: 'online', battery: 95, trust: 100, latency: 5, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 50, y: 300 }, connections: ['relay-1'] },
  { id: 'end-2', label: 'Device A2', type: 'endpoint', status: 'online', battery: 82, trust: 98, latency: 8, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 150, y: 400 }, connections: ['relay-1', 'relay-4'] },
  { id: 'end-3', label: 'Device B1', type: 'endpoint', status: 'online', battery: 71, trust: 95, latency: 12, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 450, y: 500 }, connections: ['relay-4'] },
  { id: 'end-4', label: 'Device B2', type: 'endpoint', status: 'degraded', battery: 23, trust: 88, latency: 45, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 750, y: 500 }, connections: ['relay-5'] },
  { id: 'end-5', label: 'Device C1', type: 'endpoint', status: 'online', battery: 88, trust: 96, latency: 15, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 950, y: 400 }, connections: ['relay-3', 'relay-5'] },
  { id: 'end-6', label: 'Device C2', type: 'endpoint', status: 'online', battery: 67, trust: 91, latency: 22, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0, position: { x: 1100, y: 300 }, connections: ['relay-3'] },
]

// Simulated discoverable peers (not yet in the network)
const potentialPeers: Omit<DiscoveredPeer, 'discoveredAt' | 'lastSeen'>[] = [
  { id: 'peer-1', label: 'Mobile Unit X1', type: 'endpoint', signalStrength: 85, distance: 45, trust: 78, isConnectable: true },
  { id: 'peer-2', label: 'Relay Station R7', type: 'relay', signalStrength: 72, distance: 120, trust: 88, isConnectable: true },
  { id: 'peer-3', label: 'Field Device F3', type: 'endpoint', signalStrength: 45, distance: 280, trust: 65, isConnectable: true },
  { id: 'peer-4', label: 'Gateway Gamma', type: 'gateway', signalStrength: 92, distance: 30, trust: 95, isConnectable: true },
  { id: 'peer-5', label: 'Sensor Node S1', type: 'endpoint', signalStrength: 38, distance: 350, trust: 55, isConnectable: false },
  { id: 'peer-6', label: 'Relay Hub H2', type: 'relay', signalStrength: 61, distance: 180, trust: 82, isConnectable: true },
  { id: 'peer-7', label: 'Edge Device E4', type: 'endpoint', signalStrength: 28, distance: 420, trust: 42, isConnectable: false },
  { id: 'peer-8', label: 'Mobile Unit X2', type: 'endpoint', signalStrength: 79, distance: 65, trust: 75, isConnectable: true },
]

const initialMetrics: NetworkMetrics = {
  totalPacketsSent: 0,
  totalPacketsDelivered: 0,
  totalPacketsDropped: 0,
  avgLatency: 0,
  networkUptime: 100,
  activeNodes: initialNodes.filter(n => n.status !== 'offline').length,
  totalNodes: initialNodes.length,
  throughput: 0,
  history: []
}

const initialChaos: ChaosConfig = {
  packetLoss: 5,
  latencySpike: 0,
  nodeFailureRate: 0,
  batteryDrain: 1,
  enabled: false
}

export const useSimulationStore = create<SimulationState>((set, get) => {
  // Build routing graph from initial nodes
  const buildRoutingGraph = (): Record<string, RouteNode> => {
    const graph: Record<string, RouteNode> = {}
    for (const node of initialNodes) {
      graph[node.id] = {
        id: node.id,
        neighbors: node.connections,
        latency: node.latency
      }
    }
    return graph
  }

  // Initialize session key store
  const sessionKeyStore = new SessionKeyStore()

  return {
    nodes: initialNodes,
    packets: [],
    events: [],
    metrics: initialMetrics,
    chaos: initialChaos,
    discoveredPeers: [],
    isScanning: false,
    scanRadius: 300,
    traffic: [],
    connections: [],
    pendingConnections: [],
    messages: [],
    nodeSecrets: null,
    sessionKeyStore,
    routingGraph: buildRoutingGraph(),
    isRunning: false,
    speed: 1,
    tickCount: 0,
    selectedNodeId: null,
    selectedConnectionId: null,
    activeEnvironment: 'discovery',

    // Initialize node secrets on first call
    initializeSecrets: () => set((state) => ({
      nodeSecrets: initializeNodeSecrets('local-node')
    })),

    performKeyExchange: (connectionId) => set((state) => {
      if (!state.nodeSecrets) return state

      const conn = state.connections.find(c => c.id === connectionId)
      if (!conn) return state

      // Generate shared secret using ECDH-like exchange
      const sharedSecret = generateSharedSecret(
        state.nodeSecrets.encryptionSecretKey,
        'peer-public-key' // In real scenario, use remote peer's public key
      )

      // Create session key
      const sessionKey = state.sessionKeyStore!.createSessionKey(connectionId, sharedSecret)

      return {
        connections: state.connections.map(c =>
          c.id === connectionId
            ? {
                ...c,
                sessionKeyId: sessionKey.keyId,
                sharedSecret,
                verificationStatus: 'verifying' as const
              }
            : c
        )
      }
    }),

  tick: () => {
    const state = get()
    if (!state.isRunning) return

    const { nodes, packets, chaos, metrics, connections, isScanning, scanRadius, discoveredPeers, messages, pendingConnections, traffic } = state
    const newPackets = [...packets]
    const newNodes = nodes.map(n => ({ ...n }))
    const newEvents: NetworkEvent[] = []
    const newConnections = connections.map(c => ({ ...c }))
    const newMessages = [...messages]
    const newTraffic = [...traffic]
    let newDiscoveredPeers = [...discoveredPeers]
    let packetsDelivered = 0
    let packetsDropped = 0
    let totalLatency = 0
    let latencyCount = 0

    const addTraffic = (
      stage: TrafficStage,
      packet: Packet,
      fromNodeId: string,
      toNodeId: string | null,
      currentNodeId: string,
      encrypted = Boolean(packet.encryptedPayload)
    ) => {
      newTraffic.push({
        id: generateId(),
        packetId: packet.id,
        timestamp: Date.now(),
        stage,
        packetType: packet.type,
        sourceId: packet.sourceId,
        fromNodeId,
        toNodeId,
        currentNodeId,
        route: packet.route ?? packet.path,
        connectionId: packet.connectionId,
        size: packet.size,
        encrypted
      })
    }

    const liveRoutingGraph: Record<string, RouteNode> = {}
    for (const node of newNodes) {
      liveRoutingGraph[node.id] = {
        id: node.id,
        neighbors: node.connections,
        latency: node.latency
      }
    }

    // Discovery scan simulation
    if (isScanning && Math.random() < 0.15) {
      const undiscovered = potentialPeers.filter(
        p => p.distance <= scanRadius && !newDiscoveredPeers.find(d => d.id === p.id)
      )
      if (undiscovered.length > 0) {
        const peer = undiscovered[Math.floor(Math.random() * undiscovered.length)]
        const now = Date.now()
        const discoveredPeer: DiscoveredPeer = {
          ...peer,
          signalStrength: peer.signalStrength + Math.floor((Math.random() - 0.5) * 10),
          discoveredAt: now,
          lastSeen: now
        }
        newDiscoveredPeers.push(discoveredPeer)
        newEvents.push({
          id: generateId(),
          timestamp: now,
          type: 'peer_discovered',
          message: `Discovered peer: ${peer.label} (${peer.type})`,
          severity: 'info',
        })
      }
    }

    // Update discovered peers signal strength (simulate movement/interference)
    newDiscoveredPeers = newDiscoveredPeers.map(peer => ({
      ...peer,
      signalStrength: Math.max(0, Math.min(100, peer.signalStrength + Math.floor((Math.random() - 0.5) * 5))),
      lastSeen: Date.now()
    })).filter(peer => peer.signalStrength > 10) // Remove peers with very weak signal

    // Process connection handshakes
    for (const conn of newConnections) {
      if (conn.status === 'handshaking') {
        conn.handshakeProgress += 8 + Math.random() * 12
        if (conn.handshakeProgress >= 100) {
          conn.handshakeProgress = 100
          conn.status = 'connected'
          conn.establishedAt = Date.now()
          newEvents.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'connection_established',
            message: `Connection established with ${conn.remotePeerLabel}`,
            severity: 'success',
            connectionId: conn.id
          })
        }
      }
      
      // Simulate data flow on connected connections
      if (conn.status === 'connected') {
        const dataIn = Math.floor(Math.random() * 500)
        const dataOut = Math.floor(Math.random() * 300)
        conn.bytesIn += dataIn
        conn.bytesOut += dataOut
        if (Math.random() < 0.3) conn.packetsIn++
        if (Math.random() < 0.2) conn.packetsOut++
        conn.latency = Math.max(5, Math.min(200, conn.latency + (Math.random() - 0.5) * 10))
      }
    }

    // Process pending messages
    for (let i = newMessages.length - 1; i >= 0; i--) {
      const msg = newMessages[i]
      if (msg.status === 'sending') {
        if (Math.random() < 0.4) {
          msg.status = 'sent'
        }
      } else if (msg.status === 'sent') {
        if (Math.random() < 0.3) {
          msg.status = 'delivered'
          const conn = newConnections.find(c => c.id === msg.connectionId)
          newEvents.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'message_sent',
            message: `Message delivered to ${conn?.remotePeerLabel || 'peer'}`,
            severity: 'success',
            connectionId: msg.connectionId
          })
        }
      }
    }

    // Simulate incoming messages on active connections
    for (const conn of newConnections) {
      if (conn.status === 'connected' && Math.random() < 0.05) {
        const incomingMsg: Message = {
          id: generateId(),
          connectionId: conn.id,
          direction: 'inbound',
          content: getRandomIncomingMessage(),
          timestamp: Date.now(),
          status: 'delivered',
          size: Math.floor(Math.random() * 500) + 50
        }
        newMessages.push(incomingMsg)
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'message_received',
          message: `Message received from ${conn.remotePeerLabel}`,
          severity: 'info',
          connectionId: conn.id
        })
      }
    }

    // Generate new packets from random endpoints
    if (Math.random() < 0.45) {
      const endpoints = newNodes.filter(n => n.type === 'endpoint' && n.status !== 'offline')
      const gateways = newNodes.filter(n => n.type === 'gateway' && n.status !== 'offline')
      
      if (endpoints.length > 0 && gateways.length > 0) {
        const source = endpoints[Math.floor(Math.random() * endpoints.length)]
        const target = gateways[Math.floor(Math.random() * gateways.length)]
        const route = findShortestPath(liveRoutingGraph, source.id, target.id)
        
        const newPacket: Packet = {
          id: generateId(),
          sourceId: source.id,
          targetId: target.id,
          currentNodeId: source.id,
          path: [source.id],
          progress: 0,
          type: Math.random() < 0.7 ? 'data' : Math.random() < 0.5 ? 'heartbeat' : 'discovery',
          size: Math.floor(Math.random() * 1000) + 100,
          ttl: 10,
          createdAt: Date.now(),
          route,
          routeQuality: route.length > 0 ? calculateRouteQuality(liveRoutingGraph, route) : undefined
        }
        
        newPackets.push(newPacket)
        const sourceNode = newNodes.find(n => n.id === source.id)
        if (sourceNode) sourceNode.packetsSent++
        addTraffic('sent', newPacket, source.id, route[1] ?? target.id, source.id)
        
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'packet_sent',
          message: `Packet sent from ${source.label} to ${target.label}${route.length > 0 ? ` via ${route.join(' → ')}` : ''}`,
          severity: 'info',
          nodeId: source.id,
          packetId: newPacket.id
        })
      }
    }

    // Process packets
    for (let i = newPackets.length - 1; i >= 0; i--) {
      const packet = newPackets[i]
      const currentNode = newNodes.find(n => n.id === packet.currentNodeId)
      
      if (!currentNode || currentNode.status === 'offline') {
        packetsDropped++
        newPackets.splice(i, 1)
        addTraffic('dropped', packet, packet.currentNodeId, null, packet.currentNodeId)
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'packet_dropped',
          message: `Packet dropped - node offline`,
          severity: 'error',
          packetId: packet.id
        })
        continue
      }

      if (chaos.enabled && Math.random() * 100 < chaos.packetLoss) {
        packetsDropped++
        currentNode.packetsDropped++
        newPackets.splice(i, 1)
        addTraffic('dropped', packet, packet.currentNodeId, null, packet.currentNodeId)
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'packet_dropped',
          message: `Packet lost due to network chaos`,
          severity: 'warning',
          nodeId: currentNode.id,
          packetId: packet.id
        })
        continue
      }

      packet.ttl--
      if (packet.ttl <= 0) {
        packetsDropped++
        newPackets.splice(i, 1)
        addTraffic('dropped', packet, currentNode.id, null, currentNode.id)
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'packet_dropped',
          message: `Packet TTL expired`,
          severity: 'warning',
          packetId: packet.id
        })
        continue
      }

      packet.progress += 0.15 * (1 + Math.random() * 0.1)
      
      if (packet.progress >= 1) {
        if (packet.currentNodeId === packet.targetId) {
          packetsDelivered++
          const targetNode = newNodes.find(n => n.id === packet.targetId)
          if (targetNode) targetNode.packetsReceived++
          addTraffic('received', packet, currentNode.id, packet.targetId, packet.targetId)
          
          totalLatency += Date.now() - packet.createdAt
          latencyCount++
          
          newPackets.splice(i, 1)
          newEvents.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'packet_delivered',
            message: `Packet delivered to ${targetNode?.label}`,
            severity: 'success',
            nodeId: packet.targetId,
            packetId: packet.id
          })
          } else {
            const nextHops = currentNode.connections.filter(
              id => !packet.path.includes(id) && newNodes.find(n => n.id === id)?.status !== 'offline'
            )

            if (nextHops.length > 0) {
              const targetNode = newNodes.find(n => n.id === packet.targetId)
              let bestHop = nextHops[0]
            let bestScore = -Infinity
            
            for (const hopId of nextHops) {
              const hopNode = newNodes.find(n => n.id === hopId)
              if (!hopNode) continue
              
              let score = hopNode.trust - hopNode.latency
              if (hopNode.connections.includes(packet.targetId)) score += 100
              if (hopNode.id === packet.targetId) score += 200
              if (hopNode.type === 'gateway' && targetNode?.type === 'gateway') score += 50
              
              if (score > bestScore) {
                bestScore = score
                bestHop = hopId
              }
            }
              
              packet.currentNodeId = bestHop
              packet.path.push(bestHop)
              packet.progress = 0
              currentNode.packetsTransmitted++
              addTraffic('transmitted', packet, currentNode.id, bestHop, bestHop)
            } else {
              packetsDropped++
              newPackets.splice(i, 1)
              addTraffic('dropped', packet, currentNode.id, null, currentNode.id)
              newEvents.push({
              id: generateId(),
              timestamp: Date.now(),
              type: 'packet_dropped',
              message: `No route available from ${currentNode.label}`,
              severity: 'error',
              nodeId: currentNode.id,
              packetId: packet.id
            })
          }
        }
      }
    }

    // Apply chaos effects
    if (chaos.enabled) {
      for (const node of newNodes) {
        if (node.battery > 0) {
          node.battery = Math.max(0, node.battery - (0.01 * chaos.batteryDrain * (Math.random() + 0.5)))
          
          if (node.battery < 20 && node.status === 'online') {
            node.status = 'degraded'
            newEvents.push({
              id: generateId(),
              timestamp: Date.now(),
              type: 'node_status_change',
              message: `${node.label} degraded - low battery`,
              severity: 'warning',
              nodeId: node.id
            })
          }
          
          if (node.battery <= 0 && node.status !== 'offline') {
            node.status = 'offline'
            newEvents.push({
              id: generateId(),
              timestamp: Date.now(),
              type: 'node_status_change',
              message: `${node.label} offline - battery depleted`,
              severity: 'error',
              nodeId: node.id
            })
          }
        }
        
        if (node.status === 'online' && Math.random() * 100 < chaos.nodeFailureRate * 0.1) {
          node.status = 'degraded'
          newEvents.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'chaos_event',
            message: `${node.label} experiencing issues`,
            severity: 'warning',
            nodeId: node.id
          })
        }
        
        if (chaos.latencySpike > 0) {
          node.latency = Math.min(200, node.latency + (Math.random() * chaos.latencySpike * 0.1))
        }
      }
    }

    const avgLat = latencyCount > 0 ? totalLatency / latencyCount : metrics.avgLatency
    const activeCount = newNodes.filter(n => n.status !== 'offline').length
    const newHistory = [...metrics.history, {
      timestamp: Date.now(),
      throughput: packetsDelivered,
      latency: avgLat,
      packetLoss: packetsDropped > 0 ? (packetsDropped / (packetsDelivered + packetsDropped)) * 100 : 0
    }].slice(-120)

    set({
      nodes: newNodes,
      packets: newPackets,
      events: [...state.events, ...newEvents].slice(-500),
      tickCount: state.tickCount + 1,
      discoveredPeers: newDiscoveredPeers,
      connections: newConnections,
      traffic: newTraffic.slice(-4000),
      pendingConnections: pendingConnections.filter(peerId =>
        !newConnections.some(conn => conn.remoteNodeId === peerId && conn.status === 'connected')
      ),
      messages: newMessages.slice(-1000),
      metrics: {
        totalPacketsSent: metrics.totalPacketsSent + (newEvents.filter(e => e.type === 'packet_sent').length),
        totalPacketsDelivered: metrics.totalPacketsDelivered + packetsDelivered,
        totalPacketsDropped: metrics.totalPacketsDropped + packetsDropped,
        avgLatency: avgLat,
        networkUptime: (activeCount / newNodes.length) * 100,
        activeNodes: activeCount,
        totalNodes: newNodes.length,
        throughput: packetsDelivered,
        history: newHistory
      }
    })
  },

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  
  reset: () => set({
    nodes: initialNodes.map(n => ({ ...n, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0 })),
    packets: [],
    events: [],
    metrics: initialMetrics,
    chaos: initialChaos,
    discoveredPeers: [],
    isScanning: false,
    scanRadius: 300,
    traffic: [],
    connections: [],
    pendingConnections: [],
    messages: [],
    isRunning: false,
    speed: 1,
    tickCount: 0,
    selectedNodeId: null,
    selectedConnectionId: null,
    activeEnvironment: 'discovery'
  }),
  
  setSpeed: (speed) => set({ speed }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  selectConnection: (connectionId) => set({ selectedConnectionId: connectionId }),
  setActiveEnvironment: (env) => set({ activeEnvironment: env }),
  
  setChaos: (config) => set((state) => ({
    chaos: { ...state.chaos, ...config }
  })),
  
  toggleChaos: () => set((state) => ({
    chaos: { ...state.chaos, enabled: !state.chaos.enabled }
  })),
  
  toggleNodeStatus: (nodeId) => set((state) => {
    const newNodes = state.nodes.map(n => {
      if (n.id === nodeId) {
        const newStatus = n.status === 'online' ? 'degraded' : n.status === 'degraded' ? 'offline' : 'online'
        return { ...n, status: newStatus }
      }
      return n
    })
    return { nodes: newNodes }
  }),
  
  killNode: (nodeId) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, status: 'offline' as NodeStatus } : n),
    events: [...state.events, {
      id: generateId(),
      timestamp: Date.now(),
      type: 'chaos_event' as const,
      message: `${state.nodes.find(n => n.id === nodeId)?.label} manually killed`,
      severity: 'error' as const,
      nodeId
    }]
  })),
  
  reviveNode: (nodeId) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, status: 'online' as NodeStatus, battery: 100 } : n),
    events: [...state.events, {
      id: generateId(),
      timestamp: Date.now(),
      type: 'node_status_change' as const,
      message: `${state.nodes.find(n => n.id === nodeId)?.label} revived`,
      severity: 'success' as const,
      nodeId
    }]
  })),

  // Discovery actions
  startScan: () => set({ isScanning: true }),
  stopScan: () => set({ isScanning: false }),
  setScanRadius: (radius) => set({ scanRadius: radius }),

  // Connection actions
  initiateConnection: (peerId) => set((state) => {
    const peer = state.discoveredPeers.find(p => p.id === peerId)
    if (!peer || !peer.isConnectable) return state
    if (
      state.pendingConnections.includes(peerId) ||
      state.connections.some(c => c.remoteNodeId === peerId && c.status !== 'terminated' && c.status !== 'failed')
    ) {
      return state
    }
    
    const newConnection: Connection = {
      id: generateId(),
      localNodeId: 'local',
      remoteNodeId: peerId,
      remotePeerLabel: peer.label,
      status: 'handshaking',
      establishedAt: null,
      terminatedAt: null,
      handshakeProgress: 0,
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      latency: Math.floor(Math.random() * 50) + 10,
      encryption: 'aes-256',
      protocol: 'mesh'
    }
    
    return {
      connections: [...state.connections, newConnection],
      pendingConnections: [...state.pendingConnections, peerId],
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'handshake_start' as const,
        message: `Initiating handshake with ${peer.label}`,
        severity: 'info' as const,
        connectionId: newConnection.id
      }]
    }
  }),

  acceptConnection: (connectionId) => set((state) => {
    const conn = state.connections.find(c => c.id === connectionId)
    if (!conn || conn.status !== 'pending') return state
    
    return {
      connections: state.connections.map(c => 
        c.id === connectionId ? { ...c, status: 'handshaking' as ConnectionStatus } : c
      ),
      pendingConnections: state.pendingConnections.filter(peerId => peerId !== conn.remoteNodeId),
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'connection_request' as const,
        message: `Accepted connection request from ${conn.remotePeerLabel}`,
        severity: 'info' as const,
        connectionId
      }]
    }
  }),

  rejectConnection: (connectionId) => set((state) => {
    const conn = state.connections.find(c => c.id === connectionId)
    if (!conn) return state
    
    return {
      connections: state.connections.filter(c => c.id !== connectionId),
      pendingConnections: state.pendingConnections.filter(peerId => peerId !== conn.remoteNodeId),
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'connection_terminated' as const,
        message: `Rejected connection from ${conn.remotePeerLabel}`,
        severity: 'warning' as const,
        connectionId
      }]
    }
  }),

  terminateConnection: (connectionId) => set((state) => {
    const conn = state.connections.find(c => c.id === connectionId)
    if (!conn) return state
    
    return {
      connections: state.connections.map(c => 
        c.id === connectionId ? { 
          ...c, 
          status: 'terminated' as ConnectionStatus, 
          terminatedAt: Date.now() 
        } : c
      ),
      pendingConnections: state.pendingConnections.filter(peerId => peerId !== conn.remoteNodeId),
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'connection_terminated' as const,
        message: `Connection terminated with ${conn.remotePeerLabel}`,
        severity: 'warning' as const,
        connectionId
      }]
    }
  }),

  // Messaging actions
  sendMessage: (connectionId, content) => set((state) => {
    const conn = state.connections.find(c => c.id === connectionId)
    if (!conn || conn.status !== 'connected' || content.trim().length === 0) return state
    
    let encrypted = false
    let encryptedContent: string | undefined
    let signature: string | undefined

    // Encrypt message if session key available
    if (conn.sharedSecret && state.nodeSecrets) {
      try {
        encryptedContent = encryptWithSharedSecret(content, conn.sharedSecret)
        encrypted = true
        // Sign the encrypted content
        signature = signMessage(encryptedContent, state.nodeSecrets.signingSecretKey)
      } catch (e) {
        // Fallback to unencrypted
      }
    }

    const newMessage: Message = {
      id: generateId(),
      connectionId,
      direction: 'outbound',
      content,
      timestamp: Date.now(),
      status: 'sending',
      size: new Blob([content]).size,
      encrypted,
      encryptedContent,
      signature,
      verified: true
    }
    
    return {
      messages: [...state.messages, newMessage],
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'message_sent' as const,
        message: `Sending ${encrypted ? 'encrypted ' : ''}message to ${conn.remotePeerLabel}`,
        severity: 'info' as const,
        connectionId
      }]
    }
  }),

  initiateConnection: (peerId) => set((state) => {
    const peer = state.discoveredPeers.find(p => p.id === peerId)
    if (!peer || !peer.isConnectable) return state
    if (
      state.pendingConnections.includes(peerId) ||
      state.connections.some(c => c.remoteNodeId === peerId && c.status !== 'terminated' && c.status !== 'failed')
    ) {
      return state
    }
    
    const newConnection: Connection = {
      id: generateId(),
      localNodeId: 'local',
      remoteNodeId: peerId,
      remotePeerLabel: peer.label,
      status: 'handshaking',
      establishedAt: null,
      terminatedAt: null,
      handshakeProgress: 0,
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      latency: Math.floor(Math.random() * 50) + 10,
      encryption: 'aes-256',
      protocol: 'mesh',
      verificationStatus: 'unverified',
      handshakeChallenge: Math.random().toString(36).substring(2, 34)
    }
    
    return {
      connections: [...state.connections, newConnection],
      pendingConnections: [...state.pendingConnections, peerId],
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'handshake_start' as const,
        message: `Initiating secure handshake with ${peer.label} (TLS + ECDH key exchange)`,
        severity: 'info' as const,
        connectionId: newConnection.id
      }]
    }
  }),

  acceptConnection: (connectionId) => set((state) => {
    const conn = state.connections.find(c => c.id === connectionId)
    if (!conn || conn.status !== 'pending') return state
    
    return {
      connections: state.connections.map(c => 
        c.id === connectionId ? { ...c, status: 'handshaking' as ConnectionStatus } : c
      ),
      pendingConnections: state.pendingConnections.filter(peerId => peerId !== conn.remoteNodeId),
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'connection_request' as const,
        message: `Accepted connection request from ${conn.remotePeerLabel}`,
        severity: 'info' as const,
        connectionId
      }]
    }
  }),

  rejectConnection: (connectionId) => set((state) => {
    const conn = state.connections.find(c => c.id === connectionId)
    if (!conn) return state
    
    return {
      connections: state.connections.filter(c => c.id !== connectionId),
      pendingConnections: state.pendingConnections.filter(peerId => peerId !== conn.remoteNodeId),
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'connection_terminated' as const,
        message: `Rejected connection from ${conn.remotePeerLabel}`,
        severity: 'warning' as const,
        connectionId
      }]
    }
  }),

  terminateConnection: (connectionId) => set((state) => {
    const conn = state.connections.find(c => c.id === connectionId)
    if (!conn) return state
    
    if (state.sessionKeyStore) {
      state.sessionKeyStore.revokeConnectionKeys(connectionId)
    }
    
    return {
      connections: state.connections.map(c => 
        c.id === connectionId ? { 
          ...c, 
          status: 'terminated' as ConnectionStatus, 
          terminatedAt: Date.now() 
        } : c
      ),
      pendingConnections: state.pendingConnections.filter(peerId => peerId !== conn.remoteNodeId),
      events: [...state.events, {
        id: generateId(),
        timestamp: Date.now(),
        type: 'connection_terminated' as const,
        message: `Connection terminated with ${conn.remotePeerLabel}`,
        severity: 'warning' as const,
        connectionId
      }]
    }
  }),

  tick: () => {
    const state = get()
    if (!state.isRunning) return

    const { nodes, packets, chaos, metrics, connections, isScanning, scanRadius, discoveredPeers, messages, pendingConnections } = state
    const newPackets = [...packets]
    const newNodes = nodes.map(n => ({ ...n }))
    const newEvents: NetworkEvent[] = []
    const newConnections = connections.map(c => ({ ...c }))
    const newMessages = [...messages]
    let newDiscoveredPeers = [...discoveredPeers]
    let packetsDelivered = 0
    let packetsDropped = 0
    let totalLatency = 0
    let latencyCount = 0

    // Discovery scan simulation
    if (isScanning && Math.random() < 0.15) {
      const undiscovered = potentialPeers.filter(
        p => p.distance <= scanRadius && !newDiscoveredPeers.find(d => d.id === p.id)
      )
      if (undiscovered.length > 0) {
        const peer = undiscovered[Math.floor(Math.random() * undiscovered.length)]
        const now = Date.now()
        const discoveredPeer: DiscoveredPeer = {
          ...peer,
          signalStrength: peer.signalStrength + Math.floor((Math.random() - 0.5) * 10),
          discoveredAt: now,
          lastSeen: now
        }
        newDiscoveredPeers.push(discoveredPeer)
        newEvents.push({
          id: generateId(),
          timestamp: now,
          type: 'peer_discovered',
          message: `Discovered peer: ${peer.label} (${peer.type})`,
          severity: 'info',
        })
      }
    }

    // Update discovered peers signal strength (simulate movement/interference)
    newDiscoveredPeers = newDiscoveredPeers.map(peer => ({
      ...peer,
      signalStrength: Math.max(0, Math.min(100, peer.signalStrength + Math.floor((Math.random() - 0.5) * 5))),
      lastSeen: Date.now()
    })).filter(peer => peer.signalStrength > 10)

    // Process connection handshakes
    for (const conn of newConnections) {
      if (conn.status === 'handshaking') {
        conn.handshakeProgress += 8 + Math.random() * 12
        if (conn.handshakeProgress >= 100) {
          conn.handshakeProgress = 100
          conn.status = 'connected'
          conn.establishedAt = Date.now()
          conn.verificationStatus = 'verified'
          newEvents.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'connection_established',
            message: `Secure connection established (Encrypted: ${conn.encryption}, Verified: ${conn.verificationStatus === 'verified'})`,
            severity: 'success',
            connectionId: conn.id
          })
        }
      }
      
      // Simulate data flow on connected connections
      if (conn.status === 'connected') {
        const dataIn = Math.floor(Math.random() * 500)
        const dataOut = Math.floor(Math.random() * 300)
        conn.bytesIn += dataIn
        conn.bytesOut += dataOut
        if (Math.random() < 0.3) conn.packetsIn++
        if (Math.random() < 0.2) conn.packetsOut++
        conn.latency = Math.max(5, Math.min(200, conn.latency + (Math.random() - 0.5) * 10))
      }
    }

    // Process pending messages
    for (let i = newMessages.length - 1; i >= 0; i--) {
      const msg = newMessages[i]
      if (msg.status === 'sending') {
        if (Math.random() < 0.4) {
          msg.status = 'sent'
        }
      } else if (msg.status === 'sent') {
        if (Math.random() < 0.3) {
          msg.status = 'delivered'
          const conn = newConnections.find(c => c.id === msg.connectionId)
          newEvents.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'message_sent',
            message: `${msg.encrypted ? 'Encrypted m' : 'M'}essage delivered to ${conn?.remotePeerLabel || 'peer'}`,
            severity: 'success',
            connectionId: msg.connectionId
          })
        }
      }
    }

    // Simulate incoming messages on active connections
    for (const conn of newConnections) {
      if (conn.status === 'connected' && Math.random() < 0.05) {
        const incomingMsg: Message = {
          id: generateId(),
          connectionId: conn.id,
          direction: 'inbound',
          content: getRandomIncomingMessage(),
          timestamp: Date.now(),
          status: 'delivered',
          size: Math.floor(Math.random() * 500) + 50,
          encrypted: Math.random() < 0.8,
          verified: true
        }
        newMessages.push(incomingMsg)
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'message_received',
          message: `${incomingMsg.encrypted ? 'Encrypted m' : 'M'}essage received from ${conn.remotePeerLabel}`,
          severity: 'info',
          connectionId: conn.id
        })
      }
    }

    // Generate new packets from random endpoints (increase frequency for better visibility)
    if (Math.random() < 0.5) {
      const endpoints = newNodes.filter(n => n.type === 'endpoint' && n.status !== 'offline')
      const gateways = newNodes.filter(n => n.type === 'gateway' && n.status !== 'offline')
      
      if (endpoints.length > 0 && gateways.length > 0) {
        const source = endpoints[Math.floor(Math.random() * endpoints.length)]
        const target = gateways[Math.floor(Math.random() * gateways.length)]
        
        // Use Dijkstra's algorithm to find optimal route
        const dijkstraRoute = findShortestPath(liveRoutingGraph, source.id, target.id)
        
        const newPacket: Packet = {
          id: generateId(),
          sourceId: source.id,
          targetId: target.id,
          currentNodeId: source.id,
          path: dijkstraRoute.length > 0 ? dijkstraRoute : [source.id],
          progress: 0,
          type: Math.random() < 0.7 ? 'data' : Math.random() < 0.5 ? 'heartbeat' : 'discovery',
          size: Math.floor(Math.random() * 1000) + 100,
          ttl: 10,
          createdAt: Date.now(),
          route: dijkstraRoute,
          routeQuality: dijkstraRoute.length > 0 ? calculateRouteQuality(liveRoutingGraph, dijkstraRoute) : 0
        }
        
        newPackets.push(newPacket)
        const sourceNode = newNodes.find(n => n.id === source.id)
        if (sourceNode) sourceNode.packetsSent++
        
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'packet_sent',
          message: `Packet sent from ${source.label} to ${target.label} (Route: ${newPacket.route?.join(' → ') || 'direct'})`,
          severity: 'info',
          nodeId: source.id,
          packetId: newPacket.id
        })
      }
    }

    // Process packets with improved routing
    for (let i = newPackets.length - 1; i >= 0; i--) {
      const packet = newPackets[i]
      const currentNode = newNodes.find(n => n.id === packet.currentNodeId)
      
      if (!currentNode || currentNode.status === 'offline') {
        packetsDropped++
        newPackets.splice(i, 1)
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'packet_dropped',
          message: `Packet dropped - node offline`,
          severity: 'error',
          packetId: packet.id
        })
        continue
      }

      if (chaos.enabled && Math.random() * 100 < chaos.packetLoss) {
        packetsDropped++
        currentNode.packetsDropped++
        newPackets.splice(i, 1)
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'packet_dropped',
          message: `Packet lost due to network chaos`,
          severity: 'warning',
          nodeId: currentNode.id,
          packetId: packet.id
        })
        continue
      }

      packet.ttl--
      if (packet.ttl <= 0) {
        packetsDropped++
        newPackets.splice(i, 1)
        newEvents.push({
          id: generateId(),
          timestamp: Date.now(),
          type: 'packet_dropped',
          message: `Packet TTL expired`,
          severity: 'warning',
          packetId: packet.id
        })
        continue
      }

      packet.progress += 0.15 * (1 + Math.random() * 0.1)
      
      if (packet.progress >= 1) {
        if (packet.currentNodeId === packet.targetId) {
          packetsDelivered++
          const targetNode = newNodes.find(n => n.id === packet.targetId)
          if (targetNode) targetNode.packetsReceived++
          
          totalLatency += Date.now() - packet.createdAt
          latencyCount++
          
          newPackets.splice(i, 1)
          newEvents.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'packet_delivered',
            message: `Packet delivered to ${targetNode?.label}`,
            severity: 'success',
            nodeId: packet.targetId,
            packetId: packet.id
          })
        } else {
          // Use route if available, otherwise find next hop
          let nextHop: string | undefined
          
          if (packet.route && packet.route.length > 1) {
            const currentIdx = packet.route.indexOf(packet.currentNodeId)
            if (currentIdx >= 0 && currentIdx < packet.route.length - 1) {
              nextHop = packet.route[currentIdx + 1]
            }
          }
          
          if (!nextHop) {
            const nextHops = currentNode.connections.filter(
              id => !packet.path.includes(id) && newNodes.find(n => n.id === id)?.status !== 'offline'
            )
            
            if (nextHops.length > 0) {
              nextHop = nextHops[0]
            }
          }
          
          if (nextHop) {
            packet.currentNodeId = nextHop
            packet.path.push(nextHop)
            packet.progress = 0
          } else {
            packetsDropped++
            newPackets.splice(i, 1)
            newEvents.push({
              id: generateId(),
              timestamp: Date.now(),
              type: 'packet_dropped',
              message: `No route available from ${currentNode.label}`,
              severity: 'error',
              nodeId: currentNode.id,
              packetId: packet.id
            })
          }
        }
      }
    }

    // Apply chaos effects
    if (chaos.enabled) {
      for (const node of newNodes) {
        if (node.battery > 0) {
          node.battery = Math.max(0, node.battery - (0.01 * chaos.batteryDrain * (Math.random() + 0.5)))
          
          if (node.battery < 20 && node.status === 'online') {
            node.status = 'degraded'
            newEvents.push({
              id: generateId(),
              timestamp: Date.now(),
              type: 'node_status_change',
              message: `${node.label} degraded - low battery`,
              severity: 'warning',
              nodeId: node.id
            })
          }
          
          if (node.battery <= 0 && node.status !== 'offline') {
            node.status = 'offline'
            newEvents.push({
              id: generateId(),
              timestamp: Date.now(),
              type: 'node_status_change',
              message: `${node.label} offline - battery depleted`,
              severity: 'error',
              nodeId: node.id
            })
          }
        }
        
        if (node.status === 'online' && Math.random() * 100 < chaos.nodeFailureRate * 0.1) {
          node.status = 'degraded'
          newEvents.push({
            id: generateId(),
            timestamp: Date.now(),
            type: 'chaos_event',
            message: `${node.label} experiencing issues`,
            severity: 'warning',
            nodeId: node.id
          })
        }
        
        if (chaos.latencySpike > 0) {
          node.latency = Math.min(200, node.latency + (Math.random() * chaos.latencySpike * 0.1))
        }
      }
    }

    const avgLat = latencyCount > 0 ? totalLatency / latencyCount : metrics.avgLatency
    const activeCount = newNodes.filter(n => n.status !== 'offline').length
    const newHistory = [...metrics.history, {
      timestamp: Date.now(),
      throughput: packetsDelivered,
      latency: avgLat,
      packetLoss: packetsDropped > 0 ? (packetsDropped / (packetsDelivered + packetsDropped)) * 100 : 0
    }].slice(-120)

    set({
      nodes: newNodes,
      packets: newPackets.slice(-2000),
      events: [...state.events, ...newEvents].slice(-1000),
      tickCount: state.tickCount + 1,
      discoveredPeers: newDiscoveredPeers,
      connections: newConnections,
      pendingConnections: pendingConnections.filter(peerId =>
        !newConnections.some(conn => conn.remoteNodeId === peerId && conn.status === 'connected')
      ),
      messages: newMessages.slice(-1000),
      metrics: {
        totalPacketsSent: metrics.totalPacketsSent + (newEvents.filter(e => e.type === 'packet_sent').length),
        totalPacketsDelivered: metrics.totalPacketsDelivered + packetsDelivered,
        totalPacketsDropped: metrics.totalPacketsDropped + packetsDropped,
        avgLatency: avgLat,
        networkUptime: (activeCount / newNodes.length) * 100,
        activeNodes: activeCount,
        totalNodes: newNodes.length,
        throughput: packetsDelivered,
        history: newHistory
      }
    })
  },

  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  
  reset: () => set((state) => {
    if (state.sessionKeyStore) {
      for (const key of state.sessionKeyStore.getAllKeys()) {
        state.sessionKeyStore.revokeSessionKey(key.keyId)
      }
    }
    return {
      nodes: initialNodes.map(n => ({ ...n, packetsSent: 0, packetsReceived: 0, packetsTransmitted: 0, packetsDropped: 0 })),
      packets: [],
      events: [],
      metrics: initialMetrics,
      chaos: initialChaos,
      discoveredPeers: [],
      isScanning: false,
      scanRadius: 300,
      connections: [],
      pendingConnections: [],
      messages: [],
      isRunning: false,
      speed: 1,
      tickCount: 0,
      selectedNodeId: null,
      selectedConnectionId: null,
      activeEnvironment: 'discovery'
    }
  }),
  
  setSpeed: (speed) => set({ speed }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  selectConnection: (connectionId) => set({ selectedConnectionId: connectionId }),
  setActiveEnvironment: (env) => set({ activeEnvironment: env }),
  
  setChaos: (config) => set((state) => ({
    chaos: { ...state.chaos, ...config }
  })),
  
  toggleChaos: () => set((state) => ({
    chaos: { ...state.chaos, enabled: !state.chaos.enabled }
  })),
  
  toggleNodeStatus: (nodeId) => set((state) => {
    const newNodes = state.nodes.map(n => {
      if (n.id === nodeId) {
        const newStatus = n.status === 'online' ? 'degraded' : n.status === 'degraded' ? 'offline' : 'online'
        return { ...n, status: newStatus }
      }
      return n
    })
    return { nodes: newNodes }
  }),
  
  killNode: (nodeId) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, status: 'offline' as NodeStatus } : n),
    events: [...state.events, {
      id: generateId(),
      timestamp: Date.now(),
      type: 'chaos_event' as const,
      message: `${state.nodes.find(n => n.id === nodeId)?.label} manually killed`,
      severity: 'error' as const,
      nodeId
    }]
  })),
  
  reviveNode: (nodeId) => set((state) => ({
    nodes: state.nodes.map(n => n.id === nodeId ? { ...n, status: 'online' as NodeStatus, battery: 100 } : n),
    events: [...state.events, {
      id: generateId(),
      timestamp: Date.now(),
      type: 'node_status_change' as const,
      message: `${state.nodes.find(n => n.id === nodeId)?.label} revived`,
      severity: 'success' as const,
      nodeId
    }]
  })),

  startScan: () => set({ isScanning: true }),
  stopScan: () => set({ isScanning: false }),
  setScanRadius: (radius) => set({ scanRadius: radius }),
  }
})
