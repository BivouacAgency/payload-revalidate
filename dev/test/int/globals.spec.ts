import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { beforeAll, beforeEach, expect, test, vi } from 'vitest'

// Mock Next.js revalidateTag function
vi.mock('next/cache.js', () => ({
  revalidateTag: vi.fn(),
}))

// Import the mocked function for assertions
import { revalidateTag } from 'next/cache.js'
const mockRevalidateTag = vi.mocked(revalidateTag)

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
  await payload.updateGlobal({
    slug: 'mainMenu',
    data: {
      menu: [{ label: 'mainMenuName1' }],
    },
  })
})

beforeEach(() => {
  mockRevalidateTag.mockClear()
})

test('revalidates correctly globals on update', async () => {
  await payload.updateGlobal({
    slug: 'mainMenu',
    data: {
      menu: [{ label: 'mainMenuName1' }, { label: 'mainMenuName2' }],
    },
  })
  expect(mockRevalidateTag).toHaveBeenCalledTimes(1)
  expect(mockRevalidateTag).toHaveBeenCalledWith('mainMenu')
})
