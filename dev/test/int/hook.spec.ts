import config from '@payload-config'
import { expect, test } from 'vitest'

import {
  exampleCollectionHook1,
  exampleCollectionHook2,
  exampleGlobalHook1,
  exampleGlobalHook2,
} from '../../hooks/example.js'

test('collection hooks should be called before revalidateCollectionChange hook', async () => {
  // Get the users collection
  const usersCollection = (await config).collections.find((c) => c.slug === 'users')
  expect(usersCollection?.hooks?.afterChange).toBeDefined()

  const collectionHooks = [...(usersCollection?.hooks?.afterChange || [])]

  expect(collectionHooks.length).toBe(3)
  // First and second hooks should be the one defined in the collection config
  expect(collectionHooks[0]).toBe(exampleCollectionHook1)
  expect(collectionHooks[1]).toBe(exampleCollectionHook2)
  // Third hook is necessarily the revalidate hook
})

test('global hooks should be called before revalidateGlobal hook', async () => {
  // Get the mainMenu global
  const mainMenuGlobal = (await config).globals.find((g) => g.slug === 'mainMenu')
  expect(mainMenuGlobal?.hooks?.afterChange).toBeDefined()

  const globalHooks = [...(mainMenuGlobal?.hooks?.afterChange || [])]
  expect(globalHooks.length).toBe(3)
  // First and second hooks should be the one defined in the global config
  expect(globalHooks[0]).toBe(exampleGlobalHook1)
  expect(globalHooks[1]).toBe(exampleGlobalHook2)
  // Third hook is necessarily the revalidate hook
})
