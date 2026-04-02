import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

type QuestionOptionRow = {
    id: number;
    option_text: string;
    is_correct: boolean;
    order: number;
};

type HeaderData = {
    id: number;
    title: string;
    total_duration_minutes: number;
    level?: { id: number; name: string };
    creator?: { id: number; name: string; email: string };
    exam_questions: Array<{
        id: number;
        duration_per_question: number;
        sort_order: number;
        question?: {
            id: number;
            question_text: string;
            narrative_text?: string | null;
            explanation?: string | null;
            type: string;
            options?: QuestionOptionRow[];
        };
    }>;
};

export default function Show({ header }: { header: HeaderData }) {
    const [previewItem, setPreviewItem] =
        useState<HeaderData['exam_questions'][number] | null>(null);

    function normalizeOptions(
        options: unknown,
    ): QuestionOptionRow[] {
        if (Array.isArray(options)) {
            return options as QuestionOptionRow[];
        }

        if (options && typeof options === 'object') {
            return Object.values(options as Record<string, QuestionOptionRow>);
        }

        return [];
    }

    const optionsList = normalizeOptions(
        previewItem?.question?.options,
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {header.title}
                    </h2>
                    <Link
                        href={route('admin.exam-headers.index')}
                        className="text-sm font-semibold text-gray-700 hover:underline"
                    >
                        Back
                    </Link>
                </div>
            }
        >
            <Head title={header.title} />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                        <div className="text-sm text-gray-700">
                            Level: <b>{header.level?.name ?? '-'}</b> • Total
                            Duration: <b>{header.total_duration_minutes}</b>{' '}
                            minutes
                        </div>
                    </div>

                    <div className="rounded-lg bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Order
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Question
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Minutes
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-600">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {header.exam_questions.map((q) => (
                                        <tr key={q.id}>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {q.sort_order}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {q.question?.question_text}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {q.question?.type}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {q.duration_per_question}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPreviewItem(q)
                                                    }
                                                    className="font-semibold text-gray-900 hover:underline"
                                                >
                                                    Preview
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            {previewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close preview"
                        onClick={() => setPreviewItem(null)}
                    />
                    <div className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Question Preview
                            </h3>
                            <button
                                type="button"
                                onClick={() => setPreviewItem(null)}
                                className="text-sm font-semibold text-gray-700 hover:underline"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-3 overflow-y-auto px-6 pb-6 pt-4 text-sm text-gray-700">
                            <p>
                                <span className="font-semibold">Order:</span>{' '}
                                {previewItem.sort_order}
                            </p>
                            <p>
                                <span className="font-semibold">Type:</span>{' '}
                                {previewItem.question?.type ?? '-'}
                            </p>
                            <p>
                                <span className="font-semibold">
                                    Minutes:
                                </span>{' '}
                                {previewItem.duration_per_question}
                            </p>
                            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                                <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                                    Question
                                </p>
                                <p className="whitespace-pre-wrap text-gray-900">
                                    {previewItem.question?.question_text ?? '-'}
                                </p>
                            </div>

                            {previewItem.question?.narrative_text ? (
                                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                                    <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                                        Narrative / context
                                    </p>
                                    <p className="whitespace-pre-wrap text-gray-900">
                                        {previewItem.question.narrative_text}
                                    </p>
                                </div>
                            ) : null}

                            <div className="rounded-md border border-gray-200 bg-white p-3">
                                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                                    Answers / options
                                </p>
                                {optionsList.length > 0 ? (
                                    <ul className="space-y-2">
                                        {[...optionsList]
                                            .sort(
                                                (a, b) => a.order - b.order,
                                            )
                                            .map((opt) => (
                                                <li
                                                    key={opt.id}
                                                    className="flex flex-wrap items-start gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-gray-900"
                                                >
                                                    <span className="min-w-0 flex-1 whitespace-pre-wrap">
                                                        {opt.option_text}
                                                    </span>
                                                    {opt.is_correct ? (
                                                        <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                                            Correct
                                                        </span>
                                                    ) : null}
                                                </li>
                                            ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-600">
                                        No fixed options for this question type
                                        (e.g. essay or fill-in). Use the
                                        explanation below if available.
                                    </p>
                                )}
                            </div>

                            {previewItem.question?.explanation ? (
                                <div className="rounded-md border border-amber-100 bg-amber-50 p-3">
                                    <p className="mb-1 text-xs font-semibold uppercase text-amber-800">
                                        Explanation / rubric
                                    </p>
                                    <p className="whitespace-pre-wrap text-sm text-gray-900">
                                        {previewItem.question.explanation}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

