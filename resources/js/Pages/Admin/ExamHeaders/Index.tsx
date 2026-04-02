import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

type HeaderRow = {
    id: number;
    title: string;
    total_duration_minutes: number;
    exam_questions_count: number;
    level?: { id: number; name: string };
    creator?: { id: number; name: string; email: string };
};

export default function Index({
    headers,
}: {
    headers: {
        data: HeaderRow[];
    };
}) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Exam Headers
                    </h2>
                    <Link
                        href={route('admin.exam-headers.create')}
                        className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                        Create Header
                    </Link>
                </div>
            }
        >
            <Head title="Exam Headers" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Title
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Level
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Questions
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Total Minutes
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {headers.data.map((h) => (
                                        <tr key={h.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {h.title}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {h.level?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {h.exam_questions_count}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {h.total_duration_minutes}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                <Link
                                                    href={route(
                                                        'admin.exam-headers.show',
                                                        h.id,
                                                    )}
                                                    className="font-semibold text-gray-900 hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

