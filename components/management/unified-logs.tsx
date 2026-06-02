'use client'

import { useMemo } from 'react'
import { useSimulationStore, type Message, type NetworkEvent } from '@/lib/simulation-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Activity, MessageSquare } from 'lucide-react'

type LogEntry =
  | {
      id: string
      timestamp: number
      kind: 'event'
      severity: NetworkEvent['severity']
      label: string
      detail: string
    }
  | {
      id: string
      timestamp: number
      kind: 'message'
      severity: 'info' | 'success' | 'warning' | 'error'
      label: string
      detail: string
    }

const severityClasses = {
  info: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
  success: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  warning: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
  error: 'border-red-500/30 text-red-400 bg-red-500/10'
}

function messageSeverity(status: Message['status']): LogEntry['severity'] {
  switch (status) {
    case 'delivered':
      return 'success'
    case 'failed':
      return 'error'
    case 'sent':
      return 'info'
    case 'sending':
    default:
      return 'warning'
  }
}

export function UnifiedLogs() {
  const { events, messages, connections } = useSimulationStore()

  const logEntries = useMemo<LogEntry[]>(() => {
    const eventEntries = events.map((event) => ({
      id: `event-${event.id}`,
      timestamp: event.timestamp,
      kind: 'event' as const,
      severity: event.severity,
      label: event.type.replace(/_/g, ' '),
      detail: event.message,
    }))

    const messageEntries = messages.map((message) => {
      const connection = connections.find(conn => conn.id === message.connectionId)
      return {
        id: `message-${message.id}`,
        timestamp: message.timestamp,
        kind: 'message' as const,
        severity: messageSeverity(message.status),
        label: message.direction === 'outbound' ? 'message sent' : 'message received',
        detail: `${connection?.remotePeerLabel ?? message.connectionId}: ${message.content}`,
      }
    })

    return [...eventEntries, ...messageEntries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 200)
  }, [connections, events, messages])

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-cyan-400" />
          Unified Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[260px]">
          <div className="space-y-2 pr-3">
            {logEntries.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Logs appear here as events and messages flow through the simulation.
              </div>
            ) : (
              logEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'rounded-lg border p-2 text-xs',
                    severityClasses[entry.severity]
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {entry.kind === 'event' ? 'event' : 'message'}
                      </Badge>
                      <span className="font-medium capitalize">{entry.label}</span>
                    </div>
                    {entry.kind === 'message' && <MessageSquare className="h-3.5 w-3.5" />}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                    {entry.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
