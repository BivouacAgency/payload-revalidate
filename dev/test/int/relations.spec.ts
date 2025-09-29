import { getAssetsPath } from 'helpers/file.js'
import { beforeAll, expect, test } from 'vitest'

// Import global payload and mock utilities
import { mockRevalidateTag, payload } from '../setup.js'

let mediaId: number

beforeAll(async () => {
  const media = await payload.create({
    collection: 'media',
    data: {
      id: 1,
      alt: 'image',
    },
    filePath: getAssetsPath() + '/placeholder.png',
  })

  mediaId = media.id
})

test('revalidates correctly relations for depth 1', async () => {
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
      image: mediaId,
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

  await payload.delete({
    collection: 'authors',
    where: { name: { equals: 'updated by plugin' } },
  })

  expect(mockRevalidateTag).toHaveBeenCalledTimes(4)
  expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)

  mockRevalidateTag.mockClear()

  await payload.delete({ collection: 'posts', where: { title: { equals: 'added by plugin' } } })

  expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
  expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)
})

test('revalidates correctly relations for depth 2 ', async () => {
  // Create an author first
  const author = await payload.create({
    collection: 'authors',
    data: {
      name: 'authorName',
    },
  })

  // Create a post with the author (depth 1) - without media to avoid upload issues
  const post = await payload.create({
    collection: 'posts',
    data: {
      author: author.id,
      image: mediaId,
      title: 'postTitle',
    },
  })

  // Create a category with the post (depth 0 -> depth 1 -> depth 2)
  const category = await payload.create({
    collection: 'categories',
    data: {
      name: 'categoryName',
      description: 'categoryDescription',
      featuredPost: post.id,
      posts: [post.id],
    },
  })

  mockRevalidateTag.mockClear()

  // Update the author (depth 2) - this should trigger revalidation for:
  // - authors collection and specific author
  // - posts collection and specific post (depth 1)
  // - categories collection and specific category (depth 0)
  await payload.update({
    id: author.id,
    collection: 'authors',
    data: {
      name: 'authorNameUpdated',
    },
  })

  // Verify revalidateTag was called for all related collections in the chain
  expect(mockRevalidateTag).toHaveBeenCalledTimes(6)
  expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('categories')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`categories.${category.id}`)

  mockRevalidateTag.mockClear()

  // Delete the author (depth 2) - this should trigger revalidation for:
  // - authors collection and specific author
  // - posts collection and specific post (depth 1)
  // - categories collection and specific category (depth 0)
  await payload.delete({
    id: author.id,
    collection: 'authors',
  })

  expect(mockRevalidateTag).toHaveBeenCalledTimes(6)
  expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('categories')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`categories.${category.id}`)

  mockRevalidateTag.mockClear()

  await payload.delete({
    id: post.id,
    collection: 'posts',
  })
  await payload.delete({
    id: category.id,
    collection: 'categories',
  })
})

test('revalidates correctly relations for depth 3', async () => {
  // Create an author first (depth 3)
  const author = await payload.create({
    collection: 'authors',
    data: {
      name: 'authorNameDepth3',
    },
  })

  // Create a post with the author (depth 2)
  const post = await payload.create({
    collection: 'posts',
    data: {
      author: author.id,
      image: mediaId,
      title: 'postTitleDepth3',
    },
  })

  // Create a category with the post (depth 1)
  const category = await payload.create({
    collection: 'categories',
    data: {
      name: 'categoryNameDepth3',
      description: 'categoryDescriptionDepth3',
      featuredPost: post.id,
      posts: [post.id],
    },
  })

  // Create a series with the category (depth 0)
  const series = await payload.create({
    collection: 'series',
    data: {
      categories: [category.id],
      description: 'seriesDescriptionDepth3',
      featuredCategory: category.id,
      title: 'seriesTitleDepth3',
    },
  })

  mockRevalidateTag.mockClear()

  // Update the author (depth 3) - this should trigger revalidation for:
  // - authors collection and specific author (depth 3)
  // - posts collection and specific post (depth 2)
  // - categories collection and specific category (depth 1)
  // - series collection and specific series (depth 0)
  await payload.update({
    id: author.id,
    collection: 'authors',
    data: {
      name: 'authorNameDepth3Updated',
    },
  })

  // Verify revalidateTag was called for all related collections in the chain
  expect(mockRevalidateTag).toHaveBeenCalledTimes(8)
  expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('categories')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`categories.${category.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('series')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`series.${series.id}`)

  mockRevalidateTag.mockClear()

  // Delete the author (depth 3) - this should trigger revalidation for:
  // - authors collection and specific author (depth 3)
  // - posts collection and specific post (depth 2)
  // - categories collection and specific category (depth 1)
  // - series collection and specific series (depth 0)
  await payload.delete({
    id: author.id,
    collection: 'authors',
  })

  expect(mockRevalidateTag).toHaveBeenCalledTimes(8)
  expect(mockRevalidateTag).toHaveBeenCalledWith('authors')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`authors.${author.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('posts')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`posts.${post.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('categories')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`categories.${category.id}`)
  expect(mockRevalidateTag).toHaveBeenCalledWith('series')
  expect(mockRevalidateTag).toHaveBeenCalledWith(`series.${series.id}`)

  mockRevalidateTag.mockClear()

  // Clean up remaining entities
  await payload.delete({
    id: post.id,
    collection: 'posts',
  })
  await payload.delete({
    id: category.id,
    collection: 'categories',
  })
  await payload.delete({
    id: series.id,
    collection: 'series',
  })
})
