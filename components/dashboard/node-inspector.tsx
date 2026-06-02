'use client'

import { useSimulationStore } from '@/lib/simulation-store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function NodeInspector() {
  const { nodes, selectedNodeId, selectNode, killNode, reviveNode } = useSimulationStore()
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId)
  
  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-muted flex items-center justify-center mb-3">
          <span className="text-2xl opacity-50">◇</span>
        </div>
        <p className="text-xs text-center">
          Select a node to inspect
        </p>
      </div>
    )
  }
  
  const statusColors = {
    online: 'text-ember-green',
    degraded: 'text-ember-amber',
    offline: 'text-ember-red'
  }
  
  const typeLabels = {
    gateway: 'Gateway Node',
    relay: 'Relay Node',
    endpoint: 'Endpoint Device'
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">{selectedNode.label}</h3>
          <p className="text-xs text-muted-foreground">{typeLabels[selectedNode.type]}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => selectNode(null)}
        >
          ×
        </Button>
      </div>
      
      {/* Status */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          selectedNode.status === 'online' && 'bg-ember-green',
          selectedNode.status === 'degraded' && 'bg-ember-amber animate-pulse',
          selectedNode.status === 'offline' && 'bg-ember-red'
        )} />
        <span className={cn('text-xs font-bold uppercase', statusColors[selectedNode.status])}>
          {selectedNode.status}
        </span>
      </div>
      
      {/* Metrics */}
      <div className="space-y-3">
        {/* Battery */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Battery</span>
            <span className={cn(
              'text-xs font-mono',
              selectedNode.battery > 50 && 'text-ember-green',
              selectedNode.battery > 20 && selectedNode.battery <= 50 && 'text-ember-amber',
              selectedNode.battery <= 20 && 'text-ember-red'
            )}>
              {selectedNode.battery.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={selectedNode.battery} 
            className={cn(
              'h-1.5',
              selectedNode.battery > 50 && '[&>div]:bg-ember-green',
              selectedNode.battery > 20 && selectedNode.battery <= 50 && '[&>div]:bg-ember-amber',
              selectedNode.battery <= 20 && '[&>div]:bg-ember-red'
            )}
          />
        </div>
        
        {/* Trust Score */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Trust Score</span>
            <span className={cn(
              'text-xs font-mono',
              selectedNode.trust >= 90 && 'text-ember-green',
              selectedNode.trust >= 70 && selectedNode.trust < 90 && 'text-ember-amber',
              selectedNode.trust < 70 && 'text-ember-red'
            )}>
              {selectedNode.trust.toFixed(1)}
            </span>
          </div>
          <Progress 
            value={selectedNode.trust} 
            className={cn(
              'h-1.5',
              selectedNode.trust >= 90 && '[&>div]:bg-ember-green',
              selectedNode.trust >= 70 && selectedNode.trust < 90 && '[&>div]:bg-ember-amber',
              selectedNode.trust < 70 && '[&>div]:bg-ember-red'
            )}
          />
        </div>
        
        {/* Latency */}
        <div className="flex items-center justify-between py-1 border-t border-border">
          <span className="text-xs text-muted-foreground">Latency</span>
          <span className={cn(
            'text-xs font-mono',
            selectedNode.latency < 50 && 'text-ember-green',
            selectedNode.latency >= 50 && selectedNode.latency < 100 && 'text-ember-amber',
            selectedNode.latency >= 100 && 'text-ember-red'
          )}>
            {selectedNode.latency.toFixed(0)}ms
          </span>
        </div>
      </div>
      
      {/* Packet stats */}
      <div className="space-y-2 pt-2 border-t border-border">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Packet Statistics
        </h4>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="text-lg font-bold text-ember-cyan">{selectedNode.packetsSent}</div>
            <div className="text-[10px] text-muted-foreground">Sent</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="text-lg font-bold text-ember-green">{selectedNode.packetsReceived}</div>
            <div className="text-[10px] text-muted-foreground">Received</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="text-lg font-bold text-violet-400">{selectedNode.packetsTransmitted}</div>
            <div className="text-[10px] text-muted-foreground">Relayed</div>
          </div>
          <div className="text-center p-2 bg-secondary/50 rounded">
            <div className="text-lg font-bold text-ember-red">{selectedNode.packetsDropped}</div>
            <div className="text-[10px] text-muted-foreground">Dropped</div>
          </div>
        </div>
      </div>
      
      {/* Connections */}
      <div className="space-y-2 pt-2 border-t border-border">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Connections ({selectedNode.connections.length})
        </h4>
        <div className="flex flex-wrap gap-1">
          {selectedNode.connections.map(connId => {
            const connNode = nodes.find(n => n.id === connId)
            return (
              <button
                key={connId}
                onClick={() => selectNode(connId)}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded border transition-colors',
                  connNode?.status === 'online' && 'border-ember-green/50 text-ember-green hover:bg-ember-green/10',
                  connNode?.status === 'degraded' && 'border-ember-amber/50 text-ember-amber hover:bg-ember-amber/10',
                  connNode?.status === 'offline' && 'border-ember-red/50 text-ember-red hover:bg-ember-red/10'
                )}
              >
                {connNode?.label || connId}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-border">
        {selectedNode.status === 'offline' ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-ember-green border-ember-green/50 hover:bg-ember-green/10"
            onClick={() => reviveNode(selectedNode.id)}
          >
            REVIVE
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-ember-red border-ember-red/50 hover:bg-ember-red/10"
            onClick={() => killNode(selectedNode.id)}
          >
            KILL NODE
          </Button>
        )}
      </div>
    </div>
  )
}
