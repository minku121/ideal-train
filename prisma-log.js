// Simple logging to check Prisma client
const { PrismaClient } = require('@prisma/client')

console.log('Starting Prisma test...')

// Check if PrismaClient is loaded
console.log('PrismaClient loaded:', typeof PrismaClient === 'function')

try {
  // Create client instance
  const prisma = new PrismaClient()
  console.log('Created Prisma client')

  // Log all top-level properties
  console.log('Properties on prisma:')
  Object.keys(prisma).forEach(key => {
    console.log(`- ${key}`)
  })

  // Log specifically for our models
  console.log('orderScreenshot exists:', Boolean(prisma.orderScreenshot))
  console.log('order exists:', Boolean(prisma.order))
  console.log('brand exists:', Boolean(prisma.brand))
} catch (error) {
  console.error('Error in test:', error)
} 