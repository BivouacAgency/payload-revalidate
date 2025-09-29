import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { beforeAll, beforeEach, vi } from 'vitest'

// Global payload instance for all tests
let globalPayload: Payload

// Mock Next.js revalidateTag function globally
vi.mock('next/cache.js', () => ({
  revalidateTag: vi.fn(),
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
  mockRevalidateTag.mockClear()
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
