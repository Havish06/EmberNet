'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { SimulationControls } from '@/components/dashboard/simulation-controls'
import { NodeList } from '@/components/dashboard/node-list'
import { NodeInspector } from '@/components/dashboard/node-inspector'
import { NetworkGraph } from '@/components/network/network-graph'
import { ConnectionManager } from './connection-manager'
import { PacketStream } from './packet-stream'
import { MessageCenter } from './message-center'
import { UnifiedLogs } from './unified-logs'

export function ManagementEnvironment() {
  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
      <aside className="min-h-0 border-r border-border/50 bg-card/20">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            <SimulationControls />
            <div className="border-t border-border/50 pt-4">
              <NodeList />
            </div>
          </div>
        </ScrollArea>
      </aside>

      <section className="flex min-h-0 flex-col gap-4">
        <div className="min-h-[460px] flex-1">
          <NetworkGraph />
        </div>
        <PacketStream />
      </section>

      <aside className="min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-1 pr-4">
            <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur p-4">
              <NodeInspector />
            </div>
            <ConnectionManager />
            <MessageCenter />
            <UnifiedLogs />
          </div>
        </ScrollArea>
      </aside>
    </div>
  )
}
