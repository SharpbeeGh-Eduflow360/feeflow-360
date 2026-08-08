import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-brand-navy dark:text-white">
          FeeFlow<span className="text-brand-gold">-360</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="bg-brand-navy hover:bg-brand-navy-light text-white">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}