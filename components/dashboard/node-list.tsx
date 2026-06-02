'use client'

import { useSimulationStore } from '@/lib/simulation-store'
import { cn } from '@/lib/utils'

export function NodeList() {
  const { nodes, selectedNodeId, selectNode } = useSimulationStore()
  
  const sortedNodes = [...nodes].sort((a, b) => {
    // Sort by type (gateway > relay > endpoint), then by status, then by name
    const typeOrder = { gateway: 0, relay: 1, endpoint: 2 }
    const statusOrder = { online: 0, degraded: 1, offline: 2 }
    
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type]
    }
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }
    return a.label.localeCompare(b.label)
  })
  
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        All Nodes
      </h3>
      
      <div className="space-y-1">
        {sortedNodes.map((node) => (
          <button
            key={node.id}
            onClick={() => selectNode(node.id === selectedNodeId ? null : node.id)}
            className={cn(
              'w-full flex items-center gap-2 p-2 rounded text-left transition-colors',
              'hover:bg-secondary/50',
              selectedNodeId === node.id && 'bg-secondary ring-1 ring-primary'
            )}
          >
            {/* Status indicator */}
            <div className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              node.status === 'online' && 'bg-ember-green',
              node.status === 'degraded' && 'bg-ember-amber animate-pulse',
              node.status === 'offline' && 'bg-ember-red/50'
            )} />
            
            {/* Node info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-xs font-medium truncate',
                  node.status === 'offline' && 'text-muted-foreground'
                )}>
                  {node.label}
                </span>
                <span className={cn(
                  'text-[10px] font-mono',
                  node.latency < 50 && 'text-ember-green',
                  node.latency >= 50 && node.latency < 100 && 'text-ember-amber',
                  node.latency >= 100 && 'text-ember-red'
                )}>
                  {node.latency}ms
                </span>
              </div>
              
              {/* Battery and trust mini-bars */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full rounded-full',
                      node.battery > 50 && 'bg-ember-green',
                      node.battery > 20 && node.battery <= 50 && 'bg-ember-amber',
                      node.battery <= 20 && 'bg-ember-red'
                    )}
                    style={{ width: `${node.battery}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground w-8">
                  {node.battery.toFixed(0)}%
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
