import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

type LevelRow = {
    id: number;
    name: string;
    order: number;
};

type RankingEntry = {
    rank: number;
    session_id: number;
    user_id: number;
    user_name: string;
    total_score: number;
    max_possible_score: number;
    status: string;
    duration_seconds: number | null;
    level_name?: string;
};

type RankingBucket = {
    top: RankingEntry[];
    my_rank: number | null;
};

type RankingsMode = 'latest' | 'allAttempts';

function formatSeconds(v: number | null): string {
    if (v === null) {
        return '-';
    }
    const mm = String(Math.floor(v / 60)).padStart(2, '0');
    const ss = String(v % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function RankingTable({
    rows,
    showLevel = false,
    myUserId,
}: {
    rows: RankingEntry[];
    showLevel?: boolean;
    myUserId: number;
}) {
    if (!rows.length) {
        return (
            <p className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-6 text-center text-sm text-indigo-700">
                No ranking data yet.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Student
                        </th>
                        {showLevel && (
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                Level
                            </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.map((row) => (
                        <tr
                            key={`session-${row.session_id}`}
                            className={[
                                'transition hover:bg-indigo-50/40',
                                row.user_id === myUserId
                                    ? 'bg-indigo-50/60'
                                    : '',
                            ].join(' ')}
                        >
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                <span
                                    className={[
                                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold',
                                        row.rank === 1
                                            ? 'bg-amber-100 text-amber-700'
                                            : row.rank === 2
                                              ? 'bg-slate-200 text-slate-700'
                                              : row.rank === 3
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-gray-100 text-gray-700',
                                    ].join(' ')}
                                >
                                    #{row.rank}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                                {row.user_name}
                                {row.user_id === myUserId ? (
                                    <span className="ml-2 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                                        Me
                                    </span>
                                ) : null}
                            </td>
                            {showLevel && (
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {row.level_name ?? '-'}
                                </td>
                            )}
                            <td className="px-4 py-3 text-sm tabular-nums text-gray-700">
                                {row.total_score}/{row.max_possible_score}
                            </td>
                            <td className="px-4 py-3 text-sm tabular-nums text-gray-700">
                                {formatSeconds(row.duration_seconds)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                                <span
                                    className={[
                                        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                                        row.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700',
                                    ].join(' ')}
                                >
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function Index({
    levels,
    globalLeaderboardLatest,
    globalLeaderboardAllAttempts,
    leaderboardByLevelLatest,
    leaderboardByLevelAllAttempts,
}: {
    levels: LevelRow[];
    globalLeaderboardLatest: RankingBucket;
    globalLeaderboardAllAttempts: RankingBucket;
    leaderboardByLevelLatest: Record<string, RankingBucket>;
    leaderboardByLevelAllAttempts: Record<string, RankingBucket>;
}) {
    const [mode, setMode] = useState<RankingsMode>('latest');
    const userId = usePage().props.auth?.user?.id ?? 0;

    const global =
        mode === 'latest' ? globalLeaderboardLatest : globalLeaderboardAllAttempts;
    const byLevel =
        mode === 'latest' ? leaderboardByLevelLatest : leaderboardByLevelAllAttempts;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Student Rankings
                    </h2>
                    <div
                        className="inline-flex rounded-xl border border-indigo-200 bg-indigo-50/80 p-1"
                        role="group"
                        aria-label="Mode ranking"
                    >
                        <button
                            type="button"
                            onClick={() => setMode('latest')}
                            aria-pressed={mode === 'latest'}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                mode === 'latest'
                                    ? 'bg-white text-indigo-900 shadow-sm'
                                    : 'text-indigo-600 hover:text-indigo-900'
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1`}
                        >
                            Latest per student
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('allAttempts')}
                            aria-pressed={mode === 'allAttempts'}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                mode === 'allAttempts'
                                    ? 'bg-white text-indigo-900 shadow-sm'
                                    : 'text-indigo-600 hover:text-indigo-900'
                            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1`}
                        >
                            All attempts
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Student Rankings" />
            <div className="bg-[radial-gradient(ellipse_120%_80%_at_10%_-10%,rgba(99,102,241,0.18),transparent_50%),radial-gradient(ellipse_100%_80%_at_100%_0%,rgba(56,189,248,0.16),transparent_55%),linear-gradient(180deg,#eef2ff_0%,#ffffff_45%,#ecfeff_100%)] py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <p className="rounded-xl border border-indigo-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
                        {mode === 'latest'
                            ? 'One row per student (using latest completed session).'
                            : 'Each exam attempt is shown as a separate row.'}
                    </p>
                    <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-indigo-100">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">
                                Global Ranking
                            </h3>
                            <span className="text-sm text-gray-600">
                                My rank: {global.my_rank ?? '-'}
                            </span>
                        </div>
                        <RankingTable
                            rows={global.top}
                            showLevel
                            myUserId={userId}
                        />
                    </div>

                    <div className="space-y-4">
                        {levels.map((level) => {
                            const data =
                                byLevel[String(level.id)] ?? {
                                    top: [],
                                    my_rank: null,
                                };
                            return (
                                <div
                                    key={level.id}
                                    className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-indigo-100"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-gray-900">
                                            {level.name} Ranking
                                        </h3>
                                        <span className="text-sm text-gray-600">
                                            My rank: {data.my_rank ?? '-'}
                                        </span>
                                    </div>
                                    <RankingTable
                                        rows={data.top}
                                        myUserId={userId}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
