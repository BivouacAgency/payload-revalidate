import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { after } from 'next/server.js'

import { revalidateCollectionItem, revalidateGlobalItem } from '../lib/revalidation.js'

/**
 * Revalidate all data related to the deleted document.
 * Notice that the hook itself is not async and we are not awaiting `revalidate`.
 */
export const revalidateCollectionDelete: CollectionAfterDeleteHook = (params) => {
  if (process.env.SEED_RUN === 'true') {
    return
  }
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
   * TO WONDER : Result is not awaited, so cache invalidation is not immediate.
   * This can be a problem if we use a cached query directly after modifying
   * the data.
   */
  after(async () => {
    await revalidateCollectionItem(params)
  })
}

/**
 * Revalidate all data related to the updated document.
 * Notice that the hook itself is not async and we are not awaiting `revalidate`.
 * Only revalidate existing docs that are published (not drafts)
 */
export const revalidateCollectionChange: CollectionAfterChangeHook = (params) => {
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
   * TO WONDER : Result is not awaited, so cache invalidation is not immediate.
   * This can be a problem if we use a cached query directly after modifying
   * the data.
   */
  after(async () => {
    await revalidateCollectionItem(params)
  })
}

/**
 * Revalidate all data related to the updated document.
 * Notice that the hook itself is not async and we are not awaiting `revalidate`.
 */
export const revalidateGlobal: GlobalAfterChangeHook = (params) => {
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
   * "after" is used to ensure the revalidation is performed outside of page renders.
   * Because payload can execute collections/globals update during rendering
   * (for example when creating a new document where autosave is activated)
   * This can lead to the following error :
   * "Error: Route /xxxxxx used "revalidateTag xxxxxxx" during render
   * which is unsupported. To ensure revalidation is performed
   * consistently it must always happen outside of renders
   * and cached functions."
   *
   * TO WONDER : Result is not awaited, so cache invalidation is not immediate.
   * This can be a problem if we use a cached query directly after modifying
   * the data.
   */
  after(async () => {
    await revalidateGlobalItem(params)
  })
}
