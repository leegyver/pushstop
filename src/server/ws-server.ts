import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import Redis from 'ioredis'

// Independent HTTP server just for WebSockets
const server = createServer()
const wss = new WebSocketServer({ server })

// We use separate Redis instances for pub and sub
const redisPub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const clients = new Map<string, WebSocket>() // Map of userId to WebSocket

wss.on('connection', (ws, req) => {
  // In a real app, parse cookies from req.headers.cookie to authenticate via JWT
  // For simplicity, we assume client sends an auth message first
  let userId: string | null = null

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      
      if (data.type === 'auth') {
        // Authenticate user
        userId = data.userId
        if (userId) {
          clients.set(userId, ws)
          ws.send(JSON.stringify({ type: 'system', content: 'Connected to chat' }))
        }
      } 
      else if (data.type === 'chat' && userId) {
        // Publish chat message to Redis channel
        const chatPayload = {
          userId,
          nickname: data.nickname, // Usually fetched from DB or Token
          content: data.content,
          timestamp: new Date().toISOString()
        }
        await redisPub.publish('chat:main', JSON.stringify(chatPayload))
        
        // Note: Persisting to DB (Prisma ChatMessage) should be done by an API route 
        // or a background worker consuming a Redis queue, not directly in the WS server 
        // to avoid blocking the fast event loop.
      }
    } catch (error) {
      console.error('WS Message Error:', error)
    }
  })

  ws.on('close', () => {
    if (userId) {
      clients.delete(userId)
    }
  })
})

// Subscribe to the chat channel and broadcast to all connected clients
redisSub.subscribe('chat:main', (err) => {
  if (err) console.error('Redis Subscribe Error:', err)
})

redisSub.on('message', (channel, message) => {
  if (channel === 'chat:main') {
    // Broadcast to all connected clients
    for (const [uid, client] of clients.entries()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'chat',
          data: JSON.parse(message)
        }))
      }
    }
  }
})

const PORT = process.env.WS_PORT || 4001
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`)
})
