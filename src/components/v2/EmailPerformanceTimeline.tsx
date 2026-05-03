import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Filler,
} from 'chart.js';

Chart.register(
  CategoryScale, LinearScale,
  BarElement, BarController,
  LineElement, LineController,
  PointElement, Tooltip, Filler,
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type RangeKey = 7 | 14 | 30 | 0;

interface Reply { id: string; replied_at: string; }

interface Send {
  sent_at: string | null;
  opened_at: string | null;
  listing_address: string | null;
  campaign_replies: Reply[];
}

export interface TimelineCampaign {
  id: string;
  campaign_name: string;
  campaign_sends: Send[];
}

interface DailyMetric {
  date: string;
  sent_count: number;
  open_count: number;
  reply_count: number;
  bounce_count: number; // TODO: wire to real bounce tracking
  unsub_count: number;  // TODO: wire to real unsub tracking
}

interface Props {
  campaigns: TimelineCampaign[];
  currentRange: RangeKey;
  onRangeChange: (range: RangeKey) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RANGE_KEYS: RangeKey[] = [7, 14, 30, 0];
const RANGE_LABELS: Record<RangeKey, string> = { 7: '7d', 14: '14d', 30: '30d', 0: 'All time' };
const RANGE_META: Record<RangeKey, string> = { 7: 'last 7 days', 14: 'last 14 days', 30: 'last 30 days', 0: 'all time' };

const NORMAL_BAR = 'rgba(255,206,10,0.82)';
const PULSE_HI   = 'rgba(255,206,10,0.9)';
const PULSE_LO   = 'rgba(255,206,10,0.38)';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildMetrics(campaigns: TimelineCampaign[], range: RangeKey): DailyMetric[] {
  const byDate: Record<string, DailyMetric> = {};
  const ensure = (d: string) => {
    if (!byDate[d]) byDate[d] = { date: d, sent_count: 0, open_count: 0, reply_count: 0, bounce_count: 0, unsub_count: 0 };
  };

  const cutoff = range > 0 ? new Date(Date.now() - range * 86_400_000) : null;
  const inRange = (iso: string) => !cutoff || new Date(iso.slice(0, 10)) >= cutoff;

  for (const c of campaigns) {
    for (const s of c.campaign_sends ?? []) {
      if (s.sent_at && inRange(s.sent_at)) {
        const d = s.sent_at.slice(0, 10); ensure(d); byDate[d].sent_count++;
      }
      if (s.opened_at && inRange(s.opened_at)) {
        const d = s.opened_at.slice(0, 10); ensure(d); byDate[d].open_count++;
      }
      for (const r of s.campaign_replies ?? []) {
        if (r.replied_at && inRange(r.replied_at)) {
          const d = r.replied_at.slice(0, 10); ensure(d); byDate[d].reply_count++;
        }
      }
    }
  }

  // Build contiguous date range so the X axis has no gaps
  const todayUTC = new Date(); todayUTC.setUTCHours(0, 0, 0, 0);
  let startUTC: Date;
  if (range > 0) {
    startUTC = new Date(todayUTC.getTime() - range * 86_400_000);
  } else {
    const allDates = Object.keys(byDate).sort();
    startUTC = allDates.length > 0
      ? new Date(allDates[0] + 'T00:00:00Z')
      : new Date(todayUTC.getTime() - 29 * 86_400_000);
  }

  const result: DailyMetric[] = [];
  let d = new Date(startUTC);
  while (d <= todayUTC) {
    const key = d.toISOString().slice(0, 10);
    result.push(byDate[key] ?? { date: key, sent_count: 0, open_count: 0, reply_count: 0, bounce_count: 0, unsub_count: 0 });
    d = new Date(d.getTime() + 86_400_000);
  }
  return result;
}

function bucketWeekly(metrics: DailyMetric[]): DailyMetric[] {
  const weeks: DailyMetric[] = [];
  for (let i = 0; i < metrics.length; i += 7) {
    const chunk = metrics.slice(i, i + 7);
    weeks.push({
      date: chunk[0].date,
      sent_count:   chunk.reduce((a, b) => a + b.sent_count, 0),
      open_count:   chunk.reduce((a, b) => a + b.open_count, 0),
      reply_count:  chunk.reduce((a, b) => a + b.reply_count, 0),
      bounce_count: 0,
      unsub_count:  0,
    });
  }
  return weeks;
}

function fmtLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function buildTickerStrings(campaigns: TimelineCampaign[]): string[] {
  const events: { t: number; text: string }[] = [];
  for (const c of campaigns) {
    for (const s of c.campaign_sends ?? []) {
      if (s.sent_at && s.listing_address) {
        const days = Math.floor((Date.now() - new Date(s.sent_at).getTime()) / 86_400_000);
        const label = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days}d ago`;
        events.push({ t: new Date(s.sent_at).getTime(), text: `Last send: ${label} · ${s.listing_address}` });
      }
      for (const r of s.campaign_replies ?? []) {
        if (r.replied_at) {
          events.push({ t: new Date(r.replied_at).getTime(), text: `Reply received on "${c.campaign_name}"` });
        }
      }
    }
  }
  events.sort((a, b) => b.t - a.t);
  const strings = events.slice(0, 5).map(e => e.text);
  return strings.length > 0 ? strings : [
    'Campaigns will run tonight — check back soon',
    'Opens and replies tracked in real time',
    'Create a campaign to start reaching agents',
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function EmailPerformanceTimeline({ campaigns, currentRange, onRangeChange }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const chartRef    = useRef<Chart | null>(null);
  const pulseRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [visible, setVisible] = useState({
    sent: true, opens: true, replies: true,
    bounces: false, // hidden until bounce tracking is implemented
    unsubs: false,  // hidden until unsub tracking is implemented
  });
  // Keep a ref so drawChart can read current visibility without it being a dep
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  // Ticker
  const tickerStrings = buildTickerStrings(campaigns);
  const [tickIdx, setTickIdx]     = useState(0);
  const [tickShowing, setTickShowing] = useState(true);

  useEffect(() => {
    if (tickerStrings.length <= 1) return;
    const id = setInterval(() => {
      setTickShowing(false);
      setTimeout(() => {
        setTickIdx(i => (i + 1) % tickerStrings.length);
        setTickShowing(true);
      }, 600);
    }, 5000);
    return () => clearInterval(id);
  }, [tickerStrings.length]);

  // ---------------------------------------------------------------------------
  // Chart draw
  // ---------------------------------------------------------------------------
  const drawChart = useCallback(() => {
    if (pulseRef.current) { clearInterval(pulseRef.current); pulseRef.current = null; }
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dark       = document.documentElement.classList.contains('dark');
    const tickColor  = dark ? '#6b7280' : '#9ca3af';
    const gridColor  = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const ttBg       = dark ? 'rgba(20,20,20,0.95)'    : 'rgba(255,255,255,0.97)';
    const ttTitle    = dark ? '#ffffff'                 : '#342e37';
    const ttBody     = dark ? '#d1d5db'                 : '#4b5563';
    const ttBorder   = dark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.08)';

    let metrics = buildMetrics(campaigns, currentRange);
    const weekly = currentRange === 0 && metrics.length > 66;
    if (weekly) metrics = bucketWeekly(metrics);
    const n   = metrics.length;
    const vis = visibleRef.current;

    chartRef.current = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: metrics.map(m => fmtLabel(m.date)),
        datasets: [
          {
            type: 'bar',
            label: 'Sent',
            data: metrics.map(m => m.sent_count),
            backgroundColor: Array(n).fill(NORMAL_BAR) as string[],
            hidden: !vis.sent,
            yAxisID: 'yB',
            order: 2,
          },
          {
            type: 'line',
            label: 'Opens',
            data: metrics.map(m => m.open_count),
            borderColor: '#378ADD',
            backgroundColor: 'rgba(55,138,221,0.07)',
            pointRadius: n > 60 ? 0 : 3,
            pointHoverRadius: 5,
            tension: 0.35,
            hidden: !vis.opens,
            yAxisID: 'yL',
            order: 1,
          },
          {
            type: 'line',
            label: 'Replies',
            data: metrics.map(m => m.reply_count),
            borderColor: '#D4537E',
            backgroundColor: 'transparent',
            pointRadius: n > 60 ? 0 : 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'transparent',
            pointBorderColor: '#D4537E',
            pointBorderWidth: 2,
            tension: 0.35,
            hidden: !vis.replies,
            yAxisID: 'yL',
            order: 1,
          },
          {
            // TODO: wire to real bounce-tracking data when available
            type: 'line',
            label: 'Bounces',
            data: metrics.map(m => m.bounce_count),
            borderColor: '#E24B4A',
            borderDash: [5, 4],
            backgroundColor: 'transparent',
            pointRadius: 2,
            tension: 0.35,
            hidden: !vis.bounces,
            yAxisID: 'yL',
            order: 1,
          },
          {
            // TODO: wire to real unsub-tracking data when available
            type: 'line',
            label: 'Unsubs',
            data: metrics.map(m => m.unsub_count),
            borderColor: '#888780',
            borderDash: [3, 4],
            backgroundColor: 'transparent',
            pointRadius: 2,
            tension: 0.35,
            hidden: !vis.unsubs,
            yAxisID: 'yL',
            order: 1,
          },
        ] as any[],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutQuart' } as any,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: ttBg,
            titleColor: ttTitle,
            bodyColor: ttBody,
            borderColor: ttBorder,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            filter: (item: any) => !item.dataset.hidden,
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y}` },
          } as any,
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: tickColor, maxTicksLimit: 8, maxRotation: 0, font: { size: 10 } },
          },
          yB: {
            type: 'linear', position: 'left', beginAtZero: true,
            grid: { color: gridColor },
            border: { display: false },
            ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 5 },
            title: { display: true, text: 'sent', color: tickColor, font: { size: 10 } },
          },
          yL: {
            type: 'linear', position: 'right', beginAtZero: true,
            grid: { drawOnChartArea: false },
            border: { display: false },
            ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 5 },
            title: { display: true, text: 'events', color: tickColor, font: { size: 10 } },
          },
        },
      } as any,
    });

    // Pulse: today's (rightmost) bar alternates opacity every 900 ms
    if (n > 0) {
      let pulseUp = true;
      pulseRef.current = setInterval(() => {
        const chart = chartRef.current;
        if (!chart) return;
        const ds = chart.data.datasets[0] as any;
        if (!ds || ds.hidden) return;
        ds.backgroundColor = Array.from({ length: n }, (_, i) =>
          i === n - 1 ? (pulseUp ? PULSE_HI : PULSE_LO) : NORMAL_BAR
        );
        pulseUp = !pulseUp;
        chart.update('none');
      }, 900);
    }
  }, [currentRange, campaigns]);

  // Redraw on range / data change (full animation)
  useEffect(() => {
    drawChart();
    return () => { if (pulseRef.current) clearInterval(pulseRef.current); };
  }, [drawChart]);

  // Toggle visibility without animation
  useEffect(() => {
    if (!chartRef.current) return;
    const keys = ['sent', 'opens', 'replies', 'bounces', 'unsubs'] as const;
    keys.forEach((k, i) => {
      const ds = chartRef.current!.data.datasets[i] as any;
      if (ds) ds.hidden = !visible[k];
    });
    chartRef.current.update('none');
  }, [visible]);

  // Redraw when OS dark/light preference changes
  useEffect(() => {
    const obs = new MutationObserver(() => drawChart());
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [drawChart]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (pulseRef.current) clearInterval(pulseRef.current);
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
  }, []);

  // ---------------------------------------------------------------------------
  // Derived rates
  // ---------------------------------------------------------------------------
  const rateData   = buildMetrics(campaigns, currentRange);
  const rTotalSent = rateData.reduce((a, b) => a + b.sent_count, 0);
  const rTotalOpen = rateData.reduce((a, b) => a + b.open_count, 0);
  const rTotalReply = rateData.reduce((a, b) => a + b.reply_count, 0);
  const fmt = (n: number, d: number) => d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '—';

  // ---------------------------------------------------------------------------
  // Legend config
  // ---------------------------------------------------------------------------
  const legendItems = [
    {
      key: 'sent' as const,
      label: 'Sent',
      swatch: <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: '#FFCE0A' }} />,
    },
    {
      key: 'opens' as const,
      label: 'Opens',
      swatch: <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: '#378ADD' }} />,
    },
    {
      key: 'replies' as const,
      label: 'Replies',
      swatch: <span className="inline-block w-2.5 h-2.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#D4537E' }} />,
    },
    {
      key: 'bounces' as const,
      label: 'Bounces',
      swatch: (
        <span className="inline-block flex-shrink-0" style={{ width: 12, height: 2, marginTop: 1, borderTop: '2px dashed #E24B4A' }} />
      ),
    },
    {
      key: 'unsubs' as const,
      label: 'Unsubs',
      swatch: (
        <span className="inline-block flex-shrink-0" style={{ width: 12, height: 2, marginTop: 1, borderTop: '2px dashed #888780' }} />
      ),
    },
  ] as const;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10 p-4 mb-6">

      {/* Card header */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Email performance timeline</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            All campaigns · {RANGE_META[currentRange]}
          </p>
        </div>

        {/* Range buttons */}
        <div className="flex gap-1 flex-shrink-0">
          {RANGE_KEYS.map(r => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                currentRange === r
                  ? 'border-[#FFCE0A] text-[#342e37] font-medium'
                  : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 bg-transparent hover:border-gray-300 dark:hover:border-white/20'
              }`}
              style={currentRange === r ? { background: '#FFCE0A' } : undefined}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom HTML legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2">
        {legendItems.map(({ key, label, swatch }) => (
          <label
            key={key}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={visible[key]}
              onChange={() => setVisible(v => ({ ...v, [key]: !v[key] }))}
            />
            {swatch}
            <span className={`text-[11px] transition-colors ${
              visible[key]
                ? 'text-gray-600 dark:text-gray-300'
                : 'text-gray-300 dark:text-gray-600'
            }`}>
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* Chart canvas */}
      <div style={{ position: 'relative', width: '100%', height: 190 }}>
        <canvas ref={canvasRef} role="img" aria-label="Email performance timeline chart" />
      </div>

      {/* Rates footer */}
      <div className="flex flex-wrap gap-4 mt-2 pt-2 border-t border-gray-100 dark:border-white/10">
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          Open rate{' '}
          <strong className="text-gray-900 dark:text-white font-medium">
            {fmt(rTotalOpen, rTotalSent)}
          </strong>
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          Reply rate{' '}
          <strong className="text-gray-900 dark:text-white font-medium">
            {fmt(rTotalReply, rTotalSent)}
          </strong>
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          {/* TODO: compute from real bounce data */}
          Bounce rate{' '}
          <strong className="text-gray-900 dark:text-white font-medium">—</strong>
        </span>
      </div>

      {/* Live ticker */}
      <div
        className="mt-2 pt-2 border-t border-gray-100 dark:border-white/10 overflow-hidden"
        style={{ height: 20 }}
      >
        <div
          className="flex items-center gap-1.5"
          style={{
            opacity: tickShowing ? 1 : 0,
            transform: tickShowing ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <span
            className="flex-shrink-0 rounded-full"
            style={{ width: 6, height: 6, background: '#FFCE0A' }}
          />
          <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
            {tickerStrings[tickIdx]}
          </span>
        </div>
      </div>
    </div>
  );
}
