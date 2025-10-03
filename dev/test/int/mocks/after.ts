import { after } from 'next/server.js'
import { vi } from 'vitest'

// Used in setup.ts with vi.mock
export const mockAfter = vi.mocked(after)

export const mockAfterImplementation = async (task: () => Promise<unknown>) => {
  return await task()
}
// @ts-expect-error - TODO: fix this
mockAfter.mockImplementation(mockAfterImplementation)

export const waitForAfterCalls = async () => {
  return await Promise.all(mockAfter.mock.results.map((result) => result.value))
}
