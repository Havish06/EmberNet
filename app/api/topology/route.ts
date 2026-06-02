import { NextRequest, NextResponse } from 'next/server'
import { initializeRedis } from '@/lib/backend/redis-client'
import { getTopology } from '@/lib/backend/node-manager'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    await initializeRedis()

    const topology = await getTopology()

    return NextResponse.json({ success: true, topology })
  } catch (error) {
    console.error('Error getting topology:', error)
    return NextResponse.json(
      { error: 'Failed to get topology' },
      { status: 500 }
    )
  }
}
