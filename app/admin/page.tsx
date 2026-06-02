'use client'

import { useEffect, useState } from 'react'
import { useNetworkSocket } from '@/hooks/useNetworkSocket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Radio, Zap, Shield } from 'lucide-react'

export default function AdminDashboard() {
  const { topology, isConnected } = useNetworkSocket()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading network topology...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Network Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time mesh network visualization and monitoring
          </p>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Socket.IO Connection</p>
                  <Badge className={isConnected ? 'bg-green-500' : 'bg-red-500'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Nodes</p>
                  <p className="text-2xl font-bold">{topology?.totalNodes ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Online Nodes</p>
                  <p className="text-2xl font-bold text-green-500">{topology?.onlineNodes ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Update</p>
                  <p className="text-sm text-muted-foreground">
                    {topology?.lastUpdate ? new Date(topology.lastUpdate).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="h-96 bg-gradient-to-br from-slate-900 to-slate-800">
              <CardHeader>
                <CardTitle>Network Topology</CardTitle>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Topology visualization will render here<br/>
                  <span className="text-xs">Connected nodes: {Object.keys(topology?.topology ?? {}).length}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Encryption Status
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <p>
                    <span className="text-muted-foreground">Algorithm:</span> ChaCha20-Poly1305
                  </p>
                  <p>
                    <span className="text-muted-foreground">Signing:</span> Ed25519
                  </p>
                  <p>
                    <span className="text-muted-foreground">Key Exchange:</span> Active
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">Avg Latency:</span> --ms
                </p>
                <p>
                  <span className="text-muted-foreground">Throughput:</span> --mbps
                </p>
                <p>
                  <span className="text-muted-foreground">Packet Loss:</span> --%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8 border-yellow-600/50 bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="text-yellow-600">Admin Visibility Notice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-600/80">
            <p>
              <strong>You can see:</strong> Node topology, connections, packet routes, traffic patterns, encryption status
            </p>
            <p className="mt-2">
              <strong>You CANNOT see:</strong> Message plaintext, session keys, decrypted payloads
            </p>
            <p className="mt-2">
              All messages are end-to-end encrypted with ChaCha20. Session keys are temporary and never exposed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
