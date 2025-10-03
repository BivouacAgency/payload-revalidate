'use client'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { env } from 'env'
import { useRouter } from 'next/navigation.js'
import React from 'react'

export const RefreshRouteOnSave: React.FC = () => {
  const router = useRouter()
  return (
    <PayloadLivePreview
      refresh={() => router.refresh()}
      // serverURL={env.NEXT_PUBLIC_WEBSITE_URL}
      serverURL="http://localhost:3000"
    />
  )
}
