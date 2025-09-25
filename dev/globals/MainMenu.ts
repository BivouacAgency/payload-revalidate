import type { GlobalConfig } from 'payload'

import { exampleGlobalHook1, exampleGlobalHook2 } from '../hooks/example.js'

const MainMenu: GlobalConfig = {
  slug: 'mainMenu',
  fields: [
    {
      name: 'menu',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [exampleGlobalHook1, exampleGlobalHook2],
  },
}

export default MainMenu
