import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { afterEach, beforeAll, beforeEach, vi } from 'vitest'

import { mockAfter, waitForAfterCalls } from './int/mocks/after.js'

// Global payload instance for all tests
let globalPayload: Payload

// Mock Next.js revalidateTag function globally
vi.mock('next/cache.js', () => ({
  revalidateTag: vi.fn(),
}))

// Mock Next.js after function globally
// export const mockAfter = vi.fn((task: Promise<unknown>) => task)
vi.mock('next/server.js', () => ({
  after: vi.fn(),
}))

// Import the mocked function for global access
import { revalidateTag } from 'next/cache.js'
const mockRevalidateTag = vi.mocked(revalidateTag)

// Initialize payload once for all tests
beforeAll(async () => {
  globalPayload = await getPayload({ config })
})

beforeEach(async () => {
  // Reinit all globals to avoid issues
  await globalPayload.updateGlobal({
    slug: 'mainMenu',
    data: {
      menu: [{ label: 'mainMenuName1' }],
    },
  })
  await globalPayload.updateGlobal({
    slug: 'siteSettings',
    data: {
      siteName: 'Test Site',
    },
  })

  // Clear mocks before each test
  await waitForAfterCalls()
  mockRevalidateTag.mockClear()
  mockAfter.mockClear()
})

afterEach(async () => {
  await waitForAfterCalls()
  mockRevalidateTag.mockClear()
  mockAfter.mockClear()
})

// Export a getter function to access the global payload
export const getGlobalPayload = (): Payload => {
  if (!globalPayload) {
    throw new Error('Payload not initialized. Make sure beforeAll has run.')
  }
  return globalPayload
}

// Export the payload directly for convenience
export { globalPayload as payload }

// Export mock utilities for easy testing
export { mockRevalidateTag, revalidateTag }
