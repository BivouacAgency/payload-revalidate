import { type CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}

export default Authors
