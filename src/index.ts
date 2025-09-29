import type { Config } from 'payload'

import {
  getRevalidateCollectionChangeHook,
  getRevalidateCollectionDeleteHook,
  getRevalidateGlobalHook,
} from './hooks/revalidate.js'

export type PayloadRevalidateConfig = {
  defaultDepth?: number
  enable?: boolean
}

export const payloadRevalidate =
  (pluginOptions: PayloadRevalidateConfig) =>
  (config: Config): Config => {
    const { defaultDepth, enable = true } = pluginOptions

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
        collection.hooks.afterChange.push(getRevalidateCollectionChangeHook(defaultDepth))
        collection.hooks.afterDelete.push(getRevalidateCollectionDeleteHook(defaultDepth))
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

        global.hooks.afterChange.push(getRevalidateGlobalHook(defaultDepth))
      }
    }

    return config
  }
