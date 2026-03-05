const connections = new Map<string, Set<ReadableStreamDefaultController>>()

export function subscribe(userId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set())
  }
  connections.get(userId)!.add(controller)
}

export function unsubscribe(userId: string, controller: ReadableStreamDefaultController) {
  const userConnections = connections.get(userId)
  if (userConnections) {
    userConnections.delete(controller)
    if (userConnections.size === 0) {
      connections.delete(userId)
    }
  }
}

export function emitChange(userId: string) {
  const userConnections = connections.get(userId)
  if (userConnections) {
    const encoder = new TextEncoder()
    const data = encoder.encode('data: refresh\n\n')
    userConnections.forEach((controller) => {
      try {
        controller.enqueue(data)
      } catch {
        unsubscribe(userId, controller)
      }
    })
  }
}
