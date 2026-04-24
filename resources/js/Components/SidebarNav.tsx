import { Link, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';

type Role = 'admin' | 'lecturer' | 'student' | undefined;

function NavItem({
    href,
    active,
    children,
    onNavigate,
    menuKey,
}: {
    href: string;
    active: boolean;
    children: ReactNode;
    onNavigate?: () => void;
    menuKey?: string;
}) {
    return (
        <Link
            href={href}
            className={[
                'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2',
                active
                    ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 text-white shadow-md shadow-indigo-200'
                    : 'text-gray-700 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm',
            ].join(' ')}
            onClick={onNavigate}
            data-menu-key={menuKey}
            data-audit="sidebar-nav-item"
        >
            <span
                className={[
                    'inline-block h-1.5 w-1.5 rounded-full transition',
                    active
                        ? 'bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.35)]'
                        : 'bg-gray-300 group-hover:bg-indigo-500',
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
    const transactionsActive = route().current('admin.exam-headers.*')
        || route().current('admin.exam-session-feedback.*')
        || route().current('admin.student-monitoring.*')
        || route().current('admin.instructor-insights.*');
    const mainActive = route().current('dashboard')
        || route().current('student.exams.*')
        || route().current('student.daily-activity.*')
        || route().current('student.learning-history.*')
        || route().current('student.priority-practice.*')
        || route().current('student.rankings.*');
    const masterActive = route().current('admin.users.*')
        || route().current('lecturer.questions.*')
        || route().current('admin.audit-trails.*');
    const accountActive = route().current('profile.*');

    const [transactionsOpen, setTransactionsOpen] = useState(transactionsActive);
    const [mainOpen, setMainOpen] = useState(mainActive);
    const [masterOpen, setMasterOpen] = useState(masterActive);
    const [accountOpen, setAccountOpen] = useState(accountActive);

    useEffect(() => {
        if (transactionsActive) {
            setTransactionsOpen(true);
        }
    }, [transactionsActive]);

    useEffect(() => {
        if (mainActive) {
            setMainOpen(true);
        }
    }, [mainActive]);

    useEffect(() => {
        if (masterActive) {
            setMasterOpen(true);
        }
    }, [masterActive]);

    useEffect(() => {
        if (accountActive) {
            setAccountOpen(true);
        }
    }, [accountActive]);

    return (
        <div className="flex h-full flex-col gap-2 px-2 py-2">
            {(role === 'admin' || role === 'lecturer') && (
                <div className="rounded-2xl border border-indigo-100/70 bg-gradient-to-br from-indigo-50/70 via-white to-cyan-50/50 px-3 pb-3 pt-4">
                    <button
                        type="button"
                        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-indigo-700"
                        onClick={() => setTransactionsOpen((prev) => !prev)}
                    >
                        <span>Transactions</span>
                        <Chevron open={transactionsOpen} />
                    </button>
                    {transactionsOpen && (
                    <div className="mt-2 space-y-1">
                        <NavItem
                            href={route('admin.exam-headers.index')}
                            active={route().current('admin.exam-headers.*')}
                            onNavigate={onNavigate}
                            menuKey="admin.exam_headers"
                        >
                            Exam Headers
                        </NavItem>
                        <NavItem
                            href={route('admin.exam-session-feedback.index')}
                            active={route().current(
                                'admin.exam-session-feedback.*',
                            )}
                            onNavigate={onNavigate}
                            menuKey="admin.exam_session_feedback"
                        >
                            Exam Feedback
                        </NavItem>
                        <NavItem
                            href={route('admin.student-monitoring.index')}
                            active={route().current(
                                'admin.student-monitoring.*',
                            )}
                            onNavigate={onNavigate}
                            menuKey="admin.student_monitoring"
                        >
                            Answer Monitoring
                        </NavItem>
                        <NavItem
                            href={route('admin.instructor-insights.index')}
                            active={route().current(
                                'admin.instructor-insights.*',
                            )}
                            onNavigate={onNavigate}
                            menuKey="admin.instructor_insights"
                        >
                            Instructor Insights
                        </NavItem>
                    </div>
                    )}
                </div>
            )}

            <div className="rounded-2xl border border-gray-100/80 bg-white/80 px-3 pb-3 pt-4">
                <button
                    type="button"
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500"
                    onClick={() => setMainOpen((prev) => !prev)}
                >
                    <span>Main</span>
                    <Chevron open={mainOpen} />
                </button>
                {mainOpen && (
                <div className="mt-2 space-y-1">
                    {role === 'student' && (
                        <>
                            <NavItem
                                href={route('student.exams.index')}
                                active={route().current('student.exams.*')}
                                onNavigate={onNavigate}
                                menuKey="student.exams"
                            >
                                Exams
                            </NavItem>
                            <NavItem
                                href={route('student.daily-activity.index')}
                                active={route().current(
                                    'student.daily-activity.*',
                                )}
                                onNavigate={onNavigate}
                                menuKey="student.daily_activity"
                            >
                                Daily Activity
                            </NavItem>
                            <NavItem
                                href={route('student.learning-history.index')}
                                active={route().current(
                                    'student.learning-history.*',
                                )}
                                onNavigate={onNavigate}
                                menuKey="student.learning_history"
                            >
                                Learning History
                            </NavItem>
                            <NavItem
                                href={route('student.priority-practice.index')}
                                active={route().current(
                                    'student.priority-practice.*',
                                )}
                                onNavigate={onNavigate}
                                menuKey="student.priority_practice"
                            >
                                Priority Practice
                            </NavItem>
                            <NavItem
                                href={route('student.rankings.index')}
                                active={route().current('student.rankings.*')}
                                onNavigate={onNavigate}
                                menuKey="student.rankings"
                            >
                                Rankings
                            </NavItem>
                        </>
                    )}
                    <NavItem
                        href={route('dashboard')}
                        active={route().current('dashboard')}
                        onNavigate={onNavigate}
                        menuKey="dashboard"
                    >
                        Dashboard
                    </NavItem>
                </div>
                )}
            </div>

            {(role === 'admin' || role === 'lecturer') && (
                <div className="rounded-2xl border border-gray-100/80 bg-white/80 px-3 py-3">
                    <button
                        type="button"
                        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500"
                        onClick={() => setMasterOpen((prev) => !prev)}
                    >
                        <span>Master</span>
                        <Chevron open={masterOpen} />
                    </button>
                    {masterOpen && (
                    <div className="mt-2 space-y-1">
                        {role === 'admin' && (
                            <NavItem
                                href={route('admin.users.index')}
                                active={route().current('admin.users.*')}
                                onNavigate={onNavigate}
                                menuKey="admin.users"
                            >
                                Users
                            </NavItem>
                        )}
                        {(role === 'lecturer' || role === 'admin') && (
                            <NavItem
                                href={route('lecturer.questions.index')}
                                active={route().current('lecturer.questions.*')}
                                onNavigate={onNavigate}
                                menuKey="lecturer.questions"
                            >
                                Question Bank
                            </NavItem>
                        )}
                        <NavItem
                            href={route('admin.audit-trails.index')}
                            active={route().current('admin.audit-trails.*')}
                            onNavigate={onNavigate}
                            menuKey="admin.audit_trails"
                        >
                            Audit Trail
                        </NavItem>
                    </div>
                    )}
                </div>
            )}

            <div className="mt-auto rounded-2xl border border-indigo-100/70 bg-gradient-to-r from-indigo-50/70 via-white to-violet-50/60 px-3 py-3">
                <button
                    type="button"
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-indigo-700"
                    onClick={() => setAccountOpen((prev) => !prev)}
                >
                    <span>Account</span>
                    <Chevron open={accountOpen} />
                </button>
                {accountOpen && (
                <div className="mt-2 space-y-1">
                    <NavItem
                        href={route('profile.edit')}
                        active={route().current('profile.*')}
                        onNavigate={onNavigate}
                        menuKey="profile"
                    >
                        Profile
                    </NavItem>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                        onClick={onNavigate}
                        data-menu-key="logout"
                        data-audit="logout-button"
                    >
                        Log out
                    </Link>
                </div>
                )}
            </div>
        </div>
    );
}

function Chevron({ open }: { open: boolean }) {
    return (
        <svg
            viewBox="0 0 20 20"
            className={['h-4 w-4 transition-transform', open ? 'rotate-180' : 'rotate-0'].join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
        </svg>
    );
}

