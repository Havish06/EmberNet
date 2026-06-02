/**
 * useNetworkSocket Hook
 * Manages Socket.IO connection and real-time topology updates
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface NetworkTopology {
  totalNodes: number
  onlineNodes: number
  topology: Record<string, string[]>
  lastUpdate: number
}

export function useNetworkSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [topology, setTopology] = useState<NetworkTopology | null>(null)
  const [selectedNodeConnections, setSelectedNodeConnections] = useState<any[]>([])

  useEffect(() => {
    // Initialize Socket.IO connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socketUrl = `${protocol}//${window.location.host}`

    socketRef.current = io(socketUrl, {
      path: '/api/socketio',
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 5,
      transports: ['websocket']
    })

    socketRef.current.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
      socketRef.current?.emit('subscribe:topology')
    })

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socketRef.current.on('topology:initial', (data: NetworkTopology) => {
      console.log('Received initial topology:', data)
      setTopology(data)
    })

    socketRef.current.on('topology:update', (data: NetworkTopology) => {
      console.log('Topology updated:', data)
      setTopology(data)
    })

    socketRef.current.on('node:connections', (connections: any[]) => {
      console.log('Node connections:', connections)
      setSelectedNodeConnections(connections)
    })

    socketRef.current.on('connection:update', (event: any) => {
      console.log('Connection update:', event)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const selectNode = useCallback((nodeId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('select:node', nodeId)
    }
  }, [])

  const unsubscribe = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:topology')
    }
  }, [])

  return {
    isConnected,
    topology,
    selectedNodeConnections,
    selectNode,
    unsubscribe,
    socket: socketRef.current
  }
}
