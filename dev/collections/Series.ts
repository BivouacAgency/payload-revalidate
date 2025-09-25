import type { CollectionConfig } from 'payload'

const Series: CollectionConfig = {
  slug: 'series',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'featuredCategory',
      type: 'relationship',
      hasMany: false,
      relationTo: 'categories',
    },
    {
      name: 'categories',
      type: 'relationship',
      hasMany: true,
      relationTo: 'categories',
    },
  ],
}

export default Series
