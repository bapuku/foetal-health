'use client';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

const FIGO_NORMAL_MIN = 110;
const FIGO_NORMAL_MAX = 160;

interface CTGChartProps {
  patientLabel?: string;
}

export default function CTGChart({ patientLabel }: CTGChartProps) {
  const data = useMemo(
    () =>
      Array.from({ length: 180 }, (_, i) => ({
        time: i,
        fhr: Math.round(
          135 +
            Math.sin(i / 12) * 10 +
            Math.sin(i / 5) * 3 +
            Math.cos(i / 20) * 5 +
            (Math.random() - 0.5) * 6
        ),
      })),
    []
  );

  const currentFHR = data[data.length - 1].fhr;
  const avgFHR = Math.round(data.reduce((s, d) => s + d.fhr, 0) / data.length);
  const minFHR = Math.min(...data.map((d) => d.fhr));
  const maxFHR = Math.max(...data.map((d) => d.fhr));

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Frequence cardiaque foetale (FHR){patientLabel ? ` — ${patientLabel}` : ''}</h2>
          <p className="text-xs text-slate-500">Trace CTG temps reel - 30 dernieres minutes{patientLabel ? ` · ${patientLabel}` : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{currentFHR}</p>
            <p className="text-xs text-slate-400">bpm actuel</p>
          </div>
          <div className={`h-3 w-3 rounded-full ${currentFHR >= FIGO_NORMAL_MIN && currentFHR <= FIGO_NORMAL_MAX ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
        </div>
      </div>

      {/* Stats inline */}
      <div className="mb-4 flex gap-6 text-xs">
        <span className="text-slate-500">Moyenne: <strong className="text-slate-700">{avgFHR} bpm</strong></span>
        <span className="text-slate-500">Min: <strong className="text-slate-700">{minFHR} bpm</strong></span>
        <span className="text-slate-500">Max: <strong className="text-slate-700">{maxFHR} bpm</strong></span>
        <span className="badge-ok ml-auto">Zone FIGO normale</span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              label={{ value: 'Temps (s)', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              domain={[90, 190]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              label={{ value: 'bpm', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(value: number) => [`${value} bpm`, 'FHR']}
            />
            <ReferenceLine y={FIGO_NORMAL_MIN} stroke="#22c55e" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: '110', position: 'left', fontSize: 10, fill: '#22c55e' }} />
            <ReferenceLine y={FIGO_NORMAL_MAX} stroke="#22c55e" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: '160', position: 'left', fontSize: 10, fill: '#22c55e' }} />
            <Line type="monotone" dataKey="fhr" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
