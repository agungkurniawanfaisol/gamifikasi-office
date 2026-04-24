import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

type FeedbackRow = {
    id: number;
    rating: number | null;
    testimonial: string | null;
    submitted_at: string | null;
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
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Testimonials
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
                                                <td className="max-w-md px-4 py-3 text-sm text-gray-700">
                                                    <span className="line-clamp-3">
                                                        {row.testimonial}
                                                    </span>
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
        </AuthenticatedLayout>
    );
}
