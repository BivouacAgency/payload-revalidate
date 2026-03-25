import type { CollectionConfig } from 'payload'

/**
 * Self-referencing collection used to test cycle detection in relation tree traversal.
 * A page can reference another page via `relatedPage`, creating a potential infinite loop
 * if cycle detection is broken.
 */
const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'relatedPage',
      type: 'relationship',
      hasMany: false,
      relationTo: 'pages',
    },
  ],
}

export default Pages
