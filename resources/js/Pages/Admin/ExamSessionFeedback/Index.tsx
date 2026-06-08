import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type FeedbackRow = {
    id: number;
    rating: number | null;
    testimonial: string | null;
    submitted_at: string | null;
    completion_message: string | null;
    ai_status: string | null;
    user: { id: number; name: string; email: string };
    exam_session: {
        id: number;
        total_score: number | null;
        max_possible_score: number | null;
        status: string;
        completed_at: string | null;
        level: { id: number; name: string } | null;
    };
};

export default function Index({
    feedbacks,
}: {
    feedbacks: {
        data: FeedbackRow[];
        links: { url: string | null; label: string; active: boolean }[];
    };
}) {
    const [selected, setSelected] = useState<FeedbackRow | null>(null);

    useEffect(() => {
        if (!selected) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelected(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selected]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-gray-800">
                    Exam Feedback
                </h2>
            }
        >
            <Head title="Exam Feedback" />
            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Student
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Level
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Score
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Rating
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                                            Detail
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {feedbacks.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-sm text-gray-600"
                                            >
                                                No feedback has been submitted yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        feedbacks.data.map((row) => (
                                            <tr key={row.id}>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                    {row.submitted_at
                                                        ? new Date(
                                                              row.submitted_at,
                                                          ).toLocaleString()
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {row.user.name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {row.exam_session.level
                                                        ?.name ?? '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {row.exam_session
                                                        .total_score ?? 0}
                                                    /
                                                    {row.exam_session
                                                        .max_possible_score ??
                                                        0}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {row.rating !== null
                                                        ? `${'★'.repeat(row.rating)}${'☆'.repeat(5 - row.rating)}`
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelected(row)
                                                        }
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white transition hover:bg-gray-800"
                                                        title="View full feedback"
                                                        aria-label="View full feedback"
                                                    >
                                                        <EyeIcon />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t px-4 py-3 sm:px-6">
                            <div className="flex flex-wrap gap-2">
                                {feedbacks.links.map((l) => (
                                    <Link
                                        key={l.label}
                                        href={l.url ?? ''}
                                        preserveScroll
                                        preserveState
                                        disabled={l.url === null}
                                        className={[
                                            'rounded-md px-3 py-2 text-sm',
                                            l.active
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
                                            l.url === null
                                                ? 'pointer-events-none opacity-50'
                                                : '',
                                        ].join(' ')}
                                        dangerouslySetInnerHTML={{
                                            __html: l.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selected ? (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="feedback-detail-title"
                >
                    <button
                        type="button"
                        className="fixed inset-0 z-0 cursor-default bg-transparent"
                        aria-label="Close detail overlay"
                        onClick={() => setSelected(null)}
                    />
                    <div className="relative z-10 mx-auto mt-8 flex max-h-[min(90vh,calc(100vh-4rem))] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:mt-0 sm:min-h-0">
                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
                            <div>
                                <h3
                                    id="feedback-detail-title"
                                    className="text-base font-semibold text-gray-900"
                                >
                                    Feedback detail
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    {selected.user.name} · {selected.user.email}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm">
                            <dl className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Level
                                    </dt>
                                    <dd className="mt-0.5 text-gray-900">
                                        {selected.exam_session.level?.name ??
                                            '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Score
                                    </dt>
                                    <dd className="mt-0.5 text-gray-900">
                                        {selected.exam_session.total_score ?? 0}{' '}
                                        /{' '}
                                        {selected.exam_session
                                            .max_possible_score ?? 0}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Exam session
                                    </dt>
                                    <dd className="mt-0.5 text-gray-900">
                                        #{selected.exam_session.id} ·{' '}
                                        {selected.exam_session.status || '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Exam completed
                                    </dt>
                                    <dd className="mt-0.5 text-gray-900">
                                        {selected.exam_session.completed_at
                                            ? new Date(
                                                  selected.exam_session.completed_at,
                                              ).toLocaleString()
                                            : '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Feedback submitted
                                    </dt>
                                    <dd className="mt-0.5 text-gray-900">
                                        {selected.submitted_at
                                            ? new Date(
                                                  selected.submitted_at,
                                              ).toLocaleString()
                                            : '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Rating
                                    </dt>
                                    <dd className="mt-0.5 text-gray-900">
                                        {selected.rating !== null
                                            ? `${selected.rating} / 5`
                                            : '—'}
                                    </dd>
                                </div>
                            </dl>

                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    AI status
                                </h4>
                                <p className="mt-1 text-gray-900">
                                    {selected.ai_status ?? '—'}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    AI feedback
                                </h4>
                                <p className="mt-2 whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-3 text-gray-900 leading-relaxed">
                                    {selected.completion_message?.trim()
                                        ? selected.completion_message
                                        : 'No AI feedback text stored.'}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Student testimonial
                                </h4>
                                <p className="mt-2 whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-3 text-gray-900 leading-relaxed">
                                    {selected.testimonial?.trim()
                                        ? selected.testimonial
                                        : 'No testimonial text.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
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
