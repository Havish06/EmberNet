'use client'

import { useSimulationStore } from '@/lib/simulation-store'
import { cn } from '@/lib/utils'

export function StatusBar() {
  const { metrics, chaos, isRunning, tickCount } = useSimulationStore()
  
  return (
    <header className="h-12 border-b border-border bg-card/50 backdrop-blur-sm px-4 flex items-center justify-between">
      {/* Logo and title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isRunning ? 'bg-ember-green animate-pulse' : 'bg-muted-foreground'
          )} />
          <span className="text-sm font-bold tracking-wider text-ember-cyan">
            EMBERNET
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Network Operations Center
        </span>
      </div>
      
      {/* Status indicators */}
      <div className="flex items-center gap-6">
        {/* Network health */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">UPTIME</span>
          <span className={cn(
            'text-sm font-mono font-bold',
            metrics.networkUptime >= 90 && 'text-ember-green',
            metrics.networkUptime >= 70 && metrics.networkUptime < 90 && 'text-ember-amber',
            metrics.networkUptime < 70 && 'text-ember-red'
          )}>
            {metrics.networkUptime.toFixed(1)}%
          </span>
        </div>
        
        {/* Active nodes */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">NODES</span>
          <span className="text-sm font-mono font-bold text-foreground">
            {metrics.activeNodes}/{metrics.totalNodes}
          </span>
        </div>
        
        {/* Throughput */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">PKT/s</span>
          <span className="text-sm font-mono font-bold text-ember-cyan">
            {metrics.throughput}
          </span>
        </div>
        
        {/* Latency */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">LAT</span>
          <span className={cn(
            'text-sm font-mono font-bold',
            metrics.avgLatency < 50 && 'text-ember-green',
            metrics.avgLatency >= 50 && metrics.avgLatency < 100 && 'text-ember-amber',
            metrics.avgLatency >= 100 && 'text-ember-red'
          )}>
            {metrics.avgLatency.toFixed(0)}ms
          </span>
        </div>
        
        {/* Chaos indicator */}
        {chaos.enabled && (
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-ember-red/20 border border-ember-red/50">
            <div className="w-1.5 h-1.5 rounded-full bg-ember-red animate-pulse" />
            <span className="text-xs font-bold text-ember-red">CHAOS</span>
          </div>
        )}
        
        {/* Tick counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">TICK</span>
          <span className="text-sm font-mono text-muted-foreground">
            {tickCount.toString().padStart(6, '0')}
          </span>
        </div>
      </div>
    </header>
  )
}
