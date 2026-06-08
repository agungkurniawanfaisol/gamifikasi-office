import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import MobileSidebarDrawer from '@/Components/MobileSidebarDrawer';
import SidebarNav from '@/Components/SidebarNav';
import { useAuditTrailTracker } from '@/hooks/useAuditTrailTracker';
import type { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

export default function Authenticated({
    header,
    children,
    examMode = false,
}: PropsWithChildren<{ header?: ReactNode; examMode?: boolean }>) {
    const user = usePage<PageProps>().props.auth?.user ?? null;
    const displayName = user?.name?.trim() ? user.name : 'User';
    const displayInitial = displayName.charAt(0).toUpperCase();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
    useAuditTrailTracker(Boolean(user?.id));

    useEffect(() => {
        if (examMode || typeof window === 'undefined') {
            return;
        }

        const stored = window.localStorage.getItem('sidebar:collapsed');
        setDesktopSidebarCollapsed(stored === '1');
    }, [examMode]);

    useEffect(() => {
        if (examMode || typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(
            'sidebar:collapsed',
            desktopSidebarCollapsed ? '1' : '0',
        );
    }, [desktopSidebarCollapsed, examMode]);

    return (
        <div
            className={
                examMode
                    ? 'h-dvh max-h-dvh overflow-hidden bg-[#0f172a]'
                    : 'h-screen overflow-hidden bg-[radial-gradient(ellipse_130%_90%_at_100%_-10%,rgba(99,102,241,0.14),transparent_55%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_55%,#eef2ff_100%)]'
            }
        >
            <MobileSidebarDrawer
                open={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
                title={
                    <div className="flex items-center gap-2">
                        <ApplicationLogo className="h-6 w-6 fill-current text-gray-900" />
                        <span>Gamifikasi</span>
                    </div>
                }
            />

            <div
                className={
                    examMode
                        ? 'flex h-dvh min-h-0'
                        : 'flex h-screen'
                }
            >
                <aside
                    className={
                        examMode
                            ? 'hidden'
                            : [
                                  'hidden shrink-0 border-r border-indigo-100/80 bg-white/95 backdrop-blur transition-all duration-300 md:block',
                                  desktopSidebarCollapsed
                                      ? 'w-0 overflow-hidden border-r-0 opacity-0'
                                      : 'w-72 opacity-100',
                              ].join(' ')
                    }
                >
                    <div className="relative flex h-16 items-center gap-2 border-b border-indigo-100/80 px-5">
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent" />
                        <Link href="/" className="flex items-center gap-2">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                                <ApplicationLogo className="h-6 w-6 fill-current text-white" />
                            </span>
                            <span className="text-base font-semibold text-gray-900">
                                Gamifikasi
                            </span>
                        </Link>
                    </div>
                    <div className="no-scrollbar h-[calc(100vh-64px)] overflow-y-auto">
                        <SidebarNav />
                    </div>
                </aside>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <nav
                        className={
                            examMode
                                ? 'z-40 shrink-0 border-b border-white/10 bg-slate-900/90 backdrop-blur-md'
                                : 'sticky top-0 z-40 border-b border-indigo-100/80 bg-white/90 backdrop-blur-xl'
                        }
                    >
                        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-2">
                                {!examMode && (
                                <button
                                    type="button"
                                    className="rounded-lg p-2 text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 md:hidden"
                                    onClick={() => setMobileSidebarOpen(true)}
                                    aria-label="Open sidebar"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-6 w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                </button>
                                )}
                                {!examMode && (
                                    <button
                                        type="button"
                                        className="hidden rounded-lg p-2 text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 md:inline-flex"
                                        onClick={() =>
                                            setDesktopSidebarCollapsed((prev) => !prev)
                                        }
                                        aria-label={
                                            desktopSidebarCollapsed
                                                ? 'Expand sidebar'
                                                : 'Collapse sidebar'
                                        }
                                        title={
                                            desktopSidebarCollapsed
                                                ? 'Expand sidebar'
                                                : 'Collapse sidebar'
                                        }
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                        </svg>
                                    </button>
                                )}

                                <div
                                    className={
                                        examMode
                                            ? 'flex items-center gap-2'
                                            : 'flex items-center gap-2 md:hidden'
                                    }
                                >
                                    <Link
                                        href="/"
                                        className="flex items-center gap-2"
                                    >
                                        <ApplicationLogo
                                            className={
                                                examMode
                                                    ? 'h-7 w-7 fill-current text-teal-400'
                                                    : 'h-7 w-7 fill-current text-indigo-600'
                                            }
                                        />
                                        <span
                                            className={
                                                examMode
                                                    ? 'text-sm font-semibold text-white'
                                                    : 'text-sm font-semibold text-gray-900'
                                            }
                                        >
                                            Gamifikasi
                                        </span>
                                    </Link>
                                    {examMode && (
                                        <span className="hidden rounded-full border border-teal-500/40 bg-teal-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300 sm:inline">
                                            Exam Mode
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className={
                                                        examMode
                                                            ? 'inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium leading-4 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
                                                            : 'inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/95 px-3 py-2 text-sm font-medium leading-4 text-gray-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2'
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            examMode
                                                                ? 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-xs font-semibold text-white'
                                                                : 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-semibold text-white'
                                                        }
                                                    >
                                                        {displayInitial}
                                                    </span>
                                                    {displayName}
                                                    <svg
                                                        className="ms-2 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link
                                                href={route('profile.edit')}
                                            >
                                                Profile
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    </nav>

                    {header && (
                        <header
                            className={
                                examMode
                                    ? 'border-b border-white/10 bg-slate-900/50'
                                    : 'border-b border-indigo-100/80 bg-white/75 backdrop-blur'
                            }
                        >
                            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                                {header}
                            </div>
                        </header>
                    )}

                    <main
                        className={
                            examMode
                                ? 'min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#0f172a]'
                                : 'min-w-0 flex-1 overflow-y-auto'
                        }
                    >
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
