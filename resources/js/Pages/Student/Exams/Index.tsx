import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

type LevelRow = {
    id: number;
    name: string;
    order: number;
};

type InProgressRow = {
    id: number;
    level_id: number;
    started_at: string;
    duration_seconds: number | null;
    level?: { id: number; name: string };
};

type CompletedRow = {
    id: number;
    level_id: number;
    status: string;
    total_score: number | null;
    max_possible_score: number | null;
    duration_seconds: number | null;
    completed_at: string | null;
};

type LeaderboardEntry = {
    rank: number;
    user_id: number;
    user_name: string;
    total_score: number;
    max_possible_score: number;
    status: string;
    duration_seconds: number | null;
};

type LeaderboardRow = {
    top: LeaderboardEntry[];
    my_rank: number | null;
};

export default function Index({
    levels,
    inProgressByLevel,
    completedByLevel,
    leaderboardByLevel,
}: {
    levels: LevelRow[];
    inProgressByLevel: Record<string, InProgressRow>;
    completedByLevel: Record<string, CompletedRow>;
    leaderboardByLevel: Record<string, LeaderboardRow>;
}) {
    const [processing, setProcessing] = useState(false);

    const startExam = (levelId: number): void => {
        setProcessing(true);
        router.post(
            route('student.exams.start'),
            { level_id: levelId },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Choose Exam
                    </h2>
                </div>
            }
        >
            <Head title="Choose Exam" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        {levels.map((level) => {
                            const inProgress =
                                inProgressByLevel[String(level.id)];
                            const completed =
                                completedByLevel[String(level.id)];
                            const leaderboard =
                                leaderboardByLevel[String(level.id)];

                            return (
                                <div
                                    key={level.id}
                                    className="rounded-lg bg-white p-5 shadow-sm"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {level.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Select this level to start an exam.
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <PrimaryButton
                                            type="button"
                                            disabled={processing}
                                            onClick={() => startExam(level.id)}
                                        >
                                            Start
                                        </PrimaryButton>
                                        {inProgress && (
                                            <Link
                                                href={route(
                                                    'student.exams.show',
                                                    inProgress.id,
                                                )}
                                                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                                            >
                                                Continue
                                            </Link>
                                        )}
                                    </div>
                                    {completed && (
                                        <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm">
                                            <div className="font-semibold text-emerald-800">
                                                Score: {completed.total_score ?? 0}
                                                {' / '}
                                                {completed.max_possible_score ?? 0}
                                            </div>
                                            <div className="mt-1 text-emerald-700">
                                                Rank: {leaderboard?.my_rank ?? '-'}
                                            </div>
                                            <div className="mt-1 text-emerald-700">
                                                Status: {completed.status}
                                            </div>
                                        </div>
                                    )}
                                    {leaderboard?.top?.length ? (
                                        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                                            <p className="mb-2 text-xs font-semibold uppercase text-gray-600">
                                                Leaderboard
                                            </p>
                                            <div className="space-y-1 text-sm text-gray-700">
                                                {leaderboard.top.map((row) => (
                                                    <div
                                                        key={`${level.id}-${row.user_id}`}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span>
                                                            #{row.rank} {row.user_name}
                                                        </span>
                                                        <span className="font-semibold">
                                                            {row.total_score}/{row.max_possible_score}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

