import { NextRequest, NextResponse } from 'next/server'
import { initializeRedis } from '@/lib/backend/redis-client'
import { createConnection, getNodeConnections } from '@/lib/backend/connection-manager'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    await initializeRedis()

    const nodeId = req.nextUrl.searchParams.get('nodeId')
    if (!nodeId) {
      return NextResponse.json(
        { error: 'Missing nodeId parameter' },
        { status: 400 }
      )
    }

    const connections = await getNodeConnections(nodeId)

    return NextResponse.json({ success: true, connections })
  } catch (error) {
    console.error('Error getting connections:', error)
    return NextResponse.json(
      { error: 'Failed to get connections' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeRedis()

    const body = await req.json()
    const { sourceNodeId, targetNodeId } = body

    if (!sourceNodeId || !targetNodeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const connection = await createConnection(sourceNodeId, targetNodeId)

    return NextResponse.json({ success: true, connection })
  } catch (error) {
    console.error('Error creating connection:', error)
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    )
  }
}
