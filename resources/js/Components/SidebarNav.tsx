import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

type Role = 'admin' | 'lecturer' | 'student' | undefined;

function NavItem({
    href,
    active,
    children,
    onNavigate,
}: {
    href: string;
    active: boolean;
    children: ReactNode;
    onNavigate?: () => void;
}) {
    return (
        <Link
            href={href}
            className={[
                'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100',
            ].join(' ')}
            onClick={onNavigate}
        >
            <span
                className={[
                    'inline-block h-1.5 w-1.5 rounded-full transition',
                    active
                        ? 'bg-white'
                        : 'bg-gray-300 group-hover:bg-gray-500',
                ].join(' ')}
                aria-hidden
            />
            {children}
        </Link>
    );
}

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    const user = usePage().props.auth.user;
    const role: Role = user?.role;

    return (
        <div className="flex h-full flex-col px-2 py-2">
            {(role === 'admin' || role === 'lecturer') && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-3 pb-3 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Transaksi
                    </div>
                    <div className="mt-2 space-y-1">
                        <NavItem
                            href={route('admin.exam-headers.index')}
                            active={route().current('admin.exam-headers.*')}
                            onNavigate={onNavigate}
                        >
                            Header ujian
                        </NavItem>
                        <NavItem
                            href={route('admin.exam-session-feedback.index')}
                            active={route().current(
                                'admin.exam-session-feedback.*',
                            )}
                            onNavigate={onNavigate}
                        >
                            Feedback ujian
                        </NavItem>
                    </div>
                </div>
            )}

            <div className="px-3 pb-3 pt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Main
                </div>
                <div className="mt-2 space-y-1">
                    {role === 'student' && (
                        <>
                            <NavItem
                                href={route('student.exams.index')}
                                active={route().current('student.exams.*')}
                                onNavigate={onNavigate}
                            >
                                Ujian
                            </NavItem>
                            <NavItem
                                href={route('student.rankings.index')}
                                active={route().current('student.rankings.*')}
                                onNavigate={onNavigate}
                            >
                                Peringkat
                            </NavItem>
                        </>
                    )}
                    <NavItem
                        href={route('dashboard')}
                        active={route().current('dashboard')}
                        onNavigate={onNavigate}
                    >
                        Dashboard
                    </NavItem>
                </div>
            </div>

            {(role === 'admin' || role === 'lecturer') && (
                <div className="px-3 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Master
                    </div>
                    <div className="mt-2 space-y-1">
                        {role === 'admin' && (
                            <NavItem
                                href={route('admin.users.index')}
                                active={route().current('admin.users.*')}
                                onNavigate={onNavigate}
                            >
                                Users
                            </NavItem>
                        )}
                        {(role === 'lecturer' || role === 'admin') && (
                            <NavItem
                                href={route('lecturer.questions.index')}
                                active={route().current('lecturer.questions.*')}
                                onNavigate={onNavigate}
                            >
                                Bank Soal
                            </NavItem>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-auto rounded-2xl border border-gray-100 bg-gray-50/70 px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Account
                </div>
                <div className="mt-2 space-y-1">
                    <NavItem
                        href={route('profile.edit')}
                        active={route().current('profile.*')}
                        onNavigate={onNavigate}
                    >
                        Profile
                    </NavItem>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        onClick={onNavigate}
                    >
                        Log out
                    </Link>
                </div>
            </div>
        </div>
    );
}

