"use server"

import crypto from 'crypto'
import dbConnect from '@/lib/mongodb'
import { ApiKey } from '@/lib/models'
import { auth } from '@/lib/auth'

export async function createApiKey(name: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await dbConnect

  const rawKey = `todo_sk_${crypto.randomBytes(32).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.substring(0, 12)

  await ApiKey.create({
    keyHash,
    keyPrefix,
    userId: session.user.id,
    name,
  })

  return { key: rawKey, prefix: keyPrefix }
}

export async function listApiKeys() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await dbConnect

  const keys = await ApiKey.find({ userId: session.user.id })
    .select('-keyHash')
    .sort({ createdAt: -1 })
    .lean()

  return keys.map((key) => ({
    _id: key._id.toString(),
    keyPrefix: key.keyPrefix,
    name: key.name,
    lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
    revokedAt: key.revokedAt ? key.revokedAt.toISOString() : null,
    createdAt: key.createdAt.toISOString(),
  }))
}

export async function revokeApiKey(keyId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await dbConnect

  const key = await ApiKey.findById(keyId)
  if (!key || key.userId.toString() !== session.user.id) throw new Error('Not found')

  key.revokedAt = new Date()
  await key.save()
}
