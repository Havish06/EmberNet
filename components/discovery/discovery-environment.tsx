'use client'

import { useState } from 'react'
import { useSimulationStore } from '@/lib/simulation-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadarScanner } from './radar-scanner'
import { PeerList } from './peer-list'
import { Search, Radio, Radar, Wifi, Server, Router, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DiscoveryEnvironment() {
  const { 
    isScanning, 
    startScan, 
    stopScan, 
    scanRadius, 
    setScanRadius, 
    discoveredPeers,
    isRunning 
  } = useSimulationStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'connectable' | 'gateway' | 'relay' | 'endpoint'>('all')

  const peerStats = {
    total: discoveredPeers.length,
    connectable: discoveredPeers.filter(p => p.isConnectable).length,
    gateways: discoveredPeers.filter(p => p.type === 'gateway').length,
    relays: discoveredPeers.filter(p => p.type === 'relay').length,
    endpoints: discoveredPeers.filter(p => p.type === 'endpoint').length,
  }

  return (
    <div className="grid h-full gap-4 lg:grid-cols-[1fr_400px]">
      {/* Left Panel - Radar and Controls */}
      <div className="flex flex-col gap-4">
        <Card className="border-border/50 bg-card/30 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Radar className="h-4 w-4 text-cyan-400" />
                Peer Discovery Radar
              </CardTitle>
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  isScanning && isRunning ? 'border-cyan-500/50 text-cyan-400' : 'text-muted-foreground'
                )}
              >
                {isScanning && isRunning ? 'ACTIVE' : 'IDLE'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <RadarScanner />
            
            <div className="w-full space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => isScanning ? stopScan() : startScan()}
                  className={cn(
                    'flex-1',
                    isScanning 
                      ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30' 
                      : 'bg-primary hover:bg-primary/90'
                  )}
                  disabled={!isRunning}
                >
                  <Radio className="mr-2 h-4 w-4" />
                  {isScanning ? 'Stop Scanning' : 'Start Scan'}
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Scan Radius</Label>
                  <span className="text-xs text-foreground">{scanRadius}m</span>
                </div>
                <Slider
                  value={[scanRadius]}
                  onValueChange={([value]) => setScanRadius(value)}
                  min={50}
                  max={500}
                  step={10}
                  className="py-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discovery Stats */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-lg font-semibold text-foreground">{peerStats.total}</p>
                  <p className="text-[10px] text-muted-foreground">DISCOVERED</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-lg font-semibold text-foreground">{peerStats.gateways}</p>
                  <p className="text-[10px] text-muted-foreground">GATEWAYS</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Router className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-lg font-semibold text-foreground">{peerStats.relays}</p>
                  <p className="text-[10px] text-muted-foreground">RELAYS</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-lg font-semibold text-foreground">{peerStats.endpoints}</p>
                  <p className="text-[10px] text-muted-foreground">ENDPOINTS</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Peer List */}
      <Card className="border-border/50 bg-card/30 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4 text-cyan-400" />
              Discovered Peers
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {peerStats.connectable} available
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search peers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="grid w-full grid-cols-5 h-8">
              <TabsTrigger value="all" className="text-[10px] px-1">All</TabsTrigger>
              <TabsTrigger value="connectable" className="text-[10px] px-1">Available</TabsTrigger>
              <TabsTrigger value="gateway" className="text-[10px] px-1">Gateway</TabsTrigger>
              <TabsTrigger value="relay" className="text-[10px] px-1">Relay</TabsTrigger>
              <TabsTrigger value="endpoint" className="text-[10px] px-1">Endpoint</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Peer List */}
          <PeerList filter={filter} searchQuery={searchQuery} />
        </CardContent>
      </Card>
    </div>
  )
}
