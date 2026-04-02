import AdminCharts from '@/Components/Dashboard/AdminCharts';
import LecturerCharts from '@/Components/Dashboard/LecturerCharts';
import LottieBanner from '@/Components/Dashboard/LottieBanner';
import StatCard from '@/Components/Dashboard/StatCard';
import StudentCharts from '@/Components/Dashboard/StudentCharts';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { DashboardPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const {
        role,
        lottieUrl,
        student,
        lecturer,
        admin,
    } = usePage<DashboardPageProps>().props;

    const user = usePage<DashboardPageProps>().props.auth.user;

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
                                    Selamat datang kembali
                                </p>
                                <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                    Hai, {user?.name ?? 'Pengguna'}
                                </h1>
                                <p className="mt-3 max-w-lg text-base text-gray-600">
                                    {role === 'student' &&
                                        'Pantau progres ujian dan performa per level di sini.'}
                                    {role === 'lecturer' &&
                                        'Ringkasan soal yang Anda kelola.'}
                                    {role === 'admin' &&
                                        'Ringkasan sistem dan aktivitas ujian.'}
                                </p>
                                {role === 'student' && (
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <Link
                                            href={route('student.exams.index')}
                                            className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                                        >
                                            Mulai / lanjut ujian
                                        </Link>
                                        <Link
                                            href={route(
                                                'student.rankings.index',
                                            )}
                                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                                        >
                                            Peringkat
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
                                        Anda belum memiliki riwayat ujian.
                                        Mulai dari halaman ujian untuk mengisi
                                        grafik ini.
                                    </div>
                                )}
                            <div className="grid gap-4 sm:grid-cols-3">
                                <StatCard
                                    title="Ujian selesai"
                                    value={student.completedCount}
                                    hint="Sesi completed / timed out"
                                    accent="teal"
                                />
                                <StatCard
                                    title="Rata-rata skor"
                                    value={
                                        student.averageScorePercent != null
                                            ? `${student.averageScorePercent}%`
                                            : '—'
                                    }
                                    hint="Dari semua sesi selesai"
                                    accent="indigo"
                                />
                                <StatCard
                                    title="Sedang berlangsung"
                                    value={student.inProgressCount}
                                    hint="Sesi in progress"
                                    accent="amber"
                                />
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
                                    title="Total soal"
                                    value={lecturer.totalQuestions}
                                    accent="teal"
                                />
                                <StatCard
                                    title="Soal aktif"
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
                                    title="Total pengguna"
                                    value={admin.totalUsers}
                                    accent="teal"
                                />
                                <StatCard
                                    title="Sesi ujian selesai"
                                    value={admin.completedExamSessions}
                                    hint="Completed + timed out"
                                    accent="indigo"
                                />
                                <StatCard
                                    title="Mahasiswa"
                                    value={admin.usersByRole.student}
                                    hint="Akun peran student"
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
