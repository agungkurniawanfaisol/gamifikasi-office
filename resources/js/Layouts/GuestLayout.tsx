import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-teal-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />

            <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
                <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/95 shadow-2xl shadow-black/30 lg:grid-cols-2">
                    <div className="relative hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-indigo-700 p-10 text-white lg:block">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                            Gamifikasi Learning
                        </p>
                        <h2 className="mt-4 text-3xl font-extrabold leading-tight">
                            Learn consistently, with visible progress.
                        </h2>
                        <p className="mt-4 max-w-md text-sm text-cyan-50/90">
                            Interactive learning platform for students, lecturers, and admins with clear progress tracking.
                        </p>

                        <div className="mt-8 space-y-3">
                            <div className="rounded-xl border border-white/20 bg-white/15 p-3 text-sm">
                                Daily Activity 2-5 questions per day.
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/15 p-3 text-sm">
                                Global and per-level rankings.
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/15 p-3 text-sm">
                                Exam feedback is saved automatically.
                            </div>
                        </div>

                        <div className="mt-10">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
                            >
                                <ApplicationLogo className="h-5 w-5" />
                                Back to landing page
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center justify-center bg-white px-5 py-8 sm:px-8">
                        <div className="w-full max-w-md">
                            <div className="mb-6 flex items-center justify-center lg:hidden">
                                <Link href="/" className="inline-flex items-center gap-2">
                                    <ApplicationLogo className="h-10 w-10" />
                                    <span className="text-sm font-semibold text-slate-700">
                                        Gamifikasi Learning
                                    </span>
                                </Link>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
