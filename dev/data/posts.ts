import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache.js'
import { getPayload } from 'payload'

const payload = await getPayload({ config: configPromise })

export const getPostFromSlug = async (slug: string, params: { isDraftMode: boolean }) =>
  unstable_cache(
    async () => {
      const { isDraftMode } = params
      const data = await payload.find({
        collection: 'posts',
        draft: isDraftMode,
        where: isDraftMode
          ? {
              slug: { equals: slug },
            }
          : {
              slug: { equals: slug },
              _status: { equals: 'published' },
            },
      })
      return data.docs[0]
    },
    undefined,
    { tags: ['posts', `posts.${slug}`] },
  )()
