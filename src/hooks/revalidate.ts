import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { revalidateTag } from 'next/cache.js'
import { after } from 'next/server.js'

import {
  getRevalidationTagsCollectionItem,
  getRevalidationTagsGlobalItem,
} from '../lib/revalidation.js'

/**
 * Revalidate all data related to the deleted document.
 */
export const revalidateCollectionDelete: CollectionAfterDeleteHook = async (params) => {
  if (process.env.SEED_RUN === 'true') {
    return
  }
  /**
   * TO WONDER : tags retrieval is awaited, otherwise if the document update/deletion occurs,
   * all documents with relations to the update/deleted document will "detach" from the doc,
   * therefore we cannot find them to revalidate them correctly.
   */
  const tags = await getRevalidationTagsCollectionItem(params)
  /**
   * "after" is used to ensure the revalidation is performed outside of page renders.
   * Because payload can execute collections/globals update during rendering
   * (for example when creating a new document where autosave is activated)
   * This can lead to the following error :
   * "Error: Route /xxxxxx used "revalidateTag xxxxxxx" during render
   * which is unsupported. To ensure revalidation is performed
   * consistently it must always happen outside of renders
   * and cached functions."
   *
   * TO WONDER : this action is not awaited, so cache invalidation is not really immediate.
   * However, there is no Promises involved, so it probably won't cause race conditions.
   */
  after(() => {
    for (const tag of tags) {
      revalidateTag(tag)
    }
    params.req.payload.logger.info(`Revalidated tags ${tags.join(', ')}`)
  })
}

/**
 * Revalidate all data related to the updated document.
 */
export const revalidateCollectionChange: CollectionAfterChangeHook = async (params) => {
  if (process.env.SEED_RUN === 'true') {
    return
  }
  /**
   * Do not revalidate draft documents.
   */
  if (
    params.req.query.draft ||
    // When creating a new document with autosave activated, the req.query.draf is undefined
    params.data._status === 'draft'
  ) {
    return
  }

  const tags = await getRevalidationTagsCollectionItem(params)
  /**
   * "after" is used to ensure the revalidation is performed outside of page renders.
   * Because payload can execute collections/globals update during rendering
   * (for example when creating a new document where autosave is activated)
   * This can lead to the following error :
   * "Error: Route /xxxxxx used "revalidateTag xxxxxxx" during render
   * which is unsupported. To ensure revalidation is performed
   * consistently it must always happen outside of renders
   * and cached functions."
   *
   * TO WONDER : this action is not awaited, so cache invalidation is not really immediate.
   * However, there is no Promises involved, so it probably won't cause race conditions.
   */
  after(() => {
    for (const tag of tags) {
      revalidateTag(tag)
    }
    params.req.payload.logger.info(`Revalidated tags ${tags.join(', ')}`)
  })
}

/**
 * Revalidate all data related to the updated document.
 * Notice that the hook itself is not async and we are not awaiting `revalidate`.
 */
export const revalidateGlobal: GlobalAfterChangeHook = async (params) => {
  if (process.env.SEED_RUN === 'true') {
    return
  }
  /**
   * Do not revalidate draft documents
   */
  if (params.req.query.draft || params.data._status === 'draft') {
    return
  }
  /**
   * TODO : globals shouldn't need to await tags retrieval,
   * because globals cannot be set in a relation field
   */
  const tags = await getRevalidationTagsGlobalItem(params)
  /**
   * "after" is used to ensure the revalidation is performed outside of page renders.
   * Because payload can execute collections/globals update during rendering
   * (for example when creating a new document where autosave is activated)
   * This can lead to the following error :
   * "Error: Route /xxxxxx used "revalidateTag xxxxxxx" during render
   * which is unsupported. To ensure revalidation is performed
   * consistently it must always happen outside of renders
   * and cached functions."
   *
   * TO WONDER : this action is not awaited, so cache invalidation is not really immediate.
   * However, there is no Promises involved, so it probably won't cause race conditions.
   */
  after(() => {
    for (const tag of tags) {
      revalidateTag(tag)
    }
    params.req.payload.logger.info(`Revalidated tags ${tags.join(', ')}`)
  })
}
