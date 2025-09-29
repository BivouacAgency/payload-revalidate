import { revalidateTag } from 'next/cache.js'
import {
  type PayloadRequest,
  type RequestContext,
  type SanitizedCollectionConfig,
  type SanitizedGlobalConfig,
  type TypeWithID,
} from 'payload'
import { z } from 'zod'

import { buildRelationTree } from './config-parser.js'
import { get } from './object-utils.js'

export interface RevalidateCollectionParams<T extends TypeWithID = TypeWithID> {
  /** The collection which this hook is being run on */
  collection: SanitizedCollectionConfig
  context: RequestContext
  depth?: number
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

  const { collection, depth, doc } = params
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
    depth,
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
  depth?: number
  doc: T
  global: SanitizedGlobalConfig
  req: PayloadRequest
}

export const revalidateGlobalItem = async (params: RevalidateGlobalParams): Promise<void> => {
  const payload = params.req.payload

  // Use a set to avoid duplicate tags and improve readability
  const tagsToRevalidate = new Set<string>()

  const { depth: defaultDepth, doc, global } = params
  const globalSlug = global?.slug

  tagsToRevalidate.add(globalSlug)

  // Find all collections which have a relation to this global, and revalidate them as well
  // Recursively handle relations nested inside containers like "blocks", "array", and "group".
  const relationTags = await getTagsFromRelations({
    context: 'global',
    depth: defaultDepth,
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
  depth?: number
  docId: number | string
  modifiedSlug: string
  payload: PayloadRequest['payload']
}): Promise<Set<string>> => {
  const { context, depth, docId, modifiedSlug, payload } = params
  const config = payload.config
  const tagsToRevalidate = new Set<string>()

  // Get relation trees for all collections and globals at once
  const allRelationTrees = buildRelationTree(config, depth)

  // Handle collections
  for (const configCollection of config.collections) {
    const relationFields = allRelationTrees.collections[configCollection.slug] || []

    for (const relationField of relationFields) {
      const isRelationToModifiedItem = relationField.relationTo.includes(modifiedSlug)
      if (!isRelationToModifiedItem) {
        continue
      }
      try {
        const relatedDocuments = await payload.find({
          collection: configCollection.slug,
          // TODO solve this "limit" issue
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
        payload.logger.error(
          {
            configCollectionSlug: configCollection.slug,
            context,
            error: e,
            modifiedSlug,
            relationFieldPath: relationField.path,
          },
          'Error during deep revalidation',
        )
      }
    }
  }

  // Handle globals
  for (const configGlobal of config.globals || []) {
    const relationFields = allRelationTrees.globals[configGlobal.slug] || []

    for (const relationField of relationFields) {
      const isRelationToModifiedItem = relationField.relationTo.includes(modifiedSlug)
      if (!isRelationToModifiedItem) {
        continue
      }
      try {
        // For globals, we need to check if the global value has the relation
        const globalValue = await payload.findGlobal({
          slug: configGlobal.slug,
        })

        // Check if the global has the relation field pointing to the modified item
        // Use get() to handle nested paths like "featuredPost.author"
        if (globalValue && get(globalValue, relationField.path + '.id') === docId) {
          tagsToRevalidate.add(configGlobal.slug)
        }
      } catch (e) {
        payload.logger.error(
          {
            configGlobalSlug: configGlobal.slug,
            context,
            error: e,
            modifiedSlug,
            relationFieldPath: relationField.path,
          },
          'Error during deep revalidation for global',
        )
      }
    }
  }

  return tagsToRevalidate
}
