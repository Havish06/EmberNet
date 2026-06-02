'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSimulationStore } from '@/lib/simulation-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MessageSquare, Send, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export function MessageCenter() {
  const { connections, messages, sendMessage, selectedConnectionId, selectConnection, isRunning } = useSimulationStore()
  const connectedConnections = useMemo(
    () => connections.filter(conn => conn.status === 'connected'),
    [connections]
  )
  const [draft, setDraft] = useState('')
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedConnectionId && connectedConnections.some(conn => conn.id === selectedConnectionId)) {
      setActiveConnectionId(selectedConnectionId)
      return
    }

    if (!activeConnectionId || !connectedConnections.some(conn => conn.id === activeConnectionId)) {
      setActiveConnectionId(connectedConnections[0]?.id ?? null)
    }
  }, [activeConnectionId, connectedConnections, selectedConnectionId])

  const activeConnection = connectedConnections.find(conn => conn.id === activeConnectionId) ?? null
  const threadMessages = messages
    .filter(message => message.connectionId === activeConnection?.id)
    .slice(-20)

  const handleSend = () => {
    if (!activeConnection || draft.trim().length === 0) return
    sendMessage(activeConnection.id, draft.trim())
    setDraft('')
  }

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            Messaging
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {connectedConnections.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedConnections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Connect a peer to start messaging.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {connectedConnections.map(conn => (
                <Button
                  key={conn.id}
                  type="button"
                  size="sm"
                  variant={activeConnection?.id === conn.id ? 'default' : 'outline'}
                  className="h-8 text-xs"
                  onClick={() => {
                    setActiveConnectionId(conn.id)
                    selectConnection(conn.id)
                  }}
                >
                  {conn.remotePeerLabel}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeConnection ? `Message ${activeConnection.remotePeerLabel}` : 'Select a connection'}
                className="min-h-[88px] bg-background/50"
                disabled={!activeConnection || !isRunning}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] text-muted-foreground">
                  Messages are queued and delivered by the simulation tick.
                </p>
                <Button size="sm" onClick={handleSend} disabled={!activeConnection || draft.trim().length === 0 || !isRunning}>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[220px] rounded-lg border border-border/50 bg-background/40">
              <div className="space-y-2 p-3">
                {threadMessages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No messages on this connection yet.
                  </div>
                ) : (
                  threadMessages.map(message => {
                    const isOutbound = message.direction === 'outbound'
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          'flex items-start gap-2 rounded-lg border p-2 text-xs',
                          isOutbound ? 'ml-8 border-cyan-500/20 bg-cyan-500/5' : 'mr-8 border-border/60 bg-card/60'
                        )}
                      >
                        <div className={cn(
                          'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border',
                          isOutbound ? 'border-cyan-500/30 text-cyan-400' : 'border-emerald-500/30 text-emerald-400'
                        )}>
                          {isOutbound ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {isOutbound ? 'You' : activeConnection?.remotePeerLabel}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {message.status}
                            </Badge>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}
