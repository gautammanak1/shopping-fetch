import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

const SYNC_INTERVAL = 2000
const MAX_SYNCS_PER_CALL = 4

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const sync = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/github/sync-stars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-suppress-logs': 'true',
        },
      })
      await response.json()
    } catch (error) {
    }
  }
  
  await sync()
  
  const triggerNext = async (count: number) => {
    if (count >= MAX_SYNCS_PER_CALL) {
      setTimeout(async () => {
        try {
          await fetch(`${baseUrl}/api/github/sync-stars/self-trigger`, {
            method: 'GET',
            signal: AbortSignal.timeout(9000),
          }).catch(() => {})
        } catch (error) {
        }
      }, SYNC_INTERVAL)
      return
    }
    
    await new Promise(resolve => setTimeout(resolve, SYNC_INTERVAL))
    await sync()
    await triggerNext(count + 1)
  }
  
  triggerNext(1).catch(() => {})
  
  return NextResponse.json({
    success: true,
    interval: `${SYNC_INTERVAL}ms`,
    syncsPerCall: MAX_SYNCS_PER_CALL,
    message: 'Self-triggering sync active'
  })
}
