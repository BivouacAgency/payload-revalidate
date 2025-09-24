import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadRevalidate } from 'payload-revalidate'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import Authors from './collections/Authors.js'
import Media from './collections/Media.js'
import Posts from './collections/Posts.js'
import Users from './collections/Users.js'
import { env } from './env.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  // if (process.env.NODE_ENV === 'test') {
  //   const memoryDB = await MongoMemoryReplSet.create({
  //     replSet: {
  //       count: 3,
  //       dbName: 'payloadmemory',
  //     },
  //   })

  //   process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  // }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Authors, Media, Posts, Users],
    db: postgresAdapter({
      pool: {
        connectionString: env.DATABASE_URI,
      },
      // Only push if database is localhost
      push: env.DATABASE_URI.includes('localhost') || env.DATABASE_URI.includes('127.0.0.1'),
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [payloadRevalidate({})],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
