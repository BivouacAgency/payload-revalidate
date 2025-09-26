import { beforeAll, expect, test } from 'vitest'

// Import global payload and mock utilities
import { mockRevalidateTag, payload } from '../setup.js'

// Initialize global data
beforeAll(async () => {
  await payload.updateGlobal({
    slug: 'mainMenu',
    data: {
      menu: [{ label: 'mainMenuName1' }],
    },
  })
})

test('revalidates correctly globals on update', async () => {
  await payload.updateGlobal({
    slug: 'mainMenu',
    data: {
      menu: [{ label: 'mainMenuName1' }, { label: 'mainMenuName2' }],
    },
  })
  expect(mockRevalidateTag).toHaveBeenCalledTimes(1)
  expect(mockRevalidateTag).toHaveBeenCalledWith('mainMenu')
})
