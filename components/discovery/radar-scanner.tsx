'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSimulationStore, type DiscoveredPeer } from '@/lib/simulation-store'

export function RadarScanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { discoveredPeers, isScanning, scanRadius, isRunning } = useSimulationStore()
  const animationRef = useRef<number | null>(null)
  const sweepAngleRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(centerX, centerY) - 20

    const draw = () => {
      ctx.fillStyle = 'rgba(13, 17, 23, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid circles
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)'
      ctx.lineWidth = 1
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, (maxRadius / 4) * i, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw cross lines
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)'
      ctx.beginPath()
      ctx.moveTo(centerX, 20)
      ctx.lineTo(centerX, canvas.height - 20)
      ctx.moveTo(20, centerY)
      ctx.lineTo(canvas.width - 20, centerY)
      ctx.stroke()

      // Draw sweep if scanning
      if (isScanning && isRunning) {
        sweepAngleRef.current += 0.03
        if (sweepAngleRef.current > Math.PI * 2) {
          sweepAngleRef.current = 0
        }

        // Sweep gradient
        const gradient = ctx.createConicGradient(sweepAngleRef.current, centerX, centerY)
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)')
        gradient.addColorStop(0.1, 'rgba(0, 255, 255, 0)')
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2)
        ctx.fill()

        // Sweep line
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(
          centerX + Math.cos(sweepAngleRef.current) * maxRadius,
          centerY + Math.sin(sweepAngleRef.current) * maxRadius
        )
        ctx.stroke()
      }

      // Draw discovered peers as blips
      discoveredPeers.forEach((peer) => {
        const angle = Math.random() * Math.PI * 2 // Use consistent angle based on peer id
        const normalizedDistance = peer.distance / 500
        const radius = normalizedDistance * maxRadius

        // Calculate position (use peer id hash for consistent positioning)
        const hash = peer.id.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
        const peerAngle = (hash % 360) * (Math.PI / 180)
        const x = centerX + Math.cos(peerAngle) * radius
        const y = centerY + Math.sin(peerAngle) * radius

        // Blip color based on type
        let blipColor = 'rgba(0, 255, 255, 0.8)'
        if (peer.type === 'gateway') blipColor = 'rgba(34, 197, 94, 0.9)'
        else if (peer.type === 'relay') blipColor = 'rgba(251, 191, 36, 0.9)'
        else blipColor = 'rgba(0, 255, 255, 0.9)'

        // Draw blip glow
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 12)
        glowGradient.addColorStop(0, blipColor)
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fill()

        // Draw blip core
        ctx.fillStyle = blipColor
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()

        // Draw signal strength indicator
        const signalAlpha = peer.signalStrength / 100
        ctx.strokeStyle = `rgba(0, 255, 255, ${signalAlpha * 0.5})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, 8 + (1 - signalAlpha) * 8, 0, Math.PI * 2)
        ctx.stroke()
      })

      // Draw center dot
      ctx.fillStyle = 'rgb(0, 255, 255)'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2)
      ctx.fill()

      // Draw scan radius indicator
      const radiusIndicator = (scanRadius / 500) * maxRadius
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)'
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(centerX, centerY, radiusIndicator, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [discoveredPeers, isScanning, scanRadius, isRunning])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="rounded-lg border border-border/50 bg-background"
      />
      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
          Endpoint
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
          Relay
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          Gateway
        </span>
      </div>
      {isScanning && isRunning && (
        <motion.div
          className="absolute top-2 right-2 flex items-center gap-2 rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-400"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
          SCANNING
        </motion.div>
      )}
    </div>
  )
}
