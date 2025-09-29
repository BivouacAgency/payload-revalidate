import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import { revalidateCollectionItem, revalidateGlobalItem } from '../lib/revalidation.js'

/**
 * revalidate the page in the background, so the user doesn't have to wait
 * notice that the hook itself is not async and we are not awaiting `revalidate`
 */
export const getRevalidateCollectionDeleteHook = (depth?: number): CollectionAfterDeleteHook => {
  return async (params) => {
    if (process.env.SEED_RUN === 'true') {
      return
    }
    /**
     * TOWONDER : await here is needed, in order to ensure data is
     * correctly invalidaded INSTANTANEOUSLY, and avoid querying
     * old data if we use a cached query directly after modifying
     * the data. However, this could reduces performances a LOT with
     * complex data structures or big data sets.
     * Also fixes the error :
     * "Error: Route /xxxxxx used "revalidateTag xxxxxxx" during render
     * which is unsupported. To ensure revalidation is performed
     * consistently it must always happen outside of renders
     * and cached functions."
     */
    await revalidateCollectionItem({
      ...params,
      depth,
    })
  }
}

/**
 * revalidate the page in the background, so the user doesn't have to wait
 * notice that the hook itself is not async and we are not awaiting `revalidate`
 */
export const getRevalidateCollectionChangeHook = (depth?: number): CollectionAfterChangeHook => {
  return async (params) => {
    if (process.env.SEED_RUN === 'true') {
      return
    }
    if (params.req.query.draft) {
      return
    }
    /**
     * TOWONDER : await here is needed, in order to ensure data is
     * correctly invalidaded INSTANTANEOUSLY, and avoid querying
     * old data if we use a cached query directly after modifying
     * the data. However, this could reduces performances a LOT with
     * complex data structures or big data sets.
     * Also fixes the error :
     * "Error: Route /xxxxxx used "revalidateTag xxxxxxx" during render
     * which is unsupported. To ensure revalidation is performed
     * consistently it must always happen outside of renders
     * and cached functions."
     */
    await revalidateCollectionItem({
      ...params,
      depth,
    })
  }
}

/**
 * revalidate the page in the background, so the user doesn't have to wait
 * notice that the hook itself is not async and we are not awaiting `revalidate`
 * only revalidate existing docs that are published (not drafts)
 * send `revalidatePath`, `collection`, and `slug` to the frontend to use in its revalidate route
 * frameworks may have different ways of doing this, but the idea is the same
 */
export const getRevalidateGlobalHook = (depth?: number): GlobalAfterChangeHook => {
  return (params) => {
    if (process.env.SEED_RUN === 'true') {
      return
    }
    void revalidateGlobalItem({
      ...params,
      depth,
    })
  }
}
