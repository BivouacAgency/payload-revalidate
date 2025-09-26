# payload-revalidate

A Payload CMS plugin that integrates with Next.js's `next/cache` architecture for better performance and revalidation. This plugin helps keep your database sleeping for basic websites and webapps by leveraging Next.js caching capabilities.

## What it does

This plugin automatically revalidates Payload data with Next.js's `revalidateTag` function using a standard pattern:

- `collection-slug` - for collection-level revalidation
- `collection-slug:item-id` - for specific item revalidation by ID
- `collection-slug:item-slug` - for specific item revalidation by slug

This allows you to easily create a data layer in Next.js server code with `unstable_cache`:

```ts
export const getEventById = async (id) =>
  unstable_cache(
    async (id: number) =>
      await payload.findByID({
        collection: 'events',
        id: id,
      }),
    ['eventById'],
    { tags: [`events.${id}`] },
  )(id)
```

## Installation

```bash
npm install payload-revalidate
```

## Usage

Add the plugin to your Payload configuration:

```ts
import { payloadRevalidate } from 'payload-revalidate'

export const config = buildConfig({
  plugins: [
    payloadRevalidate({
      // Plugin options here
    }),
  ],
})
```

## Current Status

⚠️ **VERY early stage** - This is currently a proof of concept.

- 📦 Available on npm: `npm install payload-revalidate`
- 🔗 GitHub: [BivouacAgency/payload-revalidate](https://github.com/BivouacAgency/payload-revalidate)
- ⚠️ Some warnings may be present
- 💿 Only tested with PostgreSQL. The behaviour seem to differ with other databases.

## Compatibility

- Payload CMS 3.x
- Next.js 15+

## Contributing

This is an early-stage project and feedback is welcome! We'd love to:

- Get feedback on the approach
- Discuss best practices for Payload + Next.js caching
- Learn from the community's experience
- Potentially collaborate on making this more robust

## License

MIT

## Questions

Please open an issue on GitHub for any questions or feedback about this plugin.
