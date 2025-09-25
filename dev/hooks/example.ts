import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

/**
 * Used to test the hook system
 */
export const exampleCollectionHook1: CollectionAfterChangeHook = ({ req }) => {
  req.payload.logger.debug('Example 1 hook afterChange')
}

export const exampleCollectionHook2: CollectionAfterChangeHook = ({ req }) => {
  req.payload.logger.debug('Example 2 hook afterChange')
}

export const exampleGlobalHook1: GlobalAfterChangeHook = ({ req }) => {
  req.payload.logger.debug('Example 1 hook afterChange')
}

export const exampleGlobalHook2: GlobalAfterChangeHook = ({ req }) => {
  req.payload.logger.debug('Example 2 hook afterChange')
}
