import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

declare global {
  var _mongoosePromise: Promise<typeof mongoose> | undefined
}

let cached = global._mongoosePromise

if (!cached) {
  cached = global._mongoosePromise = mongoose.connect(MONGODB_URI)
}

export default cached
