import type { Field } from 'payload'

export type RelationPath = { path: string; relationTo: string[] }

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
 * Recursively collects all relation field paths from a collection's field configuration.
 *
 * This function traverses through field configurations to find all fields that can contain
 * relationships (relationship, upload, blocks, array, group) and builds a flat list of
 * relation paths with their target collections.
 *
 * @param fields - Array of field configurations to process
 * @param prefix - Current path prefix for nested fields (e.g., "author." for nested relations)
 * @returns Array of relation paths with their target collections
 */
export const collectRelationFieldPaths = (fields: Field[], prefix = ''): RelationPath[] => {
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

        // Recursively collect relation paths from nested fields
        const nestedRelationPaths = collectRelationFieldPaths(nestedFields, `${fullFieldPath}`)
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

          // Recursively collect relation paths from block fields
          const blockRelationPaths = collectRelationFieldPaths(blockFields, `${fullFieldPath}`)
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
