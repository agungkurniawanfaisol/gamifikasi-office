import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({
    auth,
    canLogin,
    canRegister,
    laravelVersion,
    phpVersion,
}: PageProps<{
    canLogin: boolean;
    canRegister: boolean;
    laravelVersion: string;
    phpVersion: string;
}>) {
    const features = [
        'Belajar adaptif berdasarkan level kemampuan',
        'Ujian dengan timer total dan timer per soal',
        'Ranking global dan per-level secara real-time',
        'Feedback pasca ujian + rating bintang',
        'Manajemen soal untuk admin dan lecturer',
        'UI mobile-first yang tetap nyaman di desktop',
    ];

    const steps = [
        {
            no: '01',
            title: 'Pilih level',
            desc: 'Student memilih Basic, Intermediate, atau Advanced sesuai kesiapan.',
        },
        {
            no: '02',
            title: 'Kerjakan ujian',
            desc: 'Simpan jawaban, lanjut soal berikutnya, dan pantau timer.',
        },
        {
            no: '03',
            title: 'Dapatkan hasil',
            desc: 'Skor dihitung otomatis dan posisi ranking langsung terlihat.',
        },
        {
            no: '04',
            title: 'Kirim testimonial',
            desc: 'Berikan rating bintang dan masukan untuk peningkatan kualitas.',
        },
    ];

    return (
        <>
            <Head title="Beranda">
                <link
                    rel="stylesheet"
                    href="https://fonts.bunny.net/css?family=outfit:500,600,700|nunito:400,500,600,700&display=swap"
                />
            </Head>

            <div
                className="relative min-h-screen overflow-x-hidden text-[#1c1917]"
                style={{
                    fontFamily: "'Nunito', ui-sans-serif, system-ui, sans-serif",
                }}
            >
                {/* Soft gradient + grain feel */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(251,146,60,0.18),transparent_55%),radial-gradient(ellipse_90%_60%_at_100%_0%,rgba(20,184,166,0.12),transparent_50%),linear-gradient(180deg,#fdf8f3_0%,#fff7ed_45%,#fffbeb_100%)]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-multiply"
                    style={{
                        backgroundImage:
                            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.06\'/%3E%3C/svg%3E")',
                    }}
                />

                <header className="fixed inset-x-0 top-0 z-40 px-4 pt-3 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-lg shadow-stone-900/10 backdrop-blur-md sm:px-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <Link
                            href="/"
                            className="group flex items-center gap-2 text-left"
                        >
                            <span
                                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-lg font-bold text-white shadow-lg shadow-orange-500/25 transition group-hover:scale-[1.02]"
                                style={{
                                    fontFamily: "'Outfit', sans-serif",
                                }}
                            >
                                G
                            </span>
                            <span>
                                <span
                                    className="block text-lg font-bold leading-tight text-stone-900"
                                    style={{
                                        fontFamily: "'Outfit', sans-serif",
                                    }}
                                >
                                    Gamifikasi
                                </span>
                                <span className="text-xs font-medium text-stone-500">
                                    Belajar dengan semangat
                                </span>
                            </span>
                        </Link>

                            <nav
                                className="flex flex-wrap items-center justify-end gap-2 sm:gap-3"
                                aria-label="Utama"
                            >
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        {canLogin && (
                                            <Link
                                                href={route('login')}
                                                className="rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                                            >
                                                Masuk
                                            </Link>
                                        )}
                                        {canRegister && (
                                            <Link
                                                href={route('register')}
                                                className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
                                            >
                                                Daftar gratis
                                            </Link>
                                        )}
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-12 pt-28 sm:px-6 lg:px-8">

                    <section className="mt-10 flex flex-1 flex-col items-center text-center lg:mt-16">
                        <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900/80 shadow-sm backdrop-blur-sm">
                            <span
                                className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"
                                aria-hidden
                            />
                            Platform pembelajaran interaktif
                        </p>

                        <h1
                            className="mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl"
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                            Belajar makin seru dengan{' '}
                            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-teal-600 bg-clip-text text-transparent">
                                cerita & tantangan
                            </span>
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">
                            Latih skill, kerjakan soal, dan kumpulkan progres
                            harian — dirancang agar nyaman di{' '}
                            <span className="font-semibold text-stone-800">
                                HP maupun laptop
                            </span>
                            .
                        </p>

                        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-8 py-3.5 text-base font-semibold text-white shadow-xl transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                                >
                                    Lanjut ke dashboard
                                </Link>
                            ) : (
                                <>
                                    {canRegister && (
                                        <Link
                                            href={route('register')}
                                            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-orange-500/30 transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                                        >
                                            Mulai belajar sekarang
                                        </Link>
                                    )}
                                    {canLogin && (
                                        <Link
                                            href={route('login')}
                                            className="inline-flex items-center justify-center rounded-2xl border-2 border-stone-200 bg-white/80 px-8 py-3.5 text-base font-semibold text-stone-800 shadow-sm backdrop-blur transition hover:border-stone-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
                                        >
                                            Sudah punya akun?
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="mt-12 grid w-full gap-4 text-left sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                                <p className="text-2xl font-bold text-stone-900">
                                    1000+
                                </p>
                                <p className="text-sm text-stone-600">
                                    bank soal siap pakai
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                                <p className="text-2xl font-bold text-stone-900">
                                    3 Level
                                </p>
                                <p className="text-sm text-stone-600">
                                    Basic, Intermediate, Advanced
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                                <p className="text-2xl font-bold text-stone-900">
                                    Mobile First
                                </p>
                                <p className="text-sm text-stone-600">
                                    nyaman dipakai di HP
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mt-14">
                        <div className="mb-5 text-left">
                            <h2
                                className="text-2xl font-bold text-stone-900 sm:text-3xl"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                                Semua kebutuhan belajar di satu platform
                            </h2>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((item) => (
                                <article
                                    key={item}
                                    className="rounded-2xl border border-white/70 bg-white/80 p-5 text-left shadow-sm"
                                >
                                    <p className="text-sm font-semibold text-stone-800">
                                        {item}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="mt-14">
                        <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50 p-6 sm:p-8">
                            <h2
                                className="text-left text-2xl font-bold text-stone-900 sm:text-3xl"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                                Alur belajar yang jelas
                            </h2>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {steps.map((step) => (
                                    <article
                                        key={step.no}
                                        className="rounded-2xl bg-white/80 p-5 text-left shadow-sm"
                                    >
                                        <p className="text-xs font-semibold tracking-widest text-teal-700">
                                            STEP {step.no}
                                        </p>
                                        <h3 className="mt-1 text-lg font-bold text-stone-900">
                                            {step.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-stone-600">
                                            {step.desc}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="mt-14 grid gap-4 lg:grid-cols-3">
                        <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm lg:col-span-2">
                            <h2
                                className="text-2xl font-bold text-stone-900"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                                Testimoni
                            </h2>
                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <blockquote className="rounded-2xl bg-amber-50 p-4 text-left">
                                    <p className="text-sm text-stone-700">
                                        “Saya jadi lebih disiplin karena alur
                                        belajarnya jelas dan ada target.”
                                    </p>
                                    <footer className="mt-2 text-xs font-semibold text-stone-500">
                                        Student
                                    </footer>
                                </blockquote>
                                <blockquote className="rounded-2xl bg-teal-50 p-4 text-left">
                                    <p className="text-sm text-stone-700">
                                        “Monitoring hasil kelas jauh lebih cepat
                                        dari sisi lecturer.”
                                    </p>
                                    <footer className="mt-2 text-xs font-semibold text-stone-500">
                                        Lecturer
                                    </footer>
                                </blockquote>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-stone-900 p-6 text-left text-white shadow-lg">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-300">
                                Siap mulai?
                            </p>
                            <h3
                                className="mt-2 text-2xl font-bold leading-tight"
                                style={{ fontFamily: "'Outfit', sans-serif" }}
                            >
                                Bangun kebiasaan belajar konsisten
                            </h3>
                            <p className="mt-3 text-sm text-stone-300">
                                Buat akun, pilih level, kerjakan ujian, lalu
                                lihat progresmu tiap hari.
                            </p>
                            <div className="mt-5">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-stone-900"
                                    >
                                        Buka Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={
                                            canRegister
                                                ? route('register')
                                                : route('login')
                                        }
                                        className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-stone-900"
                                    >
                                        {canRegister ? 'Daftar Gratis' : 'Masuk'}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </section>

                    <footer className="mt-auto border-t border-stone-200/80 pt-8 text-center text-xs text-stone-500">
                        <p>
                            {import.meta.env.VITE_APP_NAME ?? 'Gamifikasi Learning'}{' '}
                            · Laravel {laravelVersion} · PHP {phpVersion}
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}
