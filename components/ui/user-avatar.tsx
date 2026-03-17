'use client';

import { useEffect, useState } from 'react';
import { gravatarUrl } from '@/lib/gravatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIZE_CLASSES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-[11px]',
} as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

interface UserAvatarProps {
  name: string;
  email: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
}

export function UserAvatar({ name, email, photoUrl, size = 'sm' }: UserAvatarProps) {
  const [gravatarSrc, setGravatarSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (photoUrl) return;
    let cancelled = false;
    gravatarUrl(email, 40).then((url) => {
      if (!cancelled) setGravatarSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [email, photoUrl]);

  const rawPhoto = photoUrl
    ? photoUrl.startsWith('http')
      ? photoUrl
      : `${process.env.NEXT_PUBLIC_API_URL}${photoUrl}`
    : null;
  const src = rawPhoto ?? gravatarSrc;

  const sizeClass = SIZE_CLASSES[size];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center justify-center rounded-full bg-muted font-medium overflow-hidden shrink-0 ${sizeClass}`}
          >
            {!failed && src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={name}
                className="w-full h-full object-cover rounded-full"
                onError={() => setFailed(true)}
              />
            ) : (
              getInitials(name)
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {name} | {email}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
