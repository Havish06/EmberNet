'use client'

import { useSimulationStore } from '@/lib/simulation-store'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export function MetricsPanel() {
  const { metrics } = useSimulationStore()
  
  const deliveryRate = metrics.totalPacketsSent > 0
    ? ((metrics.totalPacketsDelivered / metrics.totalPacketsSent) * 100).toFixed(1)
    : '0.0'
  
  const chartData = metrics.history.map((h, i) => ({
    tick: i,
    throughput: h.throughput,
    latency: h.latency,
    loss: h.packetLoss
  }))
  
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Network Metrics
      </h3>
      
      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Packets Sent"
          value={metrics.totalPacketsSent}
          color="cyan"
        />
        <MetricCard
          label="Delivered"
          value={metrics.totalPacketsDelivered}
          color="green"
        />
        <MetricCard
          label="Dropped"
          value={metrics.totalPacketsDropped}
          color="red"
        />
        <MetricCard
          label="Delivery Rate"
          value={`${deliveryRate}%`}
          color={Number(deliveryRate) >= 90 ? 'green' : Number(deliveryRate) >= 70 ? 'amber' : 'red'}
        />
      </div>
      
      {/* Throughput chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Throughput</span>
          <span className="text-xs font-mono text-ember-cyan">{metrics.throughput} pkt/s</span>
        </div>
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="throughput"
                stroke="oklch(0.75 0.18 195)"
                strokeWidth={1.5}
                dot={false}
              />
              <XAxis hide />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.16 0.015 250)',
                  border: '1px solid oklch(0.28 0.02 250)',
                  borderRadius: '4px',
                  fontSize: '10px',
                }}
                labelStyle={{ display: 'none' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Latency chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Avg Latency</span>
          <span className={cn(
            'text-xs font-mono',
            metrics.avgLatency < 50 && 'text-ember-green',
            metrics.avgLatency >= 50 && metrics.avgLatency < 100 && 'text-ember-amber',
            metrics.avgLatency >= 100 && 'text-ember-red'
          )}>
            {metrics.avgLatency.toFixed(0)}ms
          </span>
        </div>
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="latency"
                stroke="oklch(0.78 0.16 85)"
                strokeWidth={1.5}
                dot={false}
              />
              <XAxis hide />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.16 0.015 250)',
                  border: '1px solid oklch(0.28 0.02 250)',
                  borderRadius: '4px',
                  fontSize: '10px',
                }}
                labelStyle={{ display: 'none' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  label, 
  value, 
  color 
}: { 
  label: string
  value: string | number
  color: 'cyan' | 'green' | 'amber' | 'red'
}) {
  const colorClasses = {
    cyan: 'text-ember-cyan',
    green: 'text-ember-green',
    amber: 'text-ember-amber',
    red: 'text-ember-red'
  }
  
  return (
    <div className="p-2 bg-secondary/30 rounded border border-border">
      <div className={cn('text-lg font-bold font-mono', colorClasses[color])}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}
