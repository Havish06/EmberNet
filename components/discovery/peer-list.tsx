'use client'

import { useSimulationStore, type DiscoveredPeer } from '@/lib/simulation-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, Radio, Server, Smartphone, Router } from 'lucide-react'

function getNodeIcon(type: DiscoveredPeer['type']) {
  switch (type) {
    case 'gateway':
      return Server
    case 'relay':
      return Router
    case 'endpoint':
      return Smartphone
    default:
      return Radio
  }
}

function getSignalIcon(strength: number) {
  if (strength > 60) return Wifi
  if (strength > 30) return Wifi
  return WifiOff
}

function getSignalColor(strength: number) {
  if (strength > 70) return 'text-green-400'
  if (strength > 40) return 'text-amber-400'
  return 'text-red-400'
}

function getTrustColor(trust: number) {
  if (trust > 80) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (trust > 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

interface PeerListProps {
  filter?: 'all' | 'connectable' | 'gateway' | 'relay' | 'endpoint'
  searchQuery?: string
}

export function PeerList({ filter = 'all', searchQuery = '' }: PeerListProps) {
  const { discoveredPeers, initiateConnection, connections, pendingConnections, isRunning } = useSimulationStore()

  const filteredPeers = discoveredPeers
    .filter(peer => {
      if (filter === 'connectable') return peer.isConnectable
      if (filter === 'gateway' || filter === 'relay' || filter === 'endpoint') {
        return peer.type === filter
      }
      return true
    })
    .filter(peer => 
      peer.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.signalStrength - a.signalStrength)

  const isConnecting = (peerId: string) => {
    return pendingConnections.includes(peerId) || connections.some(c => c.remoteNodeId === peerId && (c.status === 'handshaking' || c.status === 'connected'))
  }

  const handleConnect = (peerId: string) => {
    if (isRunning) {
      initiateConnection(peerId)
    }
  }

  if (filteredPeers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Radio className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No peers discovered</p>
        <p className="text-xs text-muted-foreground/70">Start scanning to find nearby devices</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 pr-4">
        {filteredPeers.map(peer => {
          const NodeIcon = getNodeIcon(peer.type)
          const SignalIcon = getSignalIcon(peer.signalStrength)
          const connecting = isConnecting(peer.id)

          return (
            <div
              key={peer.id}
              className={cn(
                'group relative rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:border-primary/30 hover:bg-card',
                connecting && 'border-cyan-500/30 bg-cyan-500/5'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    peer.type === 'gateway' && 'bg-green-500/10 text-green-400',
                    peer.type === 'relay' && 'bg-amber-500/10 text-amber-400',
                    peer.type === 'endpoint' && 'bg-cyan-500/10 text-cyan-400'
                  )}>
                    <NodeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{peer.label}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {peer.type}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <SignalIcon className={cn('h-3 w-3', getSignalColor(peer.signalStrength))} />
                        {peer.signalStrength}%
                      </span>
                      <span>{peer.distance}m</span>
                      <Badge 
                        variant="outline" 
                        className={cn('text-[10px]', getTrustColor(peer.trust))}
                      >
                        Trust: {peer.trust}%
                      </Badge>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground/70">
                      ID: {peer.id}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {connecting ? (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {connections.find(c => c.remoteNodeId === peer.id)?.status === 'connected' 
                        ? 'Connected' 
                        : 'Connecting...'}
                    </Badge>
                  ) : peer.isConnectable ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-primary/30 hover:bg-primary/10"
                      onClick={() => handleConnect(peer.id)}
                      disabled={!isRunning}
                    >
                      Connect
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Unavailable
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
