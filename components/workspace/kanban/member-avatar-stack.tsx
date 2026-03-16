'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Member {
  id: string;
  name: string;
  email: string;
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-pink-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
          <Tooltip key={m.id}>
            <TooltipTrigger asChild>
              <span
                className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-[11px] font-semibold text-white ring-2 ring-background cursor-default select-none ${getAvatarColor(m.name)} ${i > 0 ? '-ml-2' : ''}`}
              >
                {getInitials(m.name)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{m.name}</p>
            </TooltipContent>
          </Tooltip>
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
