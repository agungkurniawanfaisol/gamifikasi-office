import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type Filters = {
    from: string;
    to: string;
    source: 'all' | 'exam' | 'daily';
    search: string | null;
};

type AttemptRow = {
    source: 'exam' | 'daily';
    attempt_id: number;
    student_id: number;
    student_name: string;
    student_email: string;
    attempt_date: string;
    attempt_time: string | null;
    answered_count: number;
    correct_count: number;
    accuracy: number;
};

type DetailRow = {
    source: 'exam' | 'daily';
    exam_session_id: number | null;
    attempt_label: string;
    question: string | null;
    question_type?: string;
    student_answer: string;
    correct_answer: string | null;
    is_correct: boolean | null;
    answered_at: string | null;
    session_completed_at?: string | null;
    completion_message?: string | null;
    ai_status?: string | null;
    rating?: number | null;
    testimonial?: string | null;
    feedback_submitted_at?: string | null;
};

type DetailGroup =
    | {
          kind: 'exam_session';
          sessionId: number;
          header: DetailRow;
          questions: DetailRow[];
      }
    | { kind: 'daily'; row: DetailRow };

type MonitoringPageProps = PageProps<{
    filters: Filters;
    summary: {
        students_active: number;
        attempt_count: number;
        average_accuracy: number;
        exam_attempt_count: number;
        daily_attempt_count: number;
    };
    attempts: {
        data: AttemptRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    selectedStudent: { id: number; name: string; email: string } | null;
    details: DetailRow[];
}>;

export default function Index({
    filters,
    summary,
    attempts,
    selectedStudent,
    details,
}: MonitoringPageProps) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [source, setSource] = useState<Filters['source']>(filters.source);
    const [search, setSearch] = useState(filters.search ?? '');

    const queryParams = useMemo(
        () => ({
            from,
            to,
            source,
            search: search.trim() === '' ? undefined : search.trim(),
        }),
        [from, to, source, search],
    );

    const detailGroups = useMemo((): DetailGroup[] => {
        const out: DetailGroup[] = [];
        for (const row of details) {
            if (row.source === 'exam' && row.exam_session_id != null) {
                const last = out[out.length - 1];
                if (
                    last?.kind === 'exam_session' &&
                    last.sessionId === row.exam_session_id
                ) {
                    last.questions.push(row);
                } else {
                    out.push({
                        kind: 'exam_session',
                        sessionId: row.exam_session_id,
                        header: row,
                        questions: [row],
                    });
                }
            } else {
                out.push({ kind: 'daily', row });
            }
        }
        return out;
    }, [details]);

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('admin.student-monitoring.index'), queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        router.get(route('admin.student-monitoring.index'), undefined, {
            preserveState: false,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Student Answer Monitoring
                    </h2>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        Admin & Lecturer
                    </span>
                </div>
            }
        >
            <Head title="Student Answer Monitoring" />

            <div className="space-y-6 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <form
                        onSubmit={submitFilters}
                        className="sticky top-2 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur"
                    >
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    From date
                                </span>
                                <input
                                    type="date"
                                    value={from}
                                    onChange={(event) =>
                                        setFrom(event.target.value)
                                    }
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </label>
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    To date
                                </span>
                                <input
                                    type="date"
                                    value={to}
                                    onChange={(event) =>
                                        setTo(event.target.value)
                                    }
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </label>
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    Source
                                </span>
                                <select
                                    value={source}
                                    onChange={(event) =>
                                        setSource(
                                            event.target
                                                .value as Filters['source'],
                                        )
                                    }
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="all">All</option>
                                    <option value="exam">Exam</option>
                                    <option value="daily">Daily Activity</option>
                                </select>
                            </label>
                            <label className="text-sm text-slate-700 xl:col-span-2">
                                <span className="mb-1 block font-medium">
                                    Search student
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Name or email"
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </label>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
                    <StatCard label="Active Students" value={summary.students_active} />
                    <StatCard label="Total Attempts" value={summary.attempt_count} />
                    <StatCard
                        label="Average Accuracy"
                        value={`${summary.average_accuracy}%`}
                    />
                    <StatCard
                        label="Exam Attempts"
                        value={summary.exam_attempt_count}
                    />
                    <StatCard
                        label="Daily Attempts"
                        value={summary.daily_attempt_count}
                    />
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                            Student Activity
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Correct / Questions
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Accuracy
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Source
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {attempts.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-sm text-slate-500"
                                            >
                                                No attempts for this filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        attempts.data.map((row) => (
                                            <tr key={`${row.source}-${row.attempt_id}`}>
                                                <td className="px-4 py-3 text-sm">
                                                    <p className="font-semibold text-slate-900">
                                                        {row.student_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {row.student_email}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {row.attempt_date}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {row.correct_count} /{' '}
                                                    {row.answered_count}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                                                    {row.accuracy}%
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <SourceBadge source={row.source} />
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm">
                                                    <Link
                                                        href={route(
                                                            'admin.student-monitoring.show',
                                                            {
                                                                student: row.student_id,
                                                                ...queryParams,
                                                            },
                                                        )}
                                                        preserveScroll
                                                        preserveState
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700"
                                                        title={`View details for ${row.student_name}`}
                                                        aria-label={`View details for ${row.student_name}`}
                                                    >
                                                        <EyeIcon />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3 p-4 md:hidden">
                            {attempts.data.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                                    No attempts for this filter.
                                </p>
                            ) : (
                                attempts.data.map((row) => (
                                    <article
                                        key={`mobile-${row.source}-${row.attempt_id}`}
                                        className="rounded-xl border border-slate-200 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {row.student_name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {row.student_email}
                                                </p>
                                            </div>
                                            <SourceBadge source={row.source} />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-600">
                                            {row.attempt_date} | {row.correct_count}/
                                            {row.answered_count} correct |{' '}
                                            {row.accuracy}%
                                        </p>
                                        <Link
                                            href={route(
                                                'admin.student-monitoring.show',
                                                {
                                                    student: row.student_id,
                                                    ...queryParams,
                                                },
                                            )}
                                            preserveScroll
                                            preserveState
                                            className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700"
                                            title={`View details for ${row.student_name}`}
                                            aria-label={`View details for ${row.student_name}`}
                                        >
                                            <EyeIcon />
                                        </Link>
                                    </article>
                                ))
                            )}
                        </div>

                        <div className="border-t border-slate-100 px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                                {attempts.links.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.url ?? ''}
                                        preserveScroll
                                        preserveState
                                        className={[
                                            'rounded-md px-3 py-2 text-sm',
                                            link.active
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                                            link.url === null
                                                ? 'pointer-events-none opacity-40'
                                                : '',
                                        ].join(' ')}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                </div>
            </div>
            </div>

            {selectedStudent ? (
                <div className="fixed inset-0 z-50 bg-slate-900/45 p-3 sm:p-6">
                    <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Answer Details
                                </p>
                                <p className="text-xs text-slate-600">
                                    {selectedStudent.name} ·{' '}
                                    {selectedStudent.email}
                                </p>
                            </div>
                            <Link
                                href={route(
                                    'admin.student-monitoring.index',
                                    queryParams,
                                )}
                                preserveScroll
                                preserveState
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Close
                            </Link>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
                            {details.length === 0 ? (
                                <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                                    No answer details for this filter.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-8">
                                    {detailGroups.map((group, groupIndex) =>
                                        group.kind === 'exam_session' ? (
                                            <section
                                                key={`exam-${group.sessionId}-${groupIndex}`}
                                                className="space-y-3"
                                            >
                                                <ExamSessionFeedbackBanner
                                                    row={group.header}
                                                />
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    {group.questions.map(
                                                        (detail, qIndex) => (
                                                            <MonitoringQuestionCard
                                                                key={`${group.sessionId}-q-${qIndex}`}
                                                                detail={detail}
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            </section>
                                        ) : (
                                            <div
                                                key={`daily-${groupIndex}-${group.row.answered_at ?? ''}`}
                                                className="grid gap-3 md:grid-cols-2"
                                            >
                                                <MonitoringQuestionCard
                                                    detail={group.row}
                                                />
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
    );
}

function ExamSessionFeedbackBanner({ row }: { row: DetailRow }) {
    return (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
                <SourceBadge source="exam" />
                {row.ai_status ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        AI status: {row.ai_status}
                    </span>
                ) : null}
                {row.session_completed_at ? (
                    <span className="text-[11px] text-slate-600">
                        Session completed: {row.session_completed_at}
                    </span>
                ) : null}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-800">
                {row.attempt_label}
            </p>
            {row.completion_message ? (
                <>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        AI feedback
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                        {row.completion_message}
                    </p>
                </>
            ) : (
                <p className="mt-3 text-xs text-slate-600">
                    No AI feedback text stored for this session yet.
                </p>
            )}
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Student testimonial
                </p>
                {row.rating != null ? (
                    <p className="mt-1 text-sm text-slate-800">
                        Rating: {row.rating} / 5
                    </p>
                ) : (
                    <p className="mt-1 text-xs text-slate-500">No rating submitted.</p>
                )}
                {row.testimonial ? (
                    <p className="mt-2 text-sm text-slate-800">{row.testimonial}</p>
                ) : (
                    <p className="mt-2 text-xs text-slate-500">
                        No testimonial submitted for this session.
                    </p>
                )}
                {row.feedback_submitted_at ? (
                    <p className="mt-2 text-[11px] text-slate-500">
                        Feedback saved: {row.feedback_submitted_at}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function MonitoringQuestionCard({ detail }: { detail: DetailRow }) {
    return (
        <article className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
                <SourceBadge source={detail.source} />
                <span className="text-[11px] text-slate-500">
                    {detail.answered_at ?? '—'}
                </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700">
                {detail.attempt_label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
                {detail.question}
            </p>
            {detail.question_type ? (
                <p className="mt-1 text-[11px] text-slate-500">
                    {detail.question_type.replace(/_/g, ' ')}
                </p>
            ) : null}
            <p className="mt-2 text-xs text-slate-600">
                <span className="font-medium text-slate-700">Answer:</span>{' '}
                <span className="break-words">{detail.student_answer}</span>
            </p>
            <p className="text-xs text-slate-600">
                <span className="font-medium text-slate-700">Key:</span>{' '}
                <span className="break-words">
                    {detail.correct_answer ?? '—'}
                </span>
            </p>
            <DetailResultBadge isCorrect={detail.is_correct} />
        </article>
    );
}

function DetailResultBadge({
    isCorrect,
}: {
    isCorrect: boolean | null;
}) {
    if (isCorrect === null) {
        return (
            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                Unanswered
            </span>
        );
    }

    return (
        <span
            className={[
                'mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                isCorrect
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700',
            ].join(' ')}
        >
            {isCorrect ? 'Correct' : 'Wrong'}
        </span>
    );
}

function EyeIcon() {
    return (
        <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M1.5 12C3.75 7.5 7.5 5.25 12 5.25C16.5 5.25 20.25 7.5 22.5 12C20.25 16.5 16.5 18.75 12 18.75C7.5 18.75 3.75 16.5 1.5 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function SourceBadge({ source }: { source: 'exam' | 'daily' }) {
    return (
        <span
            className={[
                'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                source === 'exam'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-amber-50 text-amber-700',
            ].join(' ')}
        >
            {source === 'exam' ? 'Exam' : 'Daily'}
        </span>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}
