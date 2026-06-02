'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useSimulationStore, type TrafficRecord } from '@/lib/simulation-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Activity, ArrowRightLeft, Download, Upload, Shield, Trash2, Zap, Heart, Search, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function getPacketTypeIcon(type: TrafficRecord['packetType']) {
  switch (type) {
    case 'data':
      return Zap
    case 'heartbeat':
      return Heart
    case 'discovery':
      return Search
    case 'handshake':
      return Shield
    case 'message':
      return MessageSquare
    default:
      return Activity
  }
}

function getStageIcon(stage: TrafficRecord['stage']) {
  switch (stage) {
    case 'sent':
      return Upload
    case 'received':
      return Download
    case 'transmitted':
      return ArrowRightLeft
    case 'dropped':
      return Trash2
    default:
      return Activity
  }
}

function getPacketTypeColor(type: TrafficRecord['packetType']) {
  switch (type) {
    case 'data':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    case 'heartbeat':
      return 'text-green-400 bg-green-500/10 border-green-500/30'
    case 'discovery':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    case 'handshake':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    case 'message':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    default:
      return 'text-muted-foreground bg-muted/10 border-border'
  }
}

function getStageColor(stage: TrafficRecord['stage']) {
  switch (stage) {
    case 'sent':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    case 'received':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'transmitted':
      return 'text-violet-400 bg-violet-500/10 border-violet-500/30'
    case 'dropped':
      return 'text-red-400 bg-red-500/10 border-red-500/30'
    default:
      return 'text-muted-foreground bg-muted/10 border-border'
  }
}

export function PacketStream() {
  const { traffic, nodes, isRunning, selectedNodeId, selectNode } = useSimulationStore()
  const [displayTraffic, setDisplayTraffic] = useState<TrafficRecord[]>([])
  const [filterType, setFilterType] = useState<TrafficRecord['packetType'] | 'all'>('all')
  const [filterStage, setFilterStage] = useState<TrafficRecord['stage'] | 'all'>('all')
  const [page, setPage] = useState(0)
  const trafficPerPage = 80
  const scrollRef = useRef<HTMLDivElement>(null)

  const perspectiveLabel = useMemo(() => {
    if (!selectedNodeId) return 'Admin'
    return nodes.find(n => n.id === selectedNodeId)?.label || selectedNodeId
  }, [nodes, selectedNodeId])

  const filteredTraffic = useMemo(() => {
    let records = traffic

    if (selectedNodeId) {
      records = records.filter((entry) =>
        entry.sourceId === selectedNodeId ||
        entry.fromNodeId === selectedNodeId ||
        entry.toNodeId === selectedNodeId ||
        entry.currentNodeId === selectedNodeId ||
        entry.route.includes(selectedNodeId)
      )
    }

    if (filterType !== 'all') {
      records = records.filter((entry) => entry.packetType === filterType)
    }

    if (filterStage !== 'all') {
      records = records.filter((entry) => entry.stage === filterStage)
    }

    return records
  }, [traffic, selectedNodeId, filterType, filterStage])

  useEffect(() => {
    const start = page * trafficPerPage
    const end = start + trafficPerPage
    setDisplayTraffic(filteredTraffic.slice().reverse().slice(start, end))
  }, [filteredTraffic, page])

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(filteredTraffic.length / trafficPerPage))
    if (page > nextTotalPages - 1) {
      setPage(nextTotalPages - 1)
    }
  }, [filteredTraffic, page])

  const getNodeLabel = (nodeId: string | null) => {
    if (!nodeId) return '—'
    return nodes.find(n => n.id === nodeId)?.label || nodeId
  }

  const totalPages = Math.max(1, Math.ceil(filteredTraffic.length / trafficPerPage))

  const summary = useMemo(() => {
    return filteredTraffic.reduce(
      (acc, entry) => {
        acc[entry.stage]++
        return acc
      },
      { sent: 0, transmitted: 0, received: 0, dropped: 0 }
    )
  }, [filteredTraffic])

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-cyan-400" />
            Packet Flow
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Perspective: {perspectiveLabel}
            </Badge>
            <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              {summary.sent} sent
            </Badge>
            <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/30">
              {summary.transmitted} relayed
            </Badge>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              {summary.received} received
            </Badge>
            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
              {summary.dropped} dropped
            </Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as TrafficRecord['packetType'] | 'all')
              setPage(0)
            }}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            <option value="all">All Packet Types</option>
            <option value="data">Data</option>
            <option value="heartbeat">Heartbeat</option>
            <option value="discovery">Discovery</option>
            <option value="handshake">Handshake</option>
            <option value="message">Message</option>
          </select>
          <select
            value={filterStage}
            onChange={(e) => {
              setFilterStage(e.target.value as TrafficRecord['stage'] | 'all')
              setPage(0)
            }}
            className="text-xs bg-background border border-border rounded px-2 py-1"
          >
            <option value="all">All Stages</option>
            <option value="sent">Sent</option>
            <option value="transmitted">Transmitted</option>
            <option value="received">Received</option>
            <option value="dropped">Dropped</option>
          </select>
          {selectedNodeId && (
            <button
              onClick={() => selectNode(null)}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/50"
            >
              Clear node perspective
            </button>
          )}
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              isRunning ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'text-muted-foreground'
            )}
          >
            {displayTraffic.length} displayed
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[360px]" ref={scrollRef}>
          <div className="space-y-2 pr-4">
            <AnimatePresence mode="popLayout">
              {displayTraffic.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No packet traffic yet</p>
                  <p className="text-xs text-muted-foreground/70">Start the simulation to see sent, relayed, and received traffic</p>
                </div>
              ) : (
                displayTraffic.map((entry) => {
                  const PacketIcon = getPacketTypeIcon(entry.packetType)
                  const StageIcon = getStageIcon(entry.stage)
                  const routeText = entry.route.length > 1 ? entry.route.map(getNodeLabel).join(' → ') : `${getNodeLabel(entry.fromNodeId)} → ${getNodeLabel(entry.toNodeId)}`
                  const fromLabel = getNodeLabel(entry.fromNodeId)
                  const toLabel = getNodeLabel(entry.toNodeId)

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/50 p-2 text-xs"
                    >
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded border', getPacketTypeColor(entry.packetType))}>
                        <PacketIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-muted-foreground">{entry.packetId}</span>
                          <Badge variant="outline" className={cn('text-[9px] px-1', getPacketTypeColor(entry.packetType))}>
                            {entry.packetType.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[9px] px-1', getStageColor(entry.stage))}>
                            <StageIcon className="mr-1 h-3 w-3" />
                            {entry.stage.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                          <span className="text-foreground">{fromLabel}</span>
                          <span className="text-cyan-400">→</span>
                          <span className="text-foreground">{toLabel}</span>
                          {entry.encrypted && <span className="ml-1 text-emerald-400">encrypted</span>}
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground truncate">
                          Route: {routeText}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-muted-foreground">{entry.size}B</span>
                        <span className="text-[9px] text-muted-foreground">{entry.currentNodeId === entry.toNodeId ? 'delivered' : 'in transit'}</span>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <div>Page {page + 1} of {totalPages}</div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-2 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1}
                className="px-2 py-1 rounded border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
