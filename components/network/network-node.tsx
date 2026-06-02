'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { NetworkNode, NodeStatus, NodeType } from '@/lib/simulation-store'

interface NetworkNodeData extends Record<string, unknown> {
  node: NetworkNode
  isSelected: boolean
  onClick: () => void
}

const statusColors: Record<NodeStatus, { bg: string; border: string; glow: string }> = {
  online: {
    bg: 'bg-ember-green/20',
    border: 'border-ember-green',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.4)]'
  },
  degraded: {
    bg: 'bg-ember-amber/20',
    border: 'border-ember-amber',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]'
  },
  offline: {
    bg: 'bg-ember-red/20',
    border: 'border-ember-red/50',
    glow: ''
  }
}

const typeIcons: Record<NodeType, string> = {
  gateway: '◈',
  relay: '◇',
  endpoint: '○'
}

function NetworkNodeComponent(props: any) {
  const { data } = props as { data: NetworkNodeData }
  const { node, isSelected, onClick } = data
  const status = statusColors[node.status]
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'relative cursor-pointer transition-all duration-200',
        isSelected && 'z-10'
      )}
      onClick={onClick}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-muted-foreground/50 !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-muted-foreground/50 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-muted-foreground/50 !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-muted-foreground/50 !border-0"
      />
      
      {/* Node body */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center',
          'w-20 h-20 rounded-lg border-2',
          'transition-all duration-300',
          status.bg,
          status.border,
          node.status !== 'offline' && status.glow,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
      >
        {/* Pulse animation for online nodes */}
        {node.status === 'online' && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-lg border-2',
              status.border
            )}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
        
        {/* Type icon */}
        <span className={cn(
          'text-2xl',
          node.status === 'online' && 'text-ember-green',
          node.status === 'degraded' && 'text-ember-amber',
          node.status === 'offline' && 'text-ember-red/50'
        )}>
          {typeIcons[node.type]}
        </span>
        
        {/* Battery indicator */}
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              node.battery > 50 && 'bg-ember-green',
              node.battery > 20 && node.battery <= 50 && 'bg-ember-amber',
              node.battery <= 20 && 'bg-ember-red'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${node.battery}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        {/* Trust badge */}
        <div className={cn(
          'absolute -top-1 -right-1 w-5 h-5 rounded-full',
          'flex items-center justify-center text-[9px] font-bold',
          'border',
          node.trust >= 90 && 'bg-ember-green/30 border-ember-green text-ember-green',
          node.trust >= 70 && node.trust < 90 && 'bg-ember-amber/30 border-ember-amber text-ember-amber',
          node.trust < 70 && 'bg-ember-red/30 border-ember-red text-ember-red'
        )}>
          {Math.round(node.trust)}
        </div>
      </div>
      
      {/* Label */}
      <div className="mt-1 text-center">
        <p className={cn(
          'text-[10px] font-medium truncate max-w-20',
          node.status === 'offline' ? 'text-muted-foreground' : 'text-foreground'
        )}>
          {node.label}
        </p>
        <p className="text-[8px] text-muted-foreground">
          {node.latency}ms
        </p>
      </div>
    </motion.div>
  )
}

export const NetworkNodeMemo = memo(NetworkNodeComponent)
