import AdminCharts from '@/Components/Dashboard/AdminCharts';
import LecturerCharts from '@/Components/Dashboard/LecturerCharts';
import LottieBanner from '@/Components/Dashboard/LottieBanner';
import StatCard from '@/Components/Dashboard/StatCard';
import StudentCharts from '@/Components/Dashboard/StudentCharts';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { DashboardPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const props = usePage<DashboardPageProps>().props;
    const {
        role,
        lottieUrl,
        student,
        lecturer,
        admin,
    } = props;

    const user = props.auth?.user ?? null;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="flex h-full flex-col overflow-y-auto">
                <div className="border-b border-teal-100/80 bg-gradient-to-r from-teal-50/90 via-white to-indigo-50/80">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                                    Welcome back
                                </p>
                                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                    Hi, {user?.name ?? 'User'}
                                </h1>
                                <p className="mt-3 max-w-lg text-base text-gray-600">
                                    {role === 'student' &&
                                        'Track your exam progress and performance by level here.'}
                                    {role === 'lecturer' &&
                                        'Overview of questions you manage.'}
                                    {role === 'admin' &&
                                        'System overview and exam activity summary.'}
                                </p>
                                {role === 'student' && (
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <Link
                                            href={route('student.exams.index')}
                                            className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                                        >
                                            Start / continue exam
                                        </Link>
                                        <Link
                                            href={route(
                                                'student.rankings.index',
                                            )}
                                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                                        >
                                            Rankings
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <LottieBanner url={lottieUrl} />
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                    {role === 'student' && student && (
                        <div className="space-y-8">
                            {student.completedCount === 0 &&
                                student.inProgressCount === 0 && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                                        You don't have any exam history yet.
                                        Start from the exam page to populate
                                        these charts.
                                    </div>
                                )}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <StatCard
                                    title="Completed exams"
                                    value={student.completedCount}
                                    hint="Completed / timed out sessions"
                                    accent="teal"
                                />
                                <StatCard
                                    title="Average score"
                                    value={
                                        student.averageScorePercent != null
                                            ? `${student.averageScorePercent}%`
                                            : '—'
                                    }
                                    hint="From all completed sessions"
                                    accent="indigo"
                                />
                                <StatCard
                                    title="In progress"
                                    value={student.inProgressCount}
                                    hint="In-progress sessions"
                                    accent="amber"
                                />
                            </div>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-800">
                                            Daily Activity
                                        </p>
                                        <p className="mt-1 text-sm text-emerald-700">
                                            Today:{' '}
                                            {
                                                student.dailyActivity
                                                    .todayAnsweredCount
                                            }
                                            /
                                            {
                                                student.dailyActivity.maxAllowed
                                            }{' '}
                                            questions · Streak{' '}
                                            {
                                                student.dailyActivity
                                                    .currentStreak
                                            }{' '}
                                            days
                                        </p>
                                        <p className="mt-1 text-xs text-emerald-700">
                                            Weekly progress:{' '}
                                            {
                                                student.dailyActivity
                                                    .weeklyProgressDays
                                            }
                                            /7 days · Total reward points:{' '}
                                            {
                                                student.dailyActivity
                                                    .rewardPointsTotal
                                            }
                                        </p>
                                    </div>
                                    <Link
                                        href={route('student.daily-activity.index')}
                                        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                    >
                                        Open Daily Activity
                                    </Link>
                                </div>
                            </div>
                            <StudentCharts
                                recentScores={student.recentScores}
                                scoresByLevel={student.scoresByLevel}
                            />
                        </div>
                    )}

                    {role === 'lecturer' && lecturer && (
                        <div className="space-y-8">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <StatCard
                                    title="Total questions"
                                    value={lecturer.totalQuestions}
                                    accent="teal"
                                />
                                <StatCard
                                    title="Active questions"
                                    value={lecturer.activeQuestions}
                                    hint="is_active = true"
                                    accent="indigo"
                                />
                            </div>
                            <LecturerCharts
                                questionsBySkill={lecturer.questionsBySkill}
                            />
                        </div>
                    )}

                    {role === 'admin' && admin && (
                        <div className="space-y-8">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <StatCard
                                    title="Total users"
                                    value={admin.totalUsers}
                                    accent="teal"
                                />
                                <StatCard
                                    title="Completed exam sessions"
                                    value={admin.completedExamSessions}
                                    hint="Completed + timed out"
                                    accent="indigo"
                                />
                                <StatCard
                                    title="Students"
                                    value={admin.usersByRole.student}
                                    hint="Student role accounts"
                                    accent="amber"
                                />
                            </div>
                            <AdminCharts usersByRole={admin.usersByRole} />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
