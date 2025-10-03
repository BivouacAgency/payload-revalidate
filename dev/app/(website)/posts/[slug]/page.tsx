import { RichText } from '@payloadcms/richtext-lexical/react'
import { RefreshRouteOnSave } from 'components/RefreshRouteOnSave.js'
import { getPostFromSlug } from 'data/posts.js'
import { draftMode } from 'next/headers.js'
import { notFound } from 'next/navigation.js'

import './styles.scss'

export default async function PostsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { isEnabled: isDraftMode } = await draftMode()

  const post = await getPostFromSlug(slug, { isDraftMode })

  if (!post) {
    notFound()
  }

  const author = typeof post.author === 'object' ? post.author : null
  const image = typeof post.image === 'object' ? post.image : null

  return (
    <>
      <RefreshRouteOnSave />
      <article className="post-page">
        <header className="post-header">
          <div className="post-title-row">
            <h1 className="post-title">{post.title || 'Untitled Post'}</h1>
            <a
              className="edit-button"
              href={`/admin/collections/posts/${post.id}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Edit Article
            </a>
          </div>

          <div className="post-meta">
            {author && <span className="post-author">By {author.name}</span>}
            <time className="post-date" dateTime={post.createdAt}>
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>
        </header>

        {image && image.url && (
          <div className="post-image">
            <img
              alt={image.alt || post.title || 'Post image'}
              height={image.height || undefined}
              src={image.url}
              width={image.width || undefined}
            />
            {image.caption && <p className="image-caption">{image.caption}</p>}
          </div>
        )}

        {post.content && (
          <div className="post-content">
            <RichText data={post.content} />
          </div>
        )}

        <footer className="post-footer">
          <p className="post-updated">
            Last updated:{' '}
            {new Date(post.updatedAt).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </footer>
      </article>
    </>
  )
}
