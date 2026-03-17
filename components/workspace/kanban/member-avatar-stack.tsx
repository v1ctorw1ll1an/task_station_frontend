'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';

interface Member {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
}

const MAX_VISIBLE = 6;

export function MemberAvatarStack({ members }: { members: Member[] }) {
  if (members.length === 0) return null;
  const visible = members.slice(0, MAX_VISIBLE);
  const overflow = members.length - MAX_VISIBLE;

  return (
    <TooltipProvider>
      <div className="flex items-center">
        {visible.map((m, i) => (
          <span
            key={m.id}
            className={`ring-2 ring-background rounded-full cursor-default select-none ${i > 0 ? '-ml-2' : ''}`}
          >
            <UserAvatar
              name={m.name}
              email={m.email}
              photoUrl={m.photoUrl}
              size="md"
            />
          </span>
        ))}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="-ml-2 inline-flex items-center justify-center h-7 w-7 rounded-full text-[11px] font-semibold text-muted-foreground bg-muted ring-2 ring-background cursor-default select-none">
                +{overflow}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{members.slice(MAX_VISIBLE).map((m) => m.name).join(', ')}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
