"use server"

import dbConnect from '@/lib/mongodb'
import { Todo } from '@/lib/models'
import { emitChange } from '@/lib/events'

export async function getTodos(userId: string) {
  await dbConnect
  const todos = await Todo.find({ userId }).sort({ order: 1 }).lean()
  return todos.map((todo) => ({
    _id: todo._id.toString(),
    title: todo.title,
    status: todo.status,
    priority: todo.priority,
    dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
    order: todo.order,
    userId: todo.userId.toString(),
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  }))
}

export async function createTodo(userId: string, data: { title: string; priority?: string; dueDate?: string }) {
  await dbConnect
  const count = await Todo.countDocuments({ userId, status: 'TODO' })
  await Todo.create({
    title: data.title,
    priority: data.priority || 'MEDIUM',
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    status: 'TODO',
    order: count,
    userId,
  })
  emitChange(userId)
}

export async function moveTodo(todoId: string, userId: string, newStatus: string) {
  await dbConnect
  const todo = await Todo.findById(todoId)
  if (!todo || todo.userId.toString() !== userId) return

  const count = await Todo.countDocuments({ userId, status: newStatus })
  todo.status = newStatus
  todo.order = count
  await todo.save()
  emitChange(userId)
}

export async function updateTodo(todoId: string, userId: string, data: Partial<{ title: string; priority: string; dueDate: string }>) {
  await dbConnect
  const todo = await Todo.findById(todoId)
  if (!todo || todo.userId.toString() !== userId) return

  if (data.title !== undefined) todo.title = data.title
  if (data.priority !== undefined) todo.priority = data.priority
  if (data.dueDate !== undefined) todo.dueDate = new Date(data.dueDate)
  await todo.save()
  emitChange(userId)
}

export async function deleteTodo(todoId: string, userId: string) {
  await dbConnect
  const todo = await Todo.findById(todoId)
  if (!todo || todo.userId.toString() !== userId) return

  await Todo.findByIdAndDelete(todoId)
  emitChange(userId)
}
