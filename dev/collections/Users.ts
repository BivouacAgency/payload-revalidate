import { type CollectionConfig } from 'payload'

import { exampleCollectionHook1, exampleCollectionHook2 } from '../hooks/example.js'

const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    useAPIKey: true,
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
  hooks: {
    afterChange: [exampleCollectionHook1, exampleCollectionHook2],
  },
}

export default Users
