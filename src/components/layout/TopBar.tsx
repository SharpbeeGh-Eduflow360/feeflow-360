import { Menu } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useSchool } from '@/hooks/useSchool'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function initials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }
  return email?.[0]?.toUpperCase() ?? '?'
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, signOut } = useAuth()
  const { school } = useSchool()
  const fullName = user?.user_metadata?.full_name as string | undefined

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={school?.logo_url ?? undefined} />
          <AvatarFallback className="bg-brand-navy text-white text-xs">
            {school?.name?.[0]?.toUpperCase() ?? 'S'}
          </AvatarFallback>
        </Avatar>

        <span className="font-semibold">{school?.name ?? 'FeeFlow-360'}</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-brand-navy text-white text-xs">
                  {initials(fullName, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{fullName ?? 'Account'}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}