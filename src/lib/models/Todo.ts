import mongoose, { Schema, Document, Types } from 'mongoose'

export type TodoStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface ITodo extends Document {
  title: string
  status: TodoStatus
  priority: TodoPriority
  dueDate?: Date
  order: number
  userId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const TodoSchema = new Schema<ITodo>(
  {
    title: { type: String, required: true },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    dueDate: { type: Date },
    order: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
)

export const Todo = mongoose.models.Todo || mongoose.model<ITodo>('Todo', TodoSchema)
