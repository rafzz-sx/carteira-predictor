// src/components/fixed-income/YieldCurveWidget.tsx
'use client';

import React from 'react';
import { YieldCurvePoint } from '@/domain/finance/fixed-income';
import { LineChart, Activity, TrendingUp } from 'lucide-react';

interface YieldCurveWidgetProps {
  points: YieldCurvePoint[];
}

export function YieldCurveWidget({ points }: YieldCurveWidgetProps) {
  const chartWidth = 500;
  const chartHeight = 180;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };
  const graphW = chartWidth - padding.left - padding.right;
  const graphH = chartHeight - padding.top - padding.bottom;

  const rates = points.map((p) => p.ratePercent);
  const minRate = Math.min(...rates) - 0.5;
  const maxRate = Math.max(...rates) + 0.5;

  const svgPoints = points.map((pt, idx) => {
    const x = padding.left + (idx / (points.length - 1)) * graphW;
    const yRatio = (pt.ratePercent - minRate) / (maxRate - minRate);
    const y = padding.top + graphH - yRatio * graphH;
    return { ...pt, x, y };
  });

  const pathD = svgPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Fill gradient area below line
  const areaD = `${pathD} L ${svgPoints[svgPoints.length - 1].x} ${chartHeight - padding.bottom} L ${svgPoints[0].x} ${chartHeight - padding.bottom} Z`;

  const spread1y10y = points.length >= 2 ? Number((points[points.length - 1].ratePercent - points[0].ratePercent).toFixed(2)) : 0;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F3F5FA] flex items-center gap-2">
              Curva de Juros Futuros (ETTJ DI B3)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                Mercado Futuro
              </span>
            </h3>
            <p className="text-xs text-[#A3A9BC]">
              Contratos futuros de DI negociados na B3 balizam taxas de CDBs, LCIs e Títulos do Tesouro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-tabular">
            <TrendingUp className="w-3.5 h-3.5" />
            Inclinação: +{spread1y10y}% (+{Math.round(spread1y10y * 100)} bps)
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="p-3 rounded-xl border border-white/[0.06] bg-black/30 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[420px] select-none"
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[11.0, 11.5, 12.0, 12.5].map((lvl) => {
            const yRatio = (lvl - minRate) / (maxRate - minRate);
            const y = padding.top + graphH - yRatio * graphH;
            return (
              <g key={lvl}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#666E85"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {lvl.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          <path d={areaD} fill="url(#curveGradient)" />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#22D3EE"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Vertices */}
          {svgPoints.map((pt) => (
            <g key={pt.vertex}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="#07080C"
                stroke="#22D3EE"
                strokeWidth="2"
              />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fill="#F3F5FA"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pt.ratePercent.toFixed(2)}%
              </text>
              <text
                x={pt.x}
                y={chartHeight - padding.bottom + 16}
                textAnchor="middle"
                fill="#A3A9BC"
                fontSize="9"
                fontWeight="medium"
              >
                {pt.maturityYear}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Market Interpretation footer */}
      <div className="flex items-start gap-2.5 text-xs text-[#A3A9BC]">
        <Activity className="w-4 h-4 shrink-0 text-[#22D3EE] mt-0.5" />
        <span>
          <strong>Diagnóstico da Curva:</strong> A inclinação positiva normal (+90 bps) reflete expectativas de estabilidade na taxa Selic no curto prazo aliada a prêmio de liquidez e incerteza fiscal nos vértices mais longos (2031 a 2036).
        </span>
      </div>
    </div>
  );
}
