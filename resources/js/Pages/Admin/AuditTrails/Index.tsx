import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type Filters = {
    from: string | null;
    to: string | null;
    user_id: number | null;
    user_role: 'admin' | 'lecturer' | 'student' | null;
    event_type:
        | 'ui_click'
        | 'navigation'
        | 'backend_action'
        | 'exam_event'
        | 'score_event'
        | null;
    event_key: string | null;
    route_name: string | null;
    menu_key: string | null;
    exam_session_id: number | null;
    score_min: number | null;
    score_max: number | null;
};

type EventRow = {
    id: number;
    user_id: number | null;
    user_role: string | null;
    event_type: string;
    event_key: string;
    route_name: string | null;
    page_url: string | null;
    menu_key: string | null;
    element_key: string | null;
    subject_type: string | null;
    subject_id: number | null;
    subject_label: string | null;
    exam_session_id: number | null;
    exam_header_id: number | null;
    score_before: number | null;
    score_after: number | null;
    score_delta: number | null;
    metadata: Record<string, unknown> | null;
    occurred_at: string;
    user: { id: number; name: string; email: string } | null;
};

type DetailItem = {
    label: string;
    value: string;
};

type AuditTrailPageProps = PageProps<{
    filters: Filters;
    users: Array<{ id: number; name: string; role: 'admin' | 'lecturer' | 'student' }>;
    events: {
        data: EventRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
}>;

export default function Index({ filters, users, events }: AuditTrailPageProps) {
    const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
    const [form, setForm] = useState({
        from: filters.from ?? '',
        to: filters.to ?? '',
        user_id: filters.user_id ? String(filters.user_id) : '',
        user_role: filters.user_role ?? '',
        event_type: filters.event_type ?? '',
        event_key: filters.event_key ?? '',
        route_name: filters.route_name ?? '',
        menu_key: filters.menu_key ?? '',
        exam_session_id: filters.exam_session_id ? String(filters.exam_session_id) : '',
        score_min: filters.score_min !== null ? String(filters.score_min) : '',
        score_max: filters.score_max !== null ? String(filters.score_max) : '',
    });

    const queryParams = useMemo(
        () => ({
            from: form.from || undefined,
            to: form.to || undefined,
            user_id: form.user_id || undefined,
            user_role: form.user_role || undefined,
            event_type: form.event_type || undefined,
            event_key: form.event_key || undefined,
            route_name: form.route_name || undefined,
            menu_key: form.menu_key || undefined,
            exam_session_id: form.exam_session_id || undefined,
            score_min: form.score_min || undefined,
            score_max: form.score_max || undefined,
        }),
        [form],
    );

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('admin.audit-trails.index'), queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-900">
                        User Activity History
                    </h2>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        Lecturer & Superadmin
                    </span>
                </div>
            }
        >
            <Head title="User Activity History" />

            <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
                    This page shows user activity trails such as menu clicks, page navigation, exam actions, and score changes. Use filters to view specific activities.
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Activities"
                        value={events.data.length}
                        caption="Number of activities on this page"
                    />
                    <StatCard
                        label="Exam Activities"
                        value={events.data.filter((item) => item.event_type === 'exam_event').length}
                        caption="Activities during exam process"
                    />
                    <StatCard
                        label="Score Changes"
                        value={events.data.filter((item) => item.event_type === 'score_event').length}
                        caption="Score-related activities"
                    />
                    <StatCard
                        label="Clicks & Navigation"
                        value={
                            events.data.filter(
                                (item) =>
                                    item.event_type === 'ui_click' ||
                                    item.event_type === 'navigation',
                            ).length
                        }
                        caption="User interactions on interface"
                    />
                </div>

                <form
                    onSubmit={submitFilters}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Input label="From" type="date" value={form.from} onChange={(value) => setForm((prev) => ({ ...prev, from: value }))} />
                        <Input label="To" type="date" value={form.to} onChange={(value) => setForm((prev) => ({ ...prev, to: value }))} />
                        <Select
                            label="User"
                            value={form.user_id}
                            onChange={(value) => setForm((prev) => ({ ...prev, user_id: value }))}
                            options={[
                                { value: '', label: 'All users' },
                                ...users.map((user) => ({
                                    value: String(user.id),
                                    label: `${user.name} (${user.role})`,
                                })),
                            ]}
                        />
                        <Select
                            label="Role"
                            value={form.user_role}
                            onChange={(value) => setForm((prev) => ({ ...prev, user_role: value }))}
                            options={[
                                { value: '', label: 'All roles' },
                                { value: 'admin', label: 'Superadmin' },
                                { value: 'lecturer', label: 'Lecturer' },
                                { value: 'student', label: 'Student' },
                            ]}
                        />
                        <Select
                            label="Activity Type"
                            value={form.event_type}
                            onChange={(value) => setForm((prev) => ({ ...prev, event_type: value }))}
                            options={[
                                { value: '', label: 'All activities' },
                                { value: 'ui_click', label: 'Menu/button click' },
                                { value: 'navigation', label: 'Page navigation' },
                                { value: 'backend_action', label: 'System process' },
                                { value: 'exam_event', label: 'Exam activity' },
                                { value: 'score_event', label: 'Score activity' },
                            ]}
                        />
                        <Input
                            label="Activity keyword"
                            value={form.event_key}
                            onChange={(value) => setForm((prev) => ({ ...prev, event_key: value }))}
                        />
                        <Input
                            label="System page (optional)"
                            value={form.route_name}
                            onChange={(value) => setForm((prev) => ({ ...prev, route_name: value }))}
                        />
                        <Input
                            label="Menu name (optional)"
                            value={form.menu_key}
                            onChange={(value) => setForm((prev) => ({ ...prev, menu_key: value }))}
                        />
                        <Input
                            label="Exam Session ID"
                            value={form.exam_session_id}
                            onChange={(value) => setForm((prev) => ({ ...prev, exam_session_id: value }))}
                        />
                        <Input label="Min Score" type="number" value={form.score_min} onChange={(value) => setForm((prev) => ({ ...prev, score_min: value }))} />
                        <Input label="Max Score" type="number" value={form.score_max} onChange={(value) => setForm((prev) => ({ ...prev, score_max: value }))} />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Link
                            href={route('admin.audit-trails.index')}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Reset
                        </Link>
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Apply Filters
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Time', 'User', 'Activity Type', 'Activity', 'Activity Location', 'Score', 'Detail'].map((header) => (
                                    <th
                                        key={header}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {events.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No audit data for this filter.
                                    </td>
                                </tr>
                            ) : (
                                events.data.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-xs text-slate-700">{item.occurred_at}</td>
                                        <td className="px-4 py-3 text-xs text-slate-700">
                                            <p className="font-semibold text-slate-900">{item.user?.name ?? '-'}</p>
                                            <p>{formatRole(item.user_role)}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-700">{formatEventType(item.event_type)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-700">{formatEventKey(item.event_key)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-700">
                                            <p>
                                                {item.route_name
                                                    ? `Page: ${formatRouteName(item.route_name)}`
                                                    : '-'}
                                            </p>
                                            <p>
                                                {item.menu_key
                                                    ? `Menu: ${formatMenuKey(item.menu_key)}`
                                                    : '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-700">
                                            {item.score_after ?? '-'}
                                            {item.score_delta !== null ? ` (change ${item.score_delta})` : ''}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedEvent(item)}
                                                className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                                            >
                                                View details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
                        {events.links.map((link) => (
                            <Link
                                key={link.label}
                                href={link.url ?? ''}
                                preserveScroll
                                preserveState
                                className={[
                                    'rounded-md px-3 py-1.5 text-sm',
                                    link.active
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                                    link.url === null ? 'pointer-events-none opacity-40' : '',
                                ].join(' ')}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {selectedEvent && (
                <div className="fixed inset-0 z-50 bg-slate-900/45 p-4">
                    <div className="mx-auto flex max-h-[90vh] max-w-3xl flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between">
                            <h3 className="text-base font-semibold text-slate-900">
                                Activity Detail #{selectedEvent.id}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedEvent(null)}
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                            >
                                Close
                            </button>
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <p>
                                <span className="font-semibold">User:</span> {selectedEvent.user?.name ?? '-'} ({formatRole(selectedEvent.user_role)})
                            </p>
                            <p>
                                <span className="font-semibold">Activity Type:</span> {formatEventType(selectedEvent.event_type)}
                            </p>
                            <p>
                                <span className="font-semibold">Activity:</span> {formatEventKey(selectedEvent.event_key)}
                            </p>
                            <p>
                                <span className="font-semibold">Time:</span> {selectedEvent.occurred_at}
                            </p>
                            <p>
                                <span className="font-semibold">Page:</span>{' '}
                                {selectedEvent.route_name
                                    ? formatRouteName(selectedEvent.route_name)
                                    : '-'}
                            </p>
                            <p>
                                <span className="font-semibold">Menu:</span>{' '}
                                {selectedEvent.menu_key
                                    ? formatMenuKey(selectedEvent.menu_key)
                                    : '-'}
                            </p>
                            <p>
                                <span className="font-semibold">Exam Session:</span> {selectedEvent.exam_session_id ?? '-'}
                            </p>
                            <p>
                                <span className="font-semibold">Final score:</span> {selectedEvent.score_after ?? '-'}
                            </p>
                        </div>
                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm font-semibold text-slate-800">
                                Additional details
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {buildDetailItems(selectedEvent).map((detail) => (
                                    <div
                                        key={`${detail.label}-${detail.value}`}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                                    >
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                            {detail.label}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-800">
                                            {detail.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

function formatEventType(eventType: string): string {
    const labels: Record<string, string> = {
        ui_click: 'Menu/button click',
        navigation: 'Page navigation',
        backend_action: 'System process',
        exam_event: 'Exam activity',
        score_event: 'Score activity',
    };

    return labels[eventType] ?? eventType;
}

function formatEventKey(eventKey: string): string {
    const labels: Record<string, string> = {
        'menu.click': 'Menu click',
        'ui.click': 'Component click',
        'navigation.visit': 'Visit page',
        'exam.answer.submit': 'Submit exam answer',
        'exam.complete': 'Complete exam',
        'exam.complete.timed_out': 'Exam completed due to timeout',
    };

    return labels[eventKey] ?? eventKey.replaceAll('.', ' / ');
}

function formatRole(role: string | null): string {
    if (role === 'admin') {
        return 'Superadmin';
    }

    if (role === 'lecturer') {
        return 'Lecturer';
    }

    if (role === 'student') {
        return 'Student';
    }

    return '-';
}

function formatRouteName(routeName: string): string {
    const labels: Record<string, string> = {
        dashboard: 'Dashboard',
        'profile.edit': 'User Profile',
        'admin.users.index': 'User List',
        'admin.users.create': 'Create User',
        'admin.users.edit': 'Edit User',
        'admin.exam-headers.index': 'Exam Header List',
        'admin.exam-headers.create': 'Create Exam Header',
        'admin.exam-headers.show': 'Exam Header Detail',
        'admin.exam-session-feedback.index': 'Exam Feedback List',
        'admin.student-monitoring.index': 'Student Answer Monitoring',
        'admin.student-monitoring.show': 'Student Monitoring Detail',
        'admin.instructor-insights.index': 'Instructor Insight Dashboard',
        'admin.audit-trails.index': 'User Activity History',
        'lecturer.questions.index': 'Question Bank',
        'lecturer.questions.create': 'Create Question',
        'lecturer.questions.edit': 'Edit Question',
        'student.exams.index': 'Exam List',
        'student.exams.show': 'Exam Attempt Page',
        'student.exams.answer': 'Exam Answer Submission',
        'student.exams.complete': 'Exam Completion',
        'student.exams.feedback': 'View Exam Feedback',
        'student.exams.feedback.store': 'Submit Exam Feedback',
        'student.exams.focus-events.store': 'Exam Focus Logging',
        'student.daily-activity.index': 'Daily Activity',
        'student.learning-history.index': 'Learning History',
        'student.priority-practice.index': 'Priority Practice',
        'student.rankings.index': 'Student Rankings',
        'audit-trails.events.store': 'System Activity Logging',
    };

    return labels[routeName] ?? routeName.replaceAll('.', ' / ');
}

function formatMenuKey(menuKey: string): string {
    const labels: Record<string, string> = {
        dashboard: 'Dashboard',
        profile: 'Profile',
        logout: 'Logout',
        'admin.users': 'Users',
        'admin.exam_headers': 'Exam Header',
        'admin.exam_session_feedback': 'Exam Feedback',
        'admin.student_monitoring': 'Answer Monitoring',
        'admin.instructor_insights': 'Instructor Insights',
        'admin.audit_trails': 'User Activity History',
        'lecturer.questions': 'Question Bank',
        'student.exams': 'Exams',
        'student.daily_activity': 'Daily Activity',
        'student.learning_history': 'Learning History',
        'student.priority_practice': 'Priority Practice',
        'student.rankings': 'Rankings',
    };

    return labels[menuKey] ?? menuKey.replaceAll('_', ' ').replaceAll('.', ' / ');
}

function Input({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
        </label>
    );
}

function Select({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function StatCard({
    label,
    value,
    caption,
}: {
    label: string;
    value: number;
    caption: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
    );
}

function buildDetailItems(event: EventRow): DetailItem[] {
    const metadataEntries = Object.entries(event.metadata ?? {});
    const primaryDetails: DetailItem[] = [
        {
            label: 'User name',
            value: event.user?.name ?? '-',
        },
        {
            label: 'User role',
            value: formatRole(event.user_role),
        },
        {
            label: 'Activity Type',
            value: formatEventType(event.event_type),
        },
        {
            label: 'Activity',
            value: formatEventKey(event.event_key),
        },
        {
            label: 'Page',
            value: event.route_name ? formatRouteName(event.route_name) : '-',
        },
        {
            label: 'Menu',
            value: event.menu_key ? formatMenuKey(event.menu_key) : '-',
        },
        {
            label: 'Exam Session ID',
            value: event.exam_session_id !== null ? String(event.exam_session_id) : '-',
        },
        {
            label: 'Exam header ID',
            value: event.exam_header_id !== null ? String(event.exam_header_id) : '-',
        },
        {
            label: 'Previous score',
            value: event.score_before !== null ? String(event.score_before) : '-',
        },
        {
            label: 'Final score',
            value: event.score_after !== null ? String(event.score_after) : '-',
        },
        {
            label: 'Score change',
            value: event.score_delta !== null ? String(event.score_delta) : '-',
        },
        {
            label: 'Activity time',
            value: event.occurred_at,
        },
    ];

    const technicalDetails: DetailItem[] = [
        {
            label: 'Activity ID',
            value: String(event.id),
        },
        {
            label: 'User ID',
            value: event.user_id !== null ? String(event.user_id) : '-',
        },
        {
            label: 'Page URL',
            value: event.page_url ?? '-',
        },
        {
            label: 'Clicked element',
            value: event.element_key ?? '-',
        },
        {
            label: 'Related object',
            value: event.subject_label ?? event.subject_type ?? '-',
        },
        {
            label: 'Related object ID',
            value: event.subject_id !== null ? String(event.subject_id) : '-',
        },
        {
            label: 'Clicked element',
            value: event.element_key ?? '-',
        },
    ];

    metadataEntries.forEach(([key, value]) => {
        technicalDetails.push({
            label: `Info: ${humanizeKey(key)}`,
            value: formatMetadataValue(value),
        });
    });

    return [...primaryDetails, ...technicalDetails];
}

function humanizeKey(key: string): string {
    return key.replaceAll('_', ' ').replaceAll('.', ' / ');
}

function formatMetadataValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '-';
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    return 'Data available';
}
