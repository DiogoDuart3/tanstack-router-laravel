import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { healthApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { HealthCheck, HealthResponse } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Activity, AlertTriangle, CheckCircle2, Cloud, Cpu, Database, HardDrive, RefreshCw, Server, Wifi, XCircle, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export const Route = createFileRoute('/health')({
    component: HealthComponent,
});

const REFRESH_INTERVAL_MS = 15_000;
const HISTORY_LIMIT = 30;

type Sample = {
    t: number;
    latency: number;
    ok: boolean;
};

type ServiceMeta = {
    key: string;
    label: string;
    icon: typeof Database;
    description: string;
};

const SERVICE_META: ServiceMeta[] = [
    { key: 'database', label: 'Database', icon: Database, description: 'Primary SQL connection' },
    { key: 'cache', label: 'Cache', icon: Zap, description: 'Read/write round-trip' },
    { key: 'storage', label: 'Storage', icon: HardDrive, description: 'Default filesystem disk' },
];

function StatusPill({ status }: { status: 'ok' | 'degraded' | 'down' | 'loading' }) {
    if (status === 'loading') {
        return (
            <Badge variant="outline" className="gap-1.5">
                <span className="size-2 animate-pulse rounded-full bg-yellow-500" />
                Checking
            </Badge>
        );
    }
    if (status === 'ok') {
        return (
            <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500" />
                Operational
            </Badge>
        );
    }
    if (status === 'degraded') {
        return (
            <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <span className="size-2 rounded-full bg-amber-500" />
                Degraded
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="gap-1.5 border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400">
            <span className="size-2 rounded-full bg-red-500" />
            Outage
        </Badge>
    );
}

function LatencySparkline({ samples }: { samples: Sample[] }) {
    if (samples.length === 0) {
        return <div className="text-sm text-muted-foreground">No samples yet.</div>;
    }
    const width = 600;
    const height = 80;
    const padding = 4;
    const max = Math.max(...samples.map((s) => s.latency), 50);
    const min = 0;
    const xStep = samples.length > 1 ? (width - padding * 2) / (samples.length - 1) : 0;
    const points = samples.map((s, i) => {
        const x = padding + i * xStep;
        const y = height - padding - ((s.latency - min) / Math.max(max - min, 1)) * (height - padding * 2);
        return { x, y, sample: s };
    });
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#sparkFill)" className="text-primary" />
            <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
            {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3 : 1.5} fill="currentColor" className={p.sample.ok ? 'text-primary' : 'text-red-500'} />
            ))}
        </svg>
    );
}

function ServiceRow({ meta, check }: { meta: ServiceMeta; check: HealthCheck | undefined }) {
    const Icon = meta.icon;
    const status = check?.status === 'ok' ? 'ok' : check?.status === 'down' ? 'down' : 'loading';
    return (
        <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                    <div className="truncate font-medium">{meta.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{check?.error ? check.error : meta.description}</div>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                {check && <span className="font-mono text-xs tabular-nums text-muted-foreground">{check.latency_ms.toFixed(1)}ms</span>}
                <StatusPill status={status} />
            </div>
        </div>
    );
}

function MetricRow({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn('truncate text-right', mono && 'font-mono tabular-nums')}>{value}</span>
        </div>
    );
}

function useNetworkInfo() {
    const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    useEffect(() => {
        const on = () => setOnline(true);
        const off = () => setOnline(false);
        window.addEventListener('online', on);
        window.addEventListener('offline', off);
        return () => {
            window.removeEventListener('online', on);
            window.removeEventListener('offline', off);
        };
    }, []);
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection;
    return {
        online,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
    };
}

function useCountdown(targetMs: number) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, []);
    return Math.max(0, Math.round((targetMs - now) / 1000));
}

