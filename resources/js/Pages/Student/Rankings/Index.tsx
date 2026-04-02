import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
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
}: {
    rows: RankingEntry[];
    showLevel?: boolean;
}) {
    if (!rows.length) {
        return (
            <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                Belum ada data ranking.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                            Waktu
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
                        >
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                #{row.rank}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                                {row.user_name}
                            </td>
                            {showLevel && (
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {row.level_name ?? '-'}
                                </td>
                            )}
                            <td className="px-4 py-3 text-sm text-gray-700">
                                {row.total_score}/{row.max_possible_score}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                                {formatSeconds(row.duration_seconds)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                                {row.status}
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

    const global =
        mode === 'latest' ? globalLeaderboardLatest : globalLeaderboardAllAttempts;
    const byLevel =
        mode === 'latest' ? leaderboardByLevelLatest : leaderboardByLevelAllAttempts;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Peringkat Student
                    </h2>
                    <div
                        className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
                        role="group"
                        aria-label="Mode ranking"
                    >
                        <button
                            type="button"
                            onClick={() => setMode('latest')}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                mode === 'latest'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Terbaru per student
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('allAttempts')}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                mode === 'allAttempts'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Semua attempt
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Peringkat Student" />
            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-600">
                        {mode === 'latest'
                            ? 'Satu baris per student (menggunakan sesi selesai terakhir).'
                            : 'Setiap percobaan ujian tampil sebagai baris terpisah.'}
                    </p>
                    <div className="rounded-lg bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">
                                Global Ranking
                            </h3>
                            <span className="text-sm text-gray-600">
                                Peringkat saya: {global.my_rank ?? '-'}
                            </span>
                        </div>
                        <RankingTable rows={global.top} showLevel />
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
                                    className="rounded-lg bg-white p-5 shadow-sm"
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-gray-900">
                                            Ranking {level.name}
                                        </h3>
                                        <span className="text-sm text-gray-600">
                                            Peringkat saya: {data.my_rank ?? '-'}
                                        </span>
                                    </div>
                                    <RankingTable rows={data.top} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
