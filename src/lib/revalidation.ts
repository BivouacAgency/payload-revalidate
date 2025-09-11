'use server'
import { revalidateTag } from 'next/cache.js'
import {
  type CollectionSlug,
  type PayloadRequest,
  type RequestContext,
  type SanitizedCollectionConfig,
  type SanitizedGlobalConfig,
  type TypeWithID,
} from 'payload'
import { z } from 'zod'

const INTERNAL_COLLECTIONS: CollectionSlug[] = [
  'payload-locked-documents',
  'payload-migrations',
  'payload-preferences',
]

export interface RevalidateCollectionParams<T extends TypeWithID = TypeWithID> {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  doc: T
  req: PayloadRequest
}

export const revalidateCollectionItem = async (
  params: RevalidateCollectionParams,
): Promise<void> => {
  const payload = params.req.payload

  const tagsToRevalidate: string[] = []

  const { collection, doc } = params
  const collectionSlug = collection?.slug

  tagsToRevalidate.push(collectionSlug)

  const parsedDoc = z
    .object({ id: z.number().optional(), slug: z.string().optional() })
    .safeParse(doc)

  if (parsedDoc.success) {
    if (parsedDoc.data.id) {
      tagsToRevalidate.push(`${collectionSlug}.${parsedDoc.data.id}`)
    }
    if (parsedDoc.data.slug) {
      tagsToRevalidate.push(`${collectionSlug}.${parsedDoc.data.slug}`)
    }
  }

  // Find all collections or globals which have a relation to this item, and revalidate them as well
  // This implementation does not handle nested relations fields
  const config = payload.config
  for (const configCollection of config.collections) {
    // Some internal collections don't need to be revalidated, as they are never used in the frontend
    if (INTERNAL_COLLECTIONS.includes(configCollection.slug)) {
      continue
    }
    for (const configCollectionField of configCollection.fields) {
      if (
        configCollectionField.type === 'relationship' ||
        configCollectionField.type === 'upload'
      ) {
        // "relationTo" can be a string or an array of strings
        let isRelationToCurrentItem = false
        if (Array.isArray(configCollectionField.relationTo)) {
          if (configCollectionField.relationTo.includes(collectionSlug)) {
            isRelationToCurrentItem = true
          }
        } else if (configCollectionField.relationTo === collectionSlug) {
          isRelationToCurrentItem = true
        }
        if (isRelationToCurrentItem) {
          try {
            const relatedDocuments = await payload.find({
              collection: configCollection.slug,
              // TODO does not work for one-to-many relationships
              where: { [configCollectionField.name]: { equals: doc.id } },
              // TODO no pagination handled for now
              limit: 10000,
            })
            const atLeastOneRelatedDocument = relatedDocuments.docs.length > 0
            if (atLeastOneRelatedDocument) {
              tagsToRevalidate.push(configCollection.slug)
            }
            for (const relatedDocument of relatedDocuments.docs) {
              tagsToRevalidate.push(`${configCollection.slug}.${relatedDocument.id}`)
            }
          } catch (e) {
            console.error('Error during deep revalidation', {
              configCollectionSlug: configCollection.slug,
              docCollectionSlug: collectionSlug,
              error: e,
            })
          }
        }
      }
    }
  }

  for (const tag of tagsToRevalidate) {
    revalidateTag(tag)
  }

  console.info(`Revalidated tags ${tagsToRevalidate.join(', ')}`)
}

export interface RevalidateGlobalParams<T extends TypeWithID = TypeWithID> {
  context: RequestContext
  doc: T
  global: SanitizedGlobalConfig
  req: PayloadRequest
}

// eslint-disable-next-line @typescript-eslint/require-await
export const revalidateGlobalItem = async (params: RevalidateGlobalParams): Promise<void> => {
  // TODO : handle relations revalidation, like it's done in revalidateCollectionItem

  const { global } = params
  const globalSlug = global?.slug

  revalidateTag(globalSlug)

  console.info(`Revalidated tag `, globalSlug)
}
