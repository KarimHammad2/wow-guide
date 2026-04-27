import { notFound } from 'next/navigation'
import { SitePageEditor } from '@/components/admin/site-page-editor'
import { getSitePageBySlug } from '@/lib/site-pages-repository'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AdminEditSitePage({ params }: Props) {
  const { slug: raw } = await params
  const slug = decodeURIComponent(raw)
  const page = await getSitePageBySlug(slug)
  if (!page) {
    notFound()
  }
  return <SitePageEditor mode="edit" initialPage={page} />
}
