import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type Filters = {
    from: string;
    to: string;
    source: 'all' | 'exam' | 'daily';
    search: string | null;
    attempt_source: 'exam' | 'daily' | null;
    attempt_id: number | null;
};

type AttemptRow = {
    source: 'exam' | 'daily';
    attempt_id: number;
    attempt_label: string;
    attempt_date: string;
    attempt_time: string | null;
    answered_count: number;
    correct_count: number;
    accuracy: number;
};

type DetailRow = {
    source: 'exam' | 'daily';
    attempt_id: number;
    attempt_label: string;
    question: string | null;
    selected_option: string | null;
    correct_option: string | null;
    is_correct: boolean;
    answered_at: string | null;
};

type HistoryPageProps = PageProps<{
    filters: Filters;
    summary: {
        total_attempts: number;
        total_answered: number;
        total_correct: number;
        total_wrong: number;
        average_accuracy: number;
    };
    targets: {
        daily: {
            min_required: number;
            max_allowed: number;
            answered_today: number;
            remaining_to_minimum: number;
            status: 'on_track' | 'behind' | 'completed';
        };
        streak: {
            target_days: number;
            current_days: number;
            progress_percent: number;
            status: 'on_track' | 'behind' | 'completed';
        };
        accuracy: {
            target_percent: number;
            current_percent: number;
            status: 'on_track' | 'behind' | 'completed';
        };
        risk: {
            threshold_percent: number;
            lookback_days: number;
            days_below_threshold: number;
            status: 'safe' | 'low_risk' | 'medium_risk' | 'high_risk';
            message: string;
        };
        recommendation: {
            priority: 'high' | 'medium' | 'low';
            headline: string;
            actions: string[];
            focus_source: 'exam' | 'daily' | 'balanced';
            weak_skills: string[];
        };
    };
    attempts: {
        data: AttemptRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    details: DetailRow[];
}>;

export default function Index({
    filters,
    summary,
    targets,
    attempts,
    details,
}: HistoryPageProps) {
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

    const selectedAttempt = useMemo(
        () =>
            filters.attempt_source && filters.attempt_id
                ? {
                      source: filters.attempt_source,
                      id: filters.attempt_id,
                  }
                : null,
        [filters.attempt_source, filters.attempt_id],
    );

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('student.learning-history.index'), queryParams, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        router.get(route('student.learning-history.index'), undefined, {
            preserveScroll: true,
            replace: true,
        });
    };

    const openAttemptDetail = (row: AttemptRow) => {
        router.get(
            route('student.learning-history.index'),
            {
                ...queryParams,
                attempt_source: row.source,
                attempt_id: row.attempt_id,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const closeDetail = () => {
        router.get(route('student.learning-history.index'), queryParams, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Learning History
                </h2>
            }
        >
            <Head title="Learning History" />

            <div className="space-y-6 bg-[radial-gradient(ellipse_120%_80%_at_15%_-10%,rgba(99,102,241,0.18),transparent_50%),radial-gradient(ellipse_100%_80%_at_100%_0%,rgba(45,212,191,0.18),transparent_52%),linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#eef2ff_100%)] py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <section className="relative mb-4 overflow-hidden rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm">
                        <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-10 right-0 h-24 w-24 rounded-full bg-teal-200/40 blur-2xl" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                            Learning Progress
                        </p>
                        <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                            <p>
                                Average accuracy:{' '}
                                <span className="font-semibold text-slate-900">
                                    {summary.average_accuracy}%
                                </span>
                            </p>
                            <p>
                                Total attempts:{' '}
                                <span className="font-semibold text-slate-900">
                                    {summary.total_attempts}
                                </span>
                            </p>
                            <p>
                                Correct answers:{' '}
                                <span className="font-semibold text-slate-900">
                                    {summary.total_correct}
                                </span>
                            </p>
                        </div>
                    </section>

                    <form
                        onSubmit={submitFilters}
                        className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm"
                    >
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400"
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
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400"
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
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400"
                                >
                                    <option value="all">All</option>
                                    <option value="exam">Exam</option>
                                    <option value="daily">Daily Activity</option>
                                </select>
                            </label>
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    Search questions
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Question keywords"
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-400"
                                />
                            </label>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <a
                                href={route(
                                    'student.learning-history.export',
                                    queryParams,
                                )}
                                className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                            >
                                Export CSV
                            </a>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                            >
                                Apply
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
                    <StatCard label="Total Attempts" value={summary.total_attempts} />
                    <StatCard label="Total Questions" value={summary.total_answered} />
                    <StatCard label="Correct Answers" value={summary.total_correct} />
                    <StatCard label="Wrong Answers" value={summary.total_wrong} />
                    <StatCard
                        label="Average Accuracy"
                        value={`${summary.average_accuracy}%`}
                    />
                </div>

                <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
                    <TargetCard
                        title="Daily Target"
                        description={`Answer at least ${targets.daily.min_required} out of max ${targets.daily.max_allowed} questions.`}
                        value={`${targets.daily.answered_today} questions`}
                        status={targets.daily.status}
                        footer={
                            targets.daily.remaining_to_minimum > 0
                                ? `${targets.daily.remaining_to_minimum} more questions to reach minimum target`
                                : 'Daily minimum target achieved'
                        }
                    />
                    <TargetCard
                        title="Weekly Streak Target"
                        description={`Reach ${targets.streak.target_days} consecutive days.`}
                        value={`${targets.streak.current_days} days`}
                        status={targets.streak.status}
                        footer={`Progress ${targets.streak.progress_percent}%`}
                    />
                    <TargetCard
                        title="Accuracy Target"
                        description={`Maintain at least ${targets.accuracy.target_percent}%`}
                        value={`${targets.accuracy.current_percent}%`}
                        status={targets.accuracy.status}
                        footer="Accuracy is calculated from the filter period"
                    />
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <RiskCard
                        status={targets.risk.status}
                        message={targets.risk.message}
                        daysBelowThreshold={targets.risk.days_below_threshold}
                        lookbackDays={targets.risk.lookback_days}
                        thresholdPercent={targets.risk.threshold_percent}
                    />
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <RecommendationCard recommendation={targets.recommendation} />
                </div>

                <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                            Completed Activities
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="sticky top-0 z-10 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                                            Attempt
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
                                                No activity data for this filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        attempts.data.map((row) => (
                                            <tr
                                                key={`${row.source}-${row.attempt_id}`}
                                                className="transition hover:bg-indigo-50/40"
                                            >
                                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                    {row.attempt_label}
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
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openAttemptDetail(
                                                                row,
                                                            )
                                                        }
                                                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                                    >
                                                        Review Mistakes
                                                    </button>
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
                                    No activity data for this filter.
                                </p>
                            ) : (
                                attempts.data.map((row) => (
                                    <article
                                        key={`mobile-${row.source}-${row.attempt_id}`}
                                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {row.attempt_label}
                                            </p>
                                            <SourceBadge source={row.source} />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-600">
                                            {row.attempt_date} | {row.correct_count}/
                                            {row.answered_count} correct |{' '}
                                            {row.accuracy}%
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => openAttemptDetail(row)}
                                            className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                                        >
                                            Review Mistakes
                                        </button>
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
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1',
                                        ].join(' ')}
                                        aria-current={link.active ? 'page' : undefined}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                                Answer Details
                            </h3>
                            {selectedAttempt && (
                                <button
                                    type="button"
                                    onClick={closeDetail}
                                    className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                        {!selectedAttempt ? (
                            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                                Click any attempt to review which answers were correct or wrong.
                            </p>
                        ) : details.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                                No answer details for this attempt.
                            </p>
                        ) : (
                            <div className="max-h-[34rem] space-y-3 overflow-auto pr-1">
                                {details.map((detail, index) => (
                                    <article
                                        key={`${detail.source}-${detail.attempt_id}-${index}`}
                                        className="rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/60 p-3"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <SourceBadge source={detail.source} />
                                            <span className="text-[11px] text-slate-500">
                                                {detail.answered_at ?? '-'}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs font-semibold text-slate-700">
                                            {detail.attempt_label}
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-slate-900">
                                            {detail.question}
                                        </p>
                                        <p className="mt-2 text-xs text-slate-600">
                                            Your answer:{' '}
                                            {detail.selected_option ?? '-'}
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            Correct answer:{' '}
                                            {detail.correct_option ?? '-'}
                                        </p>
                                        <span
                                            className={[
                                                'mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                                                detail.is_correct
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-rose-50 text-rose-700',
                                            ].join(' ')}
                                        >
                                            {detail.is_correct
                                                ? 'Correct'
                                                : 'Wrong'}
                                        </span>
                                    </article>
                                ))}
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function RiskCard({
    status,
    message,
    daysBelowThreshold,
    lookbackDays,
    thresholdPercent,
}: {
    status: 'safe' | 'low_risk' | 'medium_risk' | 'high_risk';
    message: string;
    daysBelowThreshold: number;
    lookbackDays: number;
    thresholdPercent: number;
}) {
    const badgeClass =
        status === 'high_risk'
            ? 'bg-rose-100 text-rose-700'
            : status === 'medium_risk'
              ? 'bg-amber-100 text-amber-700'
              : status === 'low_risk'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-emerald-100 text-emerald-700';

    const badgeLabel =
        status === 'high_risk'
            ? 'High Risk'
            : status === 'medium_risk'
              ? 'Medium Risk'
              : status === 'low_risk'
                ? 'Low Risk'
                : 'Safe';

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        Learning Risk Indicator
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                        Risk threshold applies when accuracy is below {thresholdPercent}%
                        within the last {lookbackDays} days.
                    </p>
                </div>
                <span
                    className={[
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                        badgeClass,
                    ].join(' ')}
                >
                    {badgeLabel}
                </span>
            </div>
            <p className="mt-3 text-sm text-slate-700">{message}</p>
            <p className="mt-1 text-xs text-slate-500">
                Days below threshold: {daysBelowThreshold}/{lookbackDays}
            </p>
        </div>
    );
}

function RecommendationCard({
    recommendation,
}: {
    recommendation: {
        priority: 'high' | 'medium' | 'low';
        headline: string;
        actions: string[];
        focus_source: 'exam' | 'daily' | 'balanced';
        weak_skills: string[];
    };
}) {
    const wrapperClass =
        recommendation.priority === 'high'
            ? 'border-rose-300 bg-rose-50'
            : recommendation.priority === 'medium'
              ? 'border-amber-300 bg-amber-50'
              : 'border-emerald-300 bg-emerald-50';

    const badgeClass =
        recommendation.priority === 'high'
            ? 'bg-rose-100 text-rose-700'
            : recommendation.priority === 'medium'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700';

    const badgeLabel =
        recommendation.priority === 'high'
            ? 'High Priority'
            : recommendation.priority === 'medium'
              ? 'Medium Priority'
              : 'Low Priority';

    const focusLabel =
        recommendation.focus_source === 'exam'
            ? 'Exam'
            : recommendation.focus_source === 'daily'
              ? 'Daily Activity'
              : 'Balanced';

    return (
        <div className={['rounded-2xl border p-4 shadow-sm', wrapperClass].join(' ')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        Learning Action Recommendations
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                        {recommendation.headline}
                    </p>
                </div>
                <span
                    className={[
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                        badgeClass,
                    ].join(' ')}
                >
                    {badgeLabel}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white px-2 py-1 font-semibold text-slate-700">
                    Focus: {focusLabel}
                </span>
                {recommendation.weak_skills.length > 0 ? (
                    <span className="rounded-full bg-white px-2 py-1 font-semibold text-slate-700">
                        Weak topics: {recommendation.weak_skills.join(', ')}
                    </span>
                ) : null}
            </div>

            <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                {recommendation.actions.map((action) => (
                    <li key={action} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-slate-500" />
                        <span>{action}</span>
                    </li>
                ))}
            </ul>
        </div>
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="pointer-events-none absolute -right-6 -top-8 h-16 w-16 rounded-full bg-indigo-100/70 blur-xl" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function TargetCard({
    title,
    description,
    value,
    status,
    footer,
}: {
    title: string;
    description: string;
    value: string;
    status: 'on_track' | 'behind' | 'completed';
    footer: string;
}) {
    const statusClass =
        status === 'completed'
            ? 'bg-emerald-50 text-emerald-700'
            : status === 'on_track'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-rose-50 text-rose-700';

    const statusLabel =
        status === 'completed'
            ? 'Completed'
            : status === 'on_track'
              ? 'On Track'
              : 'Needs Attention';

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-xs text-slate-600">{description}</p>
                </div>
                <span
                    className={[
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                        statusClass,
                    ].join(' ')}
                >
                    {statusLabel}
                </span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{footer}</p>
        </div>
    );
}
