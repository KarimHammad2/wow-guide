import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { FAQAccordion } from '@/components/guide/faq-accordion'
import { ImageCard } from '@/components/guide/image-card'
import { InfoCard } from '@/components/guide/info-card'
import { InstructionStepper } from '@/components/guide/instruction-stepper'
import { ManualCard } from '@/components/guide/manual-card'
import { normalizeSafeEmbedUrl, normalizeSafeNavigationTarget } from '@/lib/url-safety'
import { cn } from '@/lib/utils'
import type { ContentSection } from '@/lib/data'

interface GuideBlockRendererProps {
  sections: ContentSection[]
}

function renderSchedule(title: string | undefined, items: NonNullable<ContentSection['items']>) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
      {title && <h3 className="font-semibold text-lg mb-4 text-foreground">{title}</h3>}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1.5 rounded-xl bg-secondary/70 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span className="min-w-0 font-medium text-foreground">{item.title}</span>
            <span className="min-w-0 text-sm text-muted-foreground sm:shrink-0 sm:text-right">{item.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GuideBlockRenderer({ sections }: GuideBlockRendererProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const key = section.blockId ?? section.id
        const safeVideoUrl = normalizeSafeEmbedUrl(section.videoUrl)
        switch (section.type) {
          case 'hero':
            return (
              <section key={key} className="rounded-3xl border border-primary/20 bg-linear-to-br from-primary/15 to-transparent p-6 md:p-8">
                {section.title && <h2 className="text-2xl md:text-3xl font-bold mb-3">{section.title}</h2>}
                {section.content && <p className="text-muted-foreground leading-relaxed">{section.content}</p>}
              </section>
            )
          case 'text':
            return (
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {section.title && <h3 className="font-semibold text-lg mb-3">{section.title}</h3>}
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </section>
            )
          case 'card':
            return (
              <InfoCard
                key={key}
                title={section.title}
                content={section.content}
                items={section.items}
                variant={section.styleVariant === 'highlighted' ? 'highlighted' : 'default'}
              />
            )
          case 'steps':
          case 'checklist':
            return <InstructionStepper key={key} title={section.title} steps={section.items ?? []} />
          case 'accordion':
            return <FAQAccordion key={key} title={section.title} items={section.items ?? []} />
          case 'image':
          case 'media':
            return (
              <ImageCard
                key={key}
                src={section.mediaUrl ?? section.items?.[0]?.image}
                alt={section.title ?? 'Section media'}
                caption={section.caption ?? section.content}
              />
            )
          case 'video':
            return (
              <section key={key} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                {section.title && <h3 className="font-semibold text-lg">{section.title}</h3>}
                {safeVideoUrl ? (
                  <div className="aspect-video overflow-hidden rounded-xl">
                    <iframe
                      src={safeVideoUrl}
                      title={section.title ?? 'Video guide'}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Add a video URL from admin.</p>
                )}
              </section>
            )
          case 'links':
            return (
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {section.title && <h3 className="font-semibold text-lg mb-3">{section.title}</h3>}
                <div className="space-y-2">
                  {(section.items ?? []).map((item) => (
                    <Link
                      key={item.id}
                      href={normalizeSafeNavigationTarget(item.link)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 hover:border-primary/40 transition-colors min-h-11"
                    >
                      <span className="min-w-0 break-words text-left">{item.title}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )
          case 'contact':
            return (
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {section.title && <h3 className="font-semibold text-lg mb-2">{section.title}</h3>}
                <p className="text-muted-foreground">{section.content}</p>
              </section>
            )
          case 'tabs':
            return (
              <section key={key} className="rounded-2xl border border-border bg-card p-5">
                {section.title && <h3 className="font-semibold text-lg mb-4">{section.title}</h3>}
                <div className="space-y-3">
                  {(section.items ?? []).map((item) => (
                    <div key={item.id} className="rounded-xl bg-secondary/70 p-3">
                      <p className="font-medium">{item.title}</p>
                      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )
          case 'manual':
            return (
              <ManualCard
                key={key}
                title={section.title ?? 'Manual'}
                description={section.content}
                fileType={section.videoUrl ? 'video' : 'pdf'}
                fileUrl={normalizeSafeNavigationTarget(section.videoUrl ?? section.mediaUrl)}
              />
            )
          case 'schedule':
            return renderSchedule(section.title, section.items ?? [])
          default:
            return (
              <section key={key} className={cn('rounded-2xl border border-border bg-card p-5')}>
                {section.title && <h3 className="font-semibold text-lg mb-3">{section.title}</h3>}
                {section.content && <p className="text-muted-foreground">{section.content}</p>}
              </section>
            )
        }
      })}
    </div>
  )
}
