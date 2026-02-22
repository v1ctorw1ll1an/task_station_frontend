'use client';

import { useState, useTransition } from 'react';
import { Link2, Check, ShieldOff, RefreshCw } from 'lucide-react';
import { invalidateCredentialsAction } from '@/actions/superadmin/invalidate-credentials.action';
import { getMagicLinkAction } from '@/actions/superadmin/get-magic-link.action';
import { Button } from '@/components/ui/button';

interface UserCredentialActionsProps {
  userId: string;
  mustResetPassword: boolean;
}

export function UserCredentialActions({
  userId,
  mustResetPassword,
}: UserCredentialActionsProps) {
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCopy(link: string) {
    void navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleInvalidate() {
    setError(null);
    startTransition(async () => {
      const result = await invalidateCredentialsAction(userId);
      if (result.error) {
        setError(result.error);
      } else if (result.magicLink) {
        setMagicLink(result.magicLink);
      }
    });
  }

  function handleGetLink() {
    setError(null);
    startTransition(async () => {
      const result = await getMagicLinkAction(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setMagicLink(result.magicLink ?? null);
        if (!result.magicLink) {
          setError('Este usuário não possui um magic link ativo.');
        }
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {mustResetPassword && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetLink}
            disabled={isPending}
          >
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            Copiar magic link
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleInvalidate}
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          {mustResetPassword ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Gerar novo magic link
            </>
          ) : (
            <>
              <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
              Invalidar credenciais
            </>
          )}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {magicLink && (
        <div className="rounded-md border bg-muted/40 p-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Link de primeiro acesso (expira em 7 dias, uso único):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-2 py-1 text-xs truncate">{magicLink}</code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => handleCopy(magicLink)}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
