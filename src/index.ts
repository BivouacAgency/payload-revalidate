import type { Config } from 'payload'

import {
  revalidateCollectionChange,
  revalidateCollectionDelete,
  revalidateGlobal,
} from './hooks/revalidate.js'

export type PayloadRevalidateConfig = {
  enable?: boolean
  /**
   * Maximum depth of relations to follow
   * If undefined, will follow all relations
   */
  maxDepth?: number
}

export const payloadRevalidate =
  (pluginOptions: PayloadRevalidateConfig) =>
  (config: Config): Config => {
    const { enable = true } = pluginOptions

    if (!enable) {
      return config
    }

    if (config.collections) {
      for (const collection of config.collections) {
        if (!collection.hooks) {
          collection.hooks = {}
        }
        if (!collection.hooks?.afterChange) {
          collection.hooks.afterChange = []
        }
        if (!collection.hooks?.afterDelete) {
          collection.hooks.afterDelete = []
        }
        // Revalidation hooks should be trigger at the end of the hooks chain
        collection.hooks.afterChange.push(revalidateCollectionChange)
        collection.hooks.afterDelete.push(revalidateCollectionDelete)
      }
    }

    if (config.globals) {
      for (const global of config.globals) {
        if (!global.hooks) {
          global.hooks = {}
        }
        if (!global.hooks?.afterChange) {
          global.hooks.afterChange = []
        }

        global.hooks.afterChange.push(revalidateGlobal)
      }
    }

    return config
  }
