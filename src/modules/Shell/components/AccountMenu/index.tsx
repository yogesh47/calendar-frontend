import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import type { AuthUser } from '@/modules/Auth/types'

interface AccountMenuProps {
  user: AuthUser
  onSignOut?: () => void
}

const ROLE_LABEL: Record<string, string> = {
  tpo: 'Training & Placement Officer',
  student: 'Student',
}

const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

const AccountMenu = ({ user, onSignOut }: AccountMenuProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" aria-label={`Account — ${user.name}`} className="cursor-pointer rounded-full">
        <Avatar className="size-9">
          <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
        </Avatar>
      </button>
    </PopoverTrigger>

    <PopoverContent hideWhenDetached collisionPadding={8} align="end" className="w-[17rem] p-0">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Avatar className="size-10">
          <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-sm [color:var(--ds-color-text-secondary)]">{user.email}</p>
        </div>
      </div>

      <dl className="space-y-1.5 border-b px-4 py-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="[color:var(--ds-color-text-secondary)]">Role</dt>
          <dd className="font-medium">{ROLE_LABEL[user.role] ?? user.role}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="[color:var(--ds-color-text-secondary)]">College</dt>
          <dd className="font-medium">Campus College</dd>
        </div>
      </dl>

      <div className="p-2">
        <Button variant="ghost" className="w-full justify-start" onClick={onSignOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </PopoverContent>
  </Popover>
)

export default AccountMenu
