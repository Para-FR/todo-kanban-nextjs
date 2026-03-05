import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IApiKey extends Document {
  keyHash: string
  keyPrefix: string
  userId: Types.ObjectId
  name: string
  lastUsedAt?: Date
  revokedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    keyHash: { type: String, required: true, unique: true, index: true },
    keyPrefix: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    lastUsedAt: { type: Date },
    revokedAt: { type: Date },
  },
  { timestamps: true }
)

export const ApiKey = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', ApiKeySchema)
