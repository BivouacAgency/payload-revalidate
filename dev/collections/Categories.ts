import type { CollectionConfig } from 'payload'

const Categories: CollectionConfig = {
  slug: 'categories',
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'featuredPost',
      type: 'relationship',
      hasMany: false,
      relationTo: 'posts',
    },
    {
      name: 'posts',
      type: 'relationship',
      hasMany: true,
      relationTo: 'posts',
    },
  ],
}

export default Categories
