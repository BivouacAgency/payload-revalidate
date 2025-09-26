import { expect, test } from 'vitest'

// Import global payload and mock utilities
import { mockRevalidateTag, payload } from '../setup.js'

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
