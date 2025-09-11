import { type CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  hooks: {
    // TODO check priority between this hook and the revalidation hook
    // Be sure it doesn't make any issues
    afterChange: [
      ({ req }) => {
        req.payload.logger.debug('Authors hook afterChange')
      },
    ],
  },
}

export default Authors
