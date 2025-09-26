import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { beforeAll, expect, test, vi } from 'vitest'

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
})

test('revalidates correctly collections on create', async () => {
  const author = await payload.create({
    collection: 'authors',
    data: {
      name: 'authorName',
    },
  })
  expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
  expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)
})

test('revalidates correctly collections on update', async () => {
  const createdAuthor = await payload.create({
    collection: 'authors',
    data: {
      name: 'authorName',
    },
  })
  mockRevalidateTag.mockClear()
  const updatedAuthor = await payload.update({
    id: createdAuthor.id,
    collection: 'authors',
    data: {
      name: 'authorName',
    },
  })
  expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
  expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${updatedAuthor.id}`)
})

test('revalidates correctly collections on delete', async () => {
  const createdAuthor = await payload.create({
    collection: 'authors',
    data: {
      name: 'authorName',
    },
  })
  mockRevalidateTag.mockClear()
  await payload.delete({
    id: createdAuthor.id,
    collection: 'authors',
  })
  expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
  expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${createdAuthor.id}`)
})
