import type { OverviewColumn } from '@/actions/workspace/get-workspace-overview.action';

interface OverviewDistributionBarProps {
  columns: OverviewColumn[];
  totalTasks: number;
}

export function OverviewDistributionBar({ columns, totalTasks }: OverviewDistributionBarProps) {
  if (totalTasks === 0) {
    return (
      <div className="h-1.5 w-32 rounded-full bg-muted" />
    );
  }

  const columnsWithTasks = columns.filter((c) => c.taskCount > 0);

  return (
    <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-muted" title="Distribuição de tasks por coluna">
      {columnsWithTasks.map((col) => {
        const pct = (col.taskCount / totalTasks) * 100;
        return (
          <div
            key={col.id}
            title={`${col.name}: ${col.taskCount} task${col.taskCount !== 1 ? 's' : ''} (${Math.round(pct)}%)`}
            style={{
              width: `${pct}%`,
              backgroundColor: col.color ?? 'hsl(var(--muted-foreground))',
              opacity: col.color ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
