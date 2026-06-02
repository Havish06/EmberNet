import { NextRequest, NextResponse } from 'next/server'
import { initializeRedis } from '@/lib/backend/redis-client'
import { createNode, getAllNodes } from '@/lib/backend/node-manager'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    await initializeRedis()

    const nodes = await getAllNodes()

    return NextResponse.json({ success: true, nodes })
  } catch (error) {
    console.error('Error getting nodes:', error)
    return NextResponse.json(
      { error: 'Failed to get nodes' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeRedis()

    const body = await req.json()
    const { userId, deviceId, nodeType, publicKey } = body

    if (!userId || !deviceId || !nodeType || !publicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validTypes = ['relay', 'endpoint', 'gateway']
    if (!validTypes.includes(nodeType)) {
      return NextResponse.json(
        { error: 'Invalid node type' },
        { status: 400 }
      )
    }

    const node = await createNode(userId, deviceId, nodeType, publicKey)

    return NextResponse.json({ success: true, node })
  } catch (error) {
    console.error('Error creating node:', error)
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    )
  }
}
