import { auth } from '@/lib/auth'
import { subscribe, unsubscribe } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const encoder = new TextEncoder()
  let heartbeatInterval: NodeJS.Timeout
  let controllerRef: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
      subscribe(userId, controller)

      controller.enqueue(encoder.encode('data: connected\n\n'))

      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeatInterval)
          unsubscribe(userId, controller)
        }
      }, 30000)
    },
    cancel() {
      clearInterval(heartbeatInterval)
      unsubscribe(userId, controllerRef)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
