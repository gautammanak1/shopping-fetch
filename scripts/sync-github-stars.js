const API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const SYNC_INTERVAL = 1000

async function syncStars() {
  try {
    const response = await fetch(`${API_URL}/api/github/sync-stars`, {
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

syncStars()
setInterval(syncStars, SYNC_INTERVAL)

process.on('SIGINT', () => {
  process.exit(0)
})

process.on('SIGTERM', () => {
  process.exit(0)
})

