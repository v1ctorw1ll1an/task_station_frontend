'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ProjectDescriptionLine({ description }: { description: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p
        onClick={() => setOpen(true)}
        className="line-clamp-1 text-sm text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors max-w-[50%]"
        title="Ver descrição completa"
      >
        {description}
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descrição</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
