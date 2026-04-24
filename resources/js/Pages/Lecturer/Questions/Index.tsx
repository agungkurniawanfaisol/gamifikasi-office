import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

type QuestionRow = {
    id: number;
    question_text: string;
    type: string;
    is_active: boolean;
    skill_category?: { id: number; name: string };
    level?: { id: number; name: string };
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export default function Index({
    questions,
}: {
    questions: {
        data: QuestionRow[];
        links: PaginationLink[];
    };
}) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Question Bank
                    </h2>
                    <Link
                        href={route('lecturer.questions.create')}
                        className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Create
                    </Link>
                </div>
            }
        >
            <Head title="Question Bank" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Question
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Skill
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Level
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Active
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {questions.data.map((q) => (
                                        <tr key={q.id}>
                                            <td className="max-w-[32rem] truncate px-4 py-3 text-sm font-medium text-gray-900">
                                                {q.question_text}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                {q.skill_category?.name ?? '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                {q.level?.name ?? '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                {q.type}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                <span
                                                    className={[
                                                        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                                                        q.is_active
                                                            ? 'bg-green-50 text-green-700'
                                                            : 'bg-gray-100 text-gray-700',
                                                    ].join(' ')}
                                                >
                                                    {q.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link
                                                        href={route(
                                                            'lecturer.questions.edit',
                                                            q.id,
                                                        )}
                                                        className="font-semibold text-gray-900 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <Link
                                                        href={route(
                                                            'lecturer.questions.destroy',
                                                            q.id,
                                                        )}
                                                        method="delete"
                                                        as="button"
                                                        className="font-semibold text-red-600 hover:underline"
                                                    >
                                                        Delete
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t px-4 py-3 sm:px-6">
                            <div className="flex flex-wrap gap-2">
                                {questions.links.map((l) => (
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