function HealthComponent() {
    const healthQuery = useQuery({
        queryKey: ['health'],
        queryFn: healthApi.check,
        refetchInterval: REFRESH_INTERVAL_MS,
        refetchIntervalInBackground: true,
        retry: false,
    });

    const data = healthQuery.data as HealthResponse | undefined;
    const isInitialLoading = healthQuery.isLoading;
    const isReachable = !healthQuery.isError && !!data;

    const overallStatus: 'ok' | 'degraded' | 'down' | 'loading' = isInitialLoading
        ? 'loading'
        : !isReachable
          ? 'down'
          : data.status === 'ok'
            ? 'ok'
            : 'degraded';

    const [history, setHistory] = useState<Sample[]>([]);
    const lastUpdatedAt = healthQuery.dataUpdatedAt || healthQuery.errorUpdatedAt || 0;
    const recordedRef = useRef<number>(0);

    useEffect(() => {
        if (!lastUpdatedAt || lastUpdatedAt === recordedRef.current) return;
        recordedRef.current = lastUpdatedAt;
        const sample: Sample = {
            t: lastUpdatedAt,
            latency: data?.request_time_ms ?? 0,
            ok: isReachable && data?.status === 'ok',
        };
        setHistory((prev) => [...prev, sample].slice(-HISTORY_LIMIT));
    }, [lastUpdatedAt, data, isReachable]);

    const network = useNetworkInfo();
    const nextRefreshAt = lastUpdatedAt ? lastUpdatedAt + REFRESH_INTERVAL_MS : Date.now() + REFRESH_INTERVAL_MS;
    const secondsUntilRefresh = useCountdown(nextRefreshAt);

    const stats = useMemo(() => {
        if (history.length === 0) return null;
        const latencies = history.map((h) => h.latency);
        const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const p95 = [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length * 0.95) - 1] ?? latencies[latencies.length - 1];
        const okCount = history.filter((h) => h.ok).length;
        const uptime = (okCount / history.length) * 100;
        return { avg, p95, uptime, last: latencies[latencies.length - 1] };
    }, [history]);

    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;

    const headlineCopy = {
        loading: { title: 'Checking system status…', subtitle: 'Running health probes against the API.' },
        ok: { title: 'All systems operational', subtitle: 'Every monitored service is responding within expected bounds.' },
        degraded: { title: 'Partial system outage', subtitle: 'One or more services are reporting failures. See details below.' },
        down: { title: 'API unreachable', subtitle: 'The health endpoint did not respond. Check your network or try again.' },
    }[overallStatus];

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Activity className="size-3.5" />
                        <span>System status</span>
                    </div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">Status</h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {healthQuery.isFetching ? 'Refreshing…' : `Next check in ${secondsUntilRefresh}s`}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => healthQuery.refetch()}
                        disabled={healthQuery.isFetching}
                    >
                        <RefreshCw className={cn('size-4', healthQuery.isFetching && 'animate-spin')} />
                        <span className="ml-1.5">Refresh</span>
                    </Button>
                </div>
            </div>

            <Card
                className={cn(
                    'mb-6 overflow-hidden border-2',
                    overallStatus === 'ok' && 'border-emerald-500/40 bg-emerald-500/5',
                    overallStatus === 'degraded' && 'border-amber-500/40 bg-amber-500/5',
                    overallStatus === 'down' && 'border-red-500/40 bg-red-500/5',
                    overallStatus === 'loading' && 'border-yellow-500/30',
                )}
            >
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div
                            className={cn(
                                'flex size-12 shrink-0 items-center justify-center rounded-full',
                                overallStatus === 'ok' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                                overallStatus === 'degraded' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                                overallStatus === 'down' && 'bg-red-500/15 text-red-600 dark:text-red-400',
                                overallStatus === 'loading' && 'bg-yellow-500/15 text-yellow-600',
                            )}
                        >
                            {overallStatus === 'ok' && <CheckCircle2 className="size-6" />}
                            {overallStatus === 'degraded' && <AlertTriangle className="size-6" />}
                            {overallStatus === 'down' && <XCircle className="size-6" />}
                            {overallStatus === 'loading' && <RefreshCw className="size-6 animate-spin" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{headlineCopy.title}</h2>
                            <p className="text-sm text-muted-foreground">{headlineCopy.subtitle}</p>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <StatusPill status={overallStatus} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2">
                                <Server className="size-4" />
                                Services
                            </CardTitle>
                            {data && (
                                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                    request {data.request_time_ms.toFixed(1)}ms
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="divide-y">
                            {SERVICE_META.map((meta) => (
                                <ServiceRow key={meta.key} meta={meta} check={data?.checks?.[meta.key]} />
                            ))}
                        </div>
                        {healthQuery.error && (
                            <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                                {healthQuery.error.message}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-4" />
                                Response time
                            </CardTitle>
                            {stats && (
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="font-mono tabular-nums">last {stats.last.toFixed(1)}ms</span>
                                    <span className="font-mono tabular-nums">avg {stats.avg.toFixed(1)}ms</span>
                                    <span className="font-mono tabular-nums">p95 {stats.p95.toFixed(1)}ms</span>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <LatencySparkline samples={history} />
                        {stats && (
                            <>
                                <Separator className="my-3" />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Last {history.length} checks</span>
                                    <span className="font-mono tabular-nums">{stats.uptime.toFixed(1)}% session uptime</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cpu className="size-4" />
                            System
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y pt-0">
                        <MetricRow label="Laravel" value={data?.system?.laravel_version ?? '—'} />
                        <MetricRow label="PHP" value={data?.system?.php_version ?? '—'} />
                        <MetricRow
                            label="Environment"
                            mono={false}
                            value={
                                data?.system ? (
                                    <Badge variant={data.system.environment === 'production' ? 'default' : 'secondary'}>
                                        {data.system.environment}
                                        {data.system.debug && ' · debug'}
                                    </Badge>
                                ) : (
                                    '—'
                                )
                            }
                        />
                        <MetricRow label="Timezone" value={data?.system?.timezone ?? '—'} />
                        <MetricRow
                            label="Server time"
                            value={data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wifi className="size-4" />
                            Client
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y pt-0">
                        <MetricRow
                            label="Network"
                            mono={false}
                            value={
                                <Badge variant={network.online ? 'default' : 'destructive'}>
                                    {network.online ? 'Online' : 'Offline'}
                                </Badge>
                            }
                        />
                        <MetricRow label="Effective type" value={network.effectiveType ?? '—'} />
                        <MetricRow
                            label="Downlink"
                            value={network.downlink ? `${network.downlink} Mbps` : '—'}
                        />
                        <MetricRow label="RTT" value={network.rtt ? `${network.rtt}ms` : '—'} />
                        <MetricRow
                            label="Service worker"
                            mono={false}
                            value={
                                <Badge variant={'serviceWorker' in navigator ? 'default' : 'secondary'}>
                                    {'serviceWorker' in navigator ? 'Supported' : 'Unavailable'}
                                </Badge>
                            }
                        />
                        <MetricRow
                            label="JS heap"
                            value={
                                memory
                                    ? `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} / ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
                                    : '—'
                            }
                        />
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardContent className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Cloud className="size-3.5" />
                            <span>
                                Auto-refresh every {REFRESH_INTERVAL_MS / 1000}s · last updated{' '}
                                {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : '—'}
                            </span>
                        </div>
                        <span>Showing {history.length} of last {HISTORY_LIMIT} samples</span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
