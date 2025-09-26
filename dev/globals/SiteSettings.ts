import type { GlobalConfig } from 'payload'

const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
    },
    {
      name: 'featuredPost',
      type: 'relationship',
      hasMany: false,
      relationTo: 'posts',
    },
  ],
}

export default SiteSettings
