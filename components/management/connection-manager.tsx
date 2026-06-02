'use client'

import { useSimulationStore, type Connection } from '@/lib/simulation-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { 
  Link, 
  Link2Off, 
  ArrowUpDown, 
  Shield, 
  Clock, 
  Zap,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

function getStatusColor(status: Connection['status']) {
  switch (status) {
    case 'connected':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'handshaking':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'terminated':
      return 'bg-muted text-muted-foreground border-border'
    case 'failed':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function getStatusIcon(status: Connection['status']) {
  switch (status) {
    case 'connected':
      return CheckCircle
    case 'handshaking':
      return Loader2
    case 'pending':
      return Clock
    case 'terminated':
      return Link2Off
    case 'failed':
      return XCircle
    default:
      return Link
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function ConnectionManager() {
  const { 
    connections, 
    terminateConnection, 
    selectConnection, 
    selectedConnectionId,
    isRunning 
  } = useSimulationStore()

  const activeConnections = connections.filter(c => c.status === 'connected' || c.status === 'handshaking')
  const terminatedConnections = connections.filter(c => c.status === 'terminated' || c.status === 'failed')

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="h-4 w-4 text-cyan-400" />
            Connection Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
              {activeConnections.length} active
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-3 pr-4">
            {connections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Link className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No connections</p>
                <p className="text-xs text-muted-foreground/70">Connect to peers in Discovery</p>
              </div>
            ) : (
              connections.map(conn => {
                const StatusIcon = getStatusIcon(conn.status)
                const isSelected = selectedConnectionId === conn.id
                const duration = conn.establishedAt 
                  ? formatDuration(Date.now() - conn.establishedAt)
                  : '--'

                return (
                  <div
                    key={conn.id}
                    onClick={() => selectConnection(conn.id)}
                    className={cn(
                      'cursor-pointer rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:border-primary/30',
                      isSelected && 'border-cyan-500/50 bg-cyan-500/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{conn.remotePeerLabel}</span>
                          <Badge 
                            variant="outline" 
                            className={cn('text-[10px]', getStatusColor(conn.status))}
                          >
                            <StatusIcon className={cn(
                              'mr-1 h-3 w-3',
                              conn.status === 'handshaking' && 'animate-spin'
                            )} />
                            {conn.status.toUpperCase()}
                          </Badge>
                        </div>

                        {conn.status === 'handshaking' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Handshake Progress</span>
                              <span>{Math.round(conn.handshakeProgress)}%</span>
                            </div>
                            <Progress value={conn.handshakeProgress} className="h-1.5" />
                          </div>
                        )}

                        {conn.status === 'connected' && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ArrowUpDown className="h-3 w-3" />
                              <span className="text-green-400">{formatBytes(conn.bytesIn)}</span>
                              <span>/</span>
                              <span className="text-cyan-400">{formatBytes(conn.bytesOut)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Zap className="h-3 w-3 text-amber-400" />
                              <span>{conn.latency}ms</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{duration}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            <Shield className="mr-1 h-2.5 w-2.5" />
                            {conn.encryption.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {conn.protocol.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {(conn.status === 'connected' || conn.status === 'handshaking') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            terminateConnection(conn.id)
                          }}
                          disabled={!isRunning}
                        >
                          <Link2Off className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
