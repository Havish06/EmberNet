'use client'

import { useSimulationStore, type NetworkEvent } from '@/lib/simulation-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const severityColors = {
  info: 'text-ember-cyan border-ember-cyan/30',
  warning: 'text-ember-amber border-ember-amber/30',
  error: 'text-ember-red border-ember-red/30',
  success: 'text-ember-green border-ember-green/30'
}

const severityBg = {
  info: 'bg-ember-cyan/10',
  warning: 'bg-ember-amber/10',
  error: 'bg-ember-red/10',
  success: 'bg-ember-green/10'
}

const typeIcons: Record<string, string> = {
  packet_sent: '→',
  packet_delivered: '✓',
  packet_dropped: '✕',
  node_status_change: '◇',
  chaos_event: '⚡',
  route_change: '↻',
  peer_discovered: '◆',
  peer_lost: '◆',
  connection_request: '🔗',
  connection_established: '✓',
  connection_terminated: '✕',
  message_sent: '→',
  message_received: '←',
  handshake_start: '🤝',
  handshake_complete: '✓'
}

function EventItem({ event }: { event: NetworkEvent }) {
  const timeStr = new Date(event.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'flex items-start gap-2 p-2 rounded border-l-2',
        severityColors[event.severity],
        severityBg[event.severity]
      )}
    >
      <span className="text-xs opacity-75 flex-shrink-0">
        {typeIcons[event.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed truncate">
          {event.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {timeStr}
        </p>
      </div>
    </motion.div>
  )
}

export function EventFeed() {
  const { events } = useSimulationStore()
  
  // Show events in reverse chronological order (newest first)
  const sortedEvents = [...events].reverse().slice(0, 50)
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Event Feed
        </h3>
        <span className="text-[10px] text-muted-foreground">
          {events.length} events
        </span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1.5 pr-2">
          <AnimatePresence mode="popLayout">
            {sortedEvents.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                No events yet. Start the simulation.
              </div>
            ) : (
              sortedEvents.map((event) => (
                <EventItem key={event.id} event={event} />
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
