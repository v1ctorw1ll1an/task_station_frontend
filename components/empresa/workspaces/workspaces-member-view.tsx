'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Workspace {
  workspaceId: string;
  workspaceName: string;
  role: string;
}

interface WorkspacesMemberViewProps {
  data: Workspace[];
}

export function WorkspacesMemberView({ data }: WorkspacesMemberViewProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="text-center text-muted-foreground py-8">
                Você não pertence a nenhum workspace nesta empresa.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Seu papel</TableHead>
            <TableHead className="text-right">Acessar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((ws) => (
            <TableRow key={ws.workspaceId}>
              <TableCell className="font-medium">{ws.workspaceName}</TableCell>
              <TableCell>
                <Badge variant={ws.role === 'workspace_admin' ? 'default' : 'outline'} className="text-xs">
                  {ws.role === 'workspace_admin' ? 'Admin' : 'Membro'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/workspace/${ws.workspaceId}/projetos`}>
                  <Button variant="ghost" size="sm" title="Entrar no workspace">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
