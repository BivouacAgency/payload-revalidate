import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

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

afterAll(() => {
  // Clear all mocks after tests
  vi.clearAllMocks()
})

describe('Plugin integration tests', () => {
  test('revalidates correctly', async () => {
    // Clear any previous calls to the mock
    mockRevalidateTag.mockClear()

    let author = await payload.create({
      collection: 'authors',
      data: {
        name: 'added by plugin',
      },
    })

    // Verify revalidateTag was called for author creation
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
    expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
    expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)

    mockRevalidateTag.mockClear()

    const post = await payload.create({
      collection: 'posts',
      data: {
        author: author.id,
        image: {
          id: 1,
          alt: 'image',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          url: 'https://example.com/image.jpg',
        },
        title: 'added by plugin',
      },
      depth: 2,
    })

    if (typeof post.author === 'number' || !post.author?.name) {
      throw new Error('Wrong depth')
    }

    expect(post.author?.name).toBe('added by plugin')

    // Verify revalidateTag was called for post creation
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
    expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
    expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)

    mockRevalidateTag.mockClear()

    author = await payload.update({
      id: author.id,
      collection: 'authors',
      data: {
        name: 'updated by plugin',
      },
    })

    // Verify that revalidateTag was called for related collections
    expect(mockRevalidateTag).toHaveBeenCalledTimes(4)
    expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
    expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)
    expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
    expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)

    mockRevalidateTag.mockClear()

    await payload.delete({ collection: 'authors', where: { name: { equals: 'added by plugin' } } })

    // TODO revalidation on DELETE is not implemented yet

    // expect(mockRevalidateTag).toHaveBeenCalledTimes(4)
    // expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
    // expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)
    // expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
    // expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)

    mockRevalidateTag.mockClear()

    await payload.delete({ collection: 'posts', where: { title: { equals: 'added by plugin' } } })

    // expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
    // expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
    // expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)
  })
})
