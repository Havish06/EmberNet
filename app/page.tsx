'use client'

import { useEffect, useRef } from 'react'
import { StatusBar } from '@/components/dashboard/status-bar'
import { DiscoveryEnvironment } from '@/components/discovery/discovery-environment'
import { ManagementEnvironment } from '@/components/management/management-environment'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSimulationStore } from '@/lib/simulation-store'

export default function Dashboard() {
  const { tick, isRunning, speed, activeEnvironment, setActiveEnvironment } = useSimulationStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      const interval = 200 / speed
      intervalRef.current = setInterval(() => {
        tick()
      }, interval)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, speed, tick])

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <StatusBar />

      <main className="flex-1 min-h-0 overflow-hidden p-4">
        <Tabs
          value={activeEnvironment}
          onValueChange={(value) => setActiveEnvironment(value === 'management' ? 'management' : 'discovery')}
          className="h-full min-h-0 gap-4"
        >
          <div className="flex items-center justify-between gap-4">
            <TabsList className="grid w-full max-w-sm grid-cols-2">
              <TabsTrigger value="discovery">Discovery</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="discovery" className="mt-0 min-h-0">
            <DiscoveryEnvironment />
          </TabsContent>

          <TabsContent value="management" className="mt-0 min-h-0">
            <ManagementEnvironment />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
