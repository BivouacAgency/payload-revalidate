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

  type RelationPath = { path: string; relationTo: string[] }

  const isStringArray = (input: unknown): input is string[] =>
    Array.isArray(input) && input.every((v) => typeof v === 'string')

  const isUnknownArray = (input: unknown): input is unknown[] => Array.isArray(input)

  const normalizeRelationTo = (input: unknown): string[] => {
    if (isStringArray(input)) {
      return input
    }
    if (typeof input === 'string') {
      return [input]
    }
    return []
  }

  const collectRelationFieldPaths = (fields: unknown[], prefix = ''): RelationPath[] => {
    const paths: RelationPath[] = []
    for (const rawField of fields ?? []) {
      if (typeof rawField !== 'object' || rawField === null) {
        continue
      }
      const f: Record<string, unknown> = Object.fromEntries(Object.entries(rawField))

      const nameVal = f['name']
      const typeVal = f['type']
      const fieldName = typeof nameVal === 'string' ? nameVal : undefined
      const fieldType = typeof typeVal === 'string' ? typeVal : undefined
      if (!fieldName || !fieldType) {
        continue
      }

      const fieldPath = prefix ? `${prefix}${fieldName}` : fieldName

      if (fieldType === 'relationship' || fieldType === 'upload') {
        paths.push({
          path: fieldPath,
          relationTo: normalizeRelationTo(f['relationTo']),
        })
        continue
      }

      if (fieldType === 'blocks') {
        const blocksVal = f['blocks']
        if (isUnknownArray(blocksVal)) {
          for (const rawBlock of blocksVal) {
            if (typeof rawBlock !== 'object' || rawBlock === null) {
              continue
            }
            const b: Record<string, unknown> = Object.fromEntries(Object.entries(rawBlock))
            const fieldsVal = b['fields']
            const nestedFields = isUnknownArray(fieldsVal) ? fieldsVal : []
            const nested = collectRelationFieldPaths(nestedFields, `${fieldPath}.`)
            paths.push(...nested)
          }
        }
        continue
      }

      if (fieldType === 'array' || fieldType === 'group') {
        const fieldsVal = f['fields']
        const subFields = isUnknownArray(fieldsVal) ? fieldsVal : []
        const nested = collectRelationFieldPaths(subFields, `${fieldPath}.`)
        paths.push(...nested)
        continue
      }
    }
    return paths
  }

  const addRelatedDocTags = (
    collectionSlugToRevalidate: string,
    relatedDocs: Array<{ id: unknown }>,
  ) => {
    if (relatedDocs.length > 0) {
      tagsToRevalidate.add(collectionSlugToRevalidate)
    }
    for (const relatedDocument of relatedDocs) {
      const id = relatedDocument?.id
      if (typeof id === 'string' || typeof id === 'number') {
        tagsToRevalidate.add(`${collectionSlugToRevalidate}.${id}`)
      }
    }
  }

  for (const configCollection of config.collections) {
    if (INTERNAL_COLLECTIONS.includes(configCollection.slug)) {
      continue
    }

    const relationFields = collectRelationFieldPaths(configCollection.fields)

    for (const relationField of relationFields) {
      if (!relationField.relationTo.includes(collectionSlug)) {
        continue
      }
      try {
        const relatedDocuments = await payload.find({
          collection: configCollection.slug,
          limit: 10000,
          where: { [relationField.path]: { equals: doc.id } },
        })

        addRelatedDocTags(configCollection.slug, relatedDocuments.docs)
      } catch (e) {
        console.error('Error during deep revalidation', {
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

  console.info(`Revalidated tags ${Array.from(tagsToRevalidate).join(', ')}`)
}

export interface RevalidateGlobalParams<T extends TypeWithID = TypeWithID> {
  context: RequestContext
  doc: T
  global: SanitizedGlobalConfig
  req: PayloadRequest
}

export const revalidateGlobalItem = (params: RevalidateGlobalParams): void => {
  // TODO : handle relations revalidation, like it's done in revalidateCollectionItem

  const { global } = params
  const globalSlug = global?.slug

  revalidateTag(globalSlug)

  console.info(`Revalidated tag `, globalSlug)
}
