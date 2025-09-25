import type { Field, SanitizedConfig } from 'payload'

export type RelationPath = {
  collectionSlug: string
  depth: number
  path: string
  relationTo: string[]
}

export type CollectionFieldCache = Map<string, Field[]>

const isStringArray = (input: unknown): input is string[] =>
  Array.isArray(input) && input.every((v) => typeof v === 'string')

const normalizeRelationTo = (input: unknown): string[] => {
  if (isStringArray(input)) {
    return input
  }
  if (typeof input === 'string') {
    return [input]
  }
  return []
}

/**
 * Recursively extracts relation field paths from a collection's field configuration.
 *
 * This function traverses through field configurations to find all fields that can contain
 * relationships (relationship, upload, blocks, array, group) and builds a flat list of
 * relation paths with their target collections.
 *
 * @param fields - Array of field configurations to process
 * @param prefix - Current path prefix for nested fields (e.g., "author." for nested relations)
 * @param depth - Current depth level for nested relationships
 * @param collectionSlug - Current collection slug
 * @returns Array of relation paths with their target collections
 */
export const extractRelationFieldPaths = (
  fields: Field[],
  prefix = '',
  depth = 0,
  collectionSlug = '',
): RelationPath[] => {
  const relationPaths: RelationPath[] = []

  // Process each field in the configuration
  for (const fieldConfig of fields ?? []) {
    if (!('name' in fieldConfig)) {
      // TODO log a warning, how can a field not have a name?
      continue
    }

    // Extract and validate field name and type
    const fieldName = fieldConfig.name
    const fieldType = fieldConfig.type

    // Build the full field path (e.g., "author.profile" for nested fields)
    const fullFieldPath = prefix ? `${prefix}.${fieldName}` : fieldName

    // Handle different field types using switch statement
    switch (fieldType) {
      case 'array':
      case 'group': {
        // Handle array and group field types - contain nested fields
        const nestedFields = fieldConfig.fields

        // Recursively extract relation paths from nested fields
        const nestedRelationPaths = extractRelationFieldPaths(
          nestedFields,
          `${fullFieldPath}`,
          depth,
          collectionSlug,
        )
        relationPaths.push(...nestedRelationPaths)
        break
      }

      case 'blocks': {
        // Handle blocks field type - contains multiple block configurations
        const blocksConfig = fieldConfig.blocks
        // Process each block configuration
        for (const blockConfig of blocksConfig) {
          if (typeof blockConfig !== 'object' || blockConfig === null) {
            continue
          }

          // Extract fields from this block
          const blockFields = blockConfig.fields

          // Recursively extract relation paths from block fields
          const blockRelationPaths = extractRelationFieldPaths(
            blockFields,
            `${fullFieldPath}`,
            depth,
            collectionSlug,
          )
          relationPaths.push(...blockRelationPaths)
        }
        break
      }

      case 'join': {
        // TODO: handle join fields
        break
      }
      case 'relationship':
      case 'upload': {
        // Handle direct relation fields (relationship and upload types)
        relationPaths.push({
          collectionSlug,
          depth,
          path: fullFieldPath,
          relationTo: normalizeRelationTo(fieldConfig.relationTo),
        })
        break
      }
      default:
        // Skip field types that don't contain relations
        break
    }
  }

  return relationPaths
}

/**
 * Recursively builds a complete relation tree by traversing nested relationships.
 * This function extracts all relation field paths from a collection and recursively
 * traverses into related collections to build a comprehensive tree of relationships.
 *
 * @param collectionSlug - The slug of the collection to process
 * @param config - The full Payload configuration
 * @param maxDepth - Maximum depth to traverse (default: 3, set to 0 for unlimited)
 * @param visitedCollections - Set of already visited collections to prevent circular references
 * @param currentDepth - Current depth level
 * @returns Array of all relation paths including nested ones
 */
export const buildRelationTree = (
  collectionSlug: string,
  config: SanitizedConfig,
  maxDepth: number = 3,
  visitedCollections: Set<string> = new Set(),
  currentDepth: number = 0,
): RelationPath[] => {
  const allRelationPaths: RelationPath[] = []

  // Find the collection configuration
  const collectionConfig = config.collections?.find((col) => col.slug === collectionSlug)
  if (!collectionConfig) {
    throw new Error(`Collection ${collectionSlug} not found in config`)
  }

  // Prevent infinite recursion and respect max depth
  if (visitedCollections.has(collectionSlug) || (maxDepth > 0 && currentDepth >= maxDepth)) {
    return allRelationPaths
  }

  // Mark this collection as visited
  visitedCollections.add(collectionSlug)

  // Extract relation paths from current collection
  const currentRelationPaths = extractRelationFieldPaths(
    collectionConfig.fields,
    '',
    currentDepth,
    collectionSlug,
  )
  allRelationPaths.push(...currentRelationPaths)

  // For each relationship field, recursively collect paths from related collections
  for (const relationPath of currentRelationPaths) {
    for (const relatedCollectionSlug of relationPath.relationTo) {
      // Create a new visited set for this branch to allow different paths to the same collection
      const branchVisitedCollections = new Set(visitedCollections)
      branchVisitedCollections.delete(collectionSlug) // Allow revisiting the current collection from different paths

      const nestedRelationPaths = buildRelationTree(
        relatedCollectionSlug,
        config,
        maxDepth,
        branchVisitedCollections,
        currentDepth + 1,
      )

      // Update the paths to include the current relationship path as prefix
      const prefixedNestedPaths = nestedRelationPaths.map((nestedPath) => ({
        ...nestedPath,
        depth: nestedPath.depth,
        path: `${relationPath.path}.${nestedPath.path}`,
      }))

      allRelationPaths.push(...prefixedNestedPaths)
    }
  }

  return allRelationPaths
}

/**
 * Example usage:
 *
 * ```typescript
 * import { buildRelationTree } from './config-parser'
 *
 * // Assuming you have your Payload config
 * const relationTree = buildRelationTree(
 *   'categories',
 *   config,
 *   3 // max depth
 * )
 *
 * // This will return paths like:
 * [
 *   { collectionSlug: "categories", depth: 0, path: "featuredPost", relationTo: ["posts"] },
 *   { collectionSlug: "categories", depth: 0, path: "posts", relationTo: ["posts"] },
 *   { collectionSlug: "posts", depth: 1, path: "featuredPost.author", relationTo: ["authors"] },
 *   { collectionSlug: "posts", depth: 1, path: "featuredPost.image", relationTo: ["media"] },
 *   { collectionSlug: "posts", depth: 1, path: "posts.author", relationTo: ["authors"] },
 *   { collectionSlug: "posts", depth: 1, path: "posts.image", relationTo: ["media"] },
 * ]
 * ```
 */
