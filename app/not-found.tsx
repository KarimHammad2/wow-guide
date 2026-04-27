import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { WowWordmark } from '@/components/site/wow-wordmark'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header centerNavLabel="404" />

      <main className="flex-1 flex items-center justify-center pt-24 pb-10 px-4 safe-bottom">
        <div className="max-w-md mx-auto w-full text-center">
          <div className="mb-6 flex justify-center">
            <WowWordmark
              priority
              className="h-20 w-auto max-w-[min(16rem,90vw)] object-center sm:h-24"
            />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or doesn&apos;t exist.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <Search className="w-4 h-4" />
                Search Guide
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
