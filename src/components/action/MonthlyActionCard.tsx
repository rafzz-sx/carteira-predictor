import { Target, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/formatters';

export interface MonthlyActionCardProps {
  yearMonth: string; // "YYYY-MM"
  monthName?: string; // "Outubro/2026"
  plannedAmountCents: number;
  actualAmountCents: number;
  status: 'pending' | 'partial' | 'completed';
  effectiveSince?: string;
  onEditPlan?: () => void;
  onNewAction?: () => void;
  className?: string;
}

export function MonthlyActionCard({
  monthName = 'Outubro/2026',
  plannedAmountCents,
  actualAmountCents,
  status,
  effectiveSince = 'Jul/2026',
  onEditPlan,
  className,
}: MonthlyActionCardProps) {
  const percentDone = plannedAmountCents > 0
    ? Math.min(100, Math.round((actualAmountCents / plannedAmountCents) * 100))
    : 0;

  const isPending = status === 'pending';
  const isCompleted = status === 'completed';

  return (
    <Card
      variant="metric"
      borderAccent={isPending ? 'warning' : isCompleted ? 'gain' : 'brand'}
      className={`p-5 flex flex-col justify-between gap-4 ${className || ''}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target
            className={`w-4 h-4 ${
              isPending ? 'text-[#F5B83D]' : isCompleted ? 'text-[#19D98B]' : 'text-[#7C5CFF]'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
            Plano de Ação do Mês
          </span>
        </div>

        <Badge variant={isPending ? 'warning' : isCompleted ? 'gain' : 'neutral'} size="sm">
          {monthName}: {isPending ? 'PENDENTE' : isCompleted ? 'CONCLUÍDO' : 'PARCIAL'}
        </Badge>
      </div>

      {/* Main Numbers */}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs text-[#A3A9BC]">Meta planejada para o mês:</div>
          <div className="text-2xl font-bold text-[#F3F5FA] font-tabular maskable">
            {formatCurrency(plannedAmountCents)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-[#A3A9BC]">Realizado até agora:</div>
          <div className="text-sm font-semibold text-[#A3A9BC] font-tabular maskable">
            {formatCurrency(actualAmountCents)} ({percentDone}%)
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percentDone} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCompleted ? 'bg-[#19D98B]' : isPending ? 'bg-[#F5B83D]' : 'bg-[#7C5CFF]'
          }`}
          style={{ width: `${percentDone}%` }}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
        <span className="text-[#A3A9BC]">Plano vigente desde {effectiveSince}</span>
        
        <div className="flex items-center gap-3">
          {onEditPlan && (
            <button
              onClick={onEditPlan}
              className="text-[#7C5CFF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ajustar plano de ação</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
