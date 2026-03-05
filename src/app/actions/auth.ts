"use server"

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import { User } from '@/lib/models'

export async function register(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!name || !email || !password) {
    throw new Error('All fields are required')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  await dbConnect

  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    throw new Error('Email already registered')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await User.create({
    name,
    email: email.toLowerCase(),
    hashedPassword,
  })

  redirect('/login')
}
