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

import { collectRelationFieldPaths } from './config-parser.js'

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

/**
 * TODO : this is a new version, which seem to handle relations AND blocks, but not heavily tested
 */
export const revalidateCollectionItem = async (
  params: RevalidateCollectionParams,
): Promise<void> => {
  const payload = params.req.payload

  // Use a set to avoid duplicate tags and improve readability
  const tagsToRevalidate = new Set<string>()

  const { collection, doc } = params
  const collectionSlug = collection?.slug

  tagsToRevalidate.add(collectionSlug)

  const parsedDoc = z
    .object({ id: z.number().optional(), slug: z.string().optional() })
    .safeParse(doc)

  if (parsedDoc.success) {
    if (parsedDoc.data.id) {
      tagsToRevalidate.add(`${collectionSlug}.${parsedDoc.data.id}`)
    }
    if (parsedDoc.data.slug) {
      tagsToRevalidate.add(`${collectionSlug}.${parsedDoc.data.slug}`)
    }
  }

  // Find all collections which have a relation to this item, and revalidate them as well
  // Recursively handle relations nested inside containers like "blocks", "array", and "group".
  const config = payload.config

  for (const configCollection of config.collections) {
    if (INTERNAL_COLLECTIONS.includes(configCollection.slug)) {
      continue
    }

    const relationFields = collectRelationFieldPaths(configCollection.fields)

    for (const relationField of relationFields) {
      const isRelationToModifiedCollection = relationField.relationTo.includes(collectionSlug)
      if (!isRelationToModifiedCollection) {
        continue
      }
      try {
        const relatedDocuments = await payload.find({
          collection: configCollection.slug,
          limit: 10000,
          where: { [relationField.path]: { equals: doc.id } },
        })

        // Add tags for related documents that reference the modified item
        if (relatedDocuments.docs.length > 0) {
          tagsToRevalidate.add(configCollection.slug)
        }
        for (const relatedDocument of relatedDocuments.docs) {
          const id = relatedDocument?.id
          if (typeof id === 'string' || typeof id === 'number') {
            tagsToRevalidate.add(`${configCollection.slug}.${id}`)
          }
        }
      } catch (e) {
        payload.logger.error('Error during deep revalidation', {
          configCollectionSlug: configCollection.slug,
          docCollectionSlug: collectionSlug,
          error: e,
          relationFieldPath: relationField.path,
        })
      }
    }
  }

  for (const tag of Array.from(tagsToRevalidate)) {
    revalidateTag(tag)
  }

  payload.logger.info(`Revalidated tags ${Array.from(tagsToRevalidate).join(', ')}`)
}

export interface RevalidateGlobalParams<T extends TypeWithID = TypeWithID> {
  context: RequestContext
  doc: T
  global: SanitizedGlobalConfig
  req: PayloadRequest
}

export const revalidateGlobalItem = (params: RevalidateGlobalParams): void => {
  // TODO : handle relations revalidation, like it's done in revalidateCollectionItem
  const payload = params.req.payload

  const { global } = params
  const globalSlug = global?.slug

  revalidateTag(globalSlug)

  payload.logger.info(`Revalidated tag `, globalSlug)
}
