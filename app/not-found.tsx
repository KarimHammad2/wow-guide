import Link from 'next/link'
import { Home, Search, HelpCircle } from 'lucide-react'
import { Header } from '@/components/guide/header'
import { Footer } from '@/components/guide/footer'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center pt-16 pb-8">
        <div className="max-w-md mx-auto px-4 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10 text-muted-foreground" />
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

      <Footer />
    </div>
  )
}
