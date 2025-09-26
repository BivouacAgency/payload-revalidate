import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadRevalidate } from 'payload-revalidate'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import Authors from './collections/Authors.js'
import Categories from './collections/Categories.js'
import Media from './collections/Media.js'
import Posts from './collections/Posts.js'
import Series from './collections/Series.js'
import Users from './collections/Users.js'
import { env } from './env.js'
import MainMenu from './globals/MainMenu.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const config = buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Authors, Categories, Media, Posts, Series, Users],
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
    },
    // Only push if database is localhost
    push: env.DATABASE_URI.includes('localhost') || env.DATABASE_URI.includes('127.0.0.1'),
  }),
  editor: lexicalEditor(),
  email: testEmailAdapter,
  globals: [MainMenu],
  onInit: async (payload) => {
    await seed(payload)
  },
  plugins: [
    payloadRevalidate({
      enable: true,
      maxDepth: undefined,
    }),
  ],
  secret: env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export default config
