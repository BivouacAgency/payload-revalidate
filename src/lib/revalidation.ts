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

import { buildRelationTree } from './config-parser.js'

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
  const relationTags = await getTagsFromRelations({
    context: 'collection',
    docId: doc.id,
    modifiedSlug: collectionSlug,
    payload,
  })

  // Merge relation tags with existing tags
  for (const tag of relationTags) {
    tagsToRevalidate.add(tag)
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

export const revalidateGlobalItem = async (params: RevalidateGlobalParams): Promise<void> => {
  const payload = params.req.payload

  // Use a set to avoid duplicate tags and improve readability
  const tagsToRevalidate = new Set<string>()

  const { doc, global } = params
  const globalSlug = global?.slug

  tagsToRevalidate.add(globalSlug)

  // Find all collections which have a relation to this global, and revalidate them as well
  // Recursively handle relations nested inside containers like "blocks", "array", and "group".
  const relationTags = await getTagsFromRelations({
    context: 'global',
    docId: doc.id,
    modifiedSlug: globalSlug,
    payload,
  })

  // Merge relation tags with existing tags
  for (const tag of relationTags) {
    tagsToRevalidate.add(tag)
  }

  for (const tag of Array.from(tagsToRevalidate)) {
    revalidateTag(tag)
  }

  payload.logger.info(`Revalidated tags ${Array.from(tagsToRevalidate).join(', ')}`)
}

/**
 * Get revalidation tags for relations to a modified item (collection or global)
 */
const getTagsFromRelations = async (params: {
  context: 'collection' | 'global'
  docId: number | string
  modifiedSlug: string
  payload: PayloadRequest['payload']
}): Promise<Set<string>> => {
  const { context, docId, modifiedSlug, payload } = params
  const config = payload.config
  const tagsToRevalidate = new Set<string>()

  for (const configCollection of config.collections) {
    if (INTERNAL_COLLECTIONS.includes(configCollection.slug)) {
      continue
    }

    const relationFields = buildRelationTree(configCollection.slug, config)

    for (const relationField of relationFields) {
      const isRelationToModifiedItem = relationField.relationTo.includes(modifiedSlug)
      if (!isRelationToModifiedItem) {
        continue
      }
      try {
        const relatedDocuments = await payload.find({
          collection: configCollection.slug,
          limit: 10000,
          where: { [relationField.path]: { equals: docId } },
        })

        // Add tags for related documents that reference the modified item
        if (relatedDocuments.docs.length > 0) {
          tagsToRevalidate.add(configCollection.slug)
        }
        for (const relatedDocument of relatedDocuments.docs) {
          const id = relatedDocument?.id
          tagsToRevalidate.add(`${configCollection.slug}.${id}`)
        }
      } catch (e) {
        payload.logger.error('Error during deep revalidation', {
          configCollectionSlug: configCollection.slug,
          context,
          error: e,
          modifiedSlug,
          relationFieldPath: relationField.path,
        })
      }
    }
  }

  return tagsToRevalidate
}
