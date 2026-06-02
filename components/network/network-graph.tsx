'use client'

import { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSimulationStore, type NetworkNode } from '@/lib/simulation-store'
import { NetworkNodeMemo } from './network-node'

const nodeTypes = {
  networkNode: NetworkNodeMemo,
}

interface NetworkNodeData extends Record<string, unknown> {
  node: NetworkNode
  isSelected: boolean
  onClick: () => void
}

export function NetworkGraph() {
  const { 
    nodes: networkNodes, 
    packets, 
    selectedNodeId, 
    selectNode 
  } = useSimulationStore()
  
  // Convert network nodes to React Flow nodes
  const initialNodes = useMemo(() => {
    return networkNodes.map((node): Node<NetworkNodeData> => ({
      id: node.id,
      type: 'networkNode',
      position: node.position,
      data: {
        node,
        isSelected: node.id === selectedNodeId,
        onClick: () => selectNode(node.id === selectedNodeId ? null : node.id),
      },
    }))
  }, [networkNodes, selectedNodeId, selectNode])
  
  // Convert connections to React Flow edges
  const initialEdges = useMemo(() => {
    const edges: Edge[] = []
    const addedPairs = new Set<string>()
    
    networkNodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const pairKey = [node.id, targetId].sort().join('-')
        if (!addedPairs.has(pairKey)) {
          addedPairs.add(pairKey)
          
          // Check if there's a packet on this edge
          const hasPacket = packets.some(
            p => (p.currentNodeId === node.id && p.path[p.path.length - 1] === node.id) ||
                 (p.path.includes(node.id) && p.path.includes(targetId))
          )
          
          const sourceNode = networkNodes.find(n => n.id === node.id)
          const targetNode = networkNodes.find(n => n.id === targetId)
          
          const isActive = sourceNode?.status !== 'offline' && targetNode?.status !== 'offline'
          
          edges.push({
            id: `${node.id}-${targetId}`,
            source: node.id,
            target: targetId,
            type: 'default',
            animated: hasPacket && isActive,
            style: {
              stroke: hasPacket && isActive 
                ? 'oklch(0.75 0.18 195)' 
                : isActive 
                  ? 'oklch(0.35 0.02 250)' 
                  : 'oklch(0.25 0.02 250)',
              strokeWidth: hasPacket ? 3 : 1.5,
              opacity: isActive ? 1 : 0.3,
            },
          })
        }
      })
    })
    
    return edges
  }, [networkNodes, packets])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when network state changes
  useEffect(() => {
    setNodes(networkNodes.map((node): Node<NetworkNodeData> => ({
      id: node.id,
      type: 'networkNode',
      position: node.position,
      data: {
        node,
        isSelected: node.id === selectedNodeId,
        onClick: () => selectNode(node.id === selectedNodeId ? null : node.id),
      },
    })))
  }, [networkNodes, selectedNodeId, selectNode, setNodes])

  // Update edges when connections or packets change
  useEffect(() => {
    const newEdges: Edge[] = []
    const addedPairs = new Set<string>()
    
    networkNodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const pairKey = [node.id, targetId].sort().join('-')
        if (!addedPairs.has(pairKey)) {
          addedPairs.add(pairKey)
          
          const hasPacket = packets.some(
            p => (p.currentNodeId === node.id && p.path[p.path.length - 1] === node.id) ||
                 (p.path.includes(node.id) && p.path.includes(targetId))
          )
          
          const sourceNode = networkNodes.find(n => n.id === node.id)
          const targetNode = networkNodes.find(n => n.id === targetId)
          const isActive = sourceNode?.status !== 'offline' && targetNode?.status !== 'offline'
          
          newEdges.push({
            id: `${node.id}-${targetId}`,
            source: node.id,
            target: targetId,
            type: 'default',
            animated: hasPacket && isActive,
            style: {
              stroke: hasPacket && isActive 
                ? 'oklch(0.75 0.18 195)' 
                : isActive 
                  ? 'oklch(0.35 0.02 250)' 
                  : 'oklch(0.25 0.02 250)',
              strokeWidth: hasPacket ? 3 : 1.5,
              opacity: isActive ? 1 : 0.3,
            },
          })
        }
      })
    })
    
    setEdges(newEdges)
  }, [networkNodes, packets, setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectNode(node.id === selectedNodeId ? null : node.id)
  }, [selectNode, selectedNodeId])

  return (
    <div className="w-full h-full bg-background rounded-lg overflow-hidden border border-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes as any}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        className="bg-background"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="oklch(0.25 0.02 250)"
        />
        <Controls 
          className="!bg-card !border-border !rounded-lg overflow-hidden [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-secondary"
        />
        <MiniMap
          className="!bg-card !border-border !rounded-lg"
          nodeColor={(node) => {
            const data = node.data as NetworkNodeData
            if (!data?.node) return 'oklch(0.35 0.02 250)'
            switch (data.node.status) {
              case 'online': return 'oklch(0.72 0.19 145)'
              case 'degraded': return 'oklch(0.78 0.16 85)'
              case 'offline': return 'oklch(0.65 0.22 25)'
              default: return 'oklch(0.35 0.02 250)'
            }
          }}
          maskColor="oklch(0.13 0.01 250 / 0.8)"
        />
      </ReactFlow>
    </div>
  )
}
