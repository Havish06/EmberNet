'use client'

import { useSimulationStore } from '@/lib/simulation-store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function SimulationControls() {
  const { 
    isRunning, 
    speed, 
    start, 
    pause, 
    reset, 
    setSpeed,
    chaos,
    setChaos,
    toggleChaos
  } = useSimulationStore()
  
  return (
    <div className="space-y-4">
      {/* Playback controls */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Simulation
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isRunning ? 'secondary' : 'default'}
            size="sm"
            className="flex-1"
            onClick={isRunning ? pause : start}
          >
            {isRunning ? 'PAUSE' : 'START'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
          >
            RESET
          </Button>
        </div>
        
        {/* Speed control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Speed</span>
            <span className="text-xs font-mono text-foreground">{speed}x</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 4].map((s) => (
              <Button
                key={s}
                variant={speed === s ? 'default' : 'outline'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setSpeed(s)}
              >
                {s}x
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chaos controls */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Chaos Engineering
          </h3>
          <Switch
            checked={chaos.enabled}
            onCheckedChange={toggleChaos}
            className={cn(
              chaos.enabled && 'data-[state=checked]:bg-ember-red'
            )}
          />
        </div>
        
        <div className={cn(
          'space-y-4 transition-opacity',
          !chaos.enabled && 'opacity-50 pointer-events-none'
        )}>
          {/* Packet Loss */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Packet Loss</Label>
              <span className="text-xs font-mono text-ember-red">{chaos.packetLoss}%</span>
            </div>
            <Slider
              value={[chaos.packetLoss]}
              min={0}
              max={50}
              step={1}
              onValueChange={([v]) => setChaos({ packetLoss: v })}
              className="[&_[role=slider]]:bg-ember-red"
            />
          </div>
          
          {/* Latency Spike */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Latency Spike</Label>
              <span className="text-xs font-mono text-ember-amber">{chaos.latencySpike}ms</span>
            </div>
            <Slider
              value={[chaos.latencySpike]}
              min={0}
              max={200}
              step={5}
              onValueChange={([v]) => setChaos({ latencySpike: v })}
              className="[&_[role=slider]]:bg-ember-amber"
            />
          </div>
          
          {/* Node Failure Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Node Failure</Label>
              <span className="text-xs font-mono text-ember-red">{chaos.nodeFailureRate}%</span>
            </div>
            <Slider
              value={[chaos.nodeFailureRate]}
              min={0}
              max={30}
              step={1}
              onValueChange={([v]) => setChaos({ nodeFailureRate: v })}
              className="[&_[role=slider]]:bg-ember-red"
            />
          </div>
          
          {/* Battery Drain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Battery Drain</Label>
              <span className="text-xs font-mono text-ember-amber">{chaos.batteryDrain}x</span>
            </div>
            <Slider
              value={[chaos.batteryDrain]}
              min={1}
              max={10}
              step={0.5}
              onValueChange={([v]) => setChaos({ batteryDrain: v })}
              className="[&_[role=slider]]:bg-ember-amber"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
