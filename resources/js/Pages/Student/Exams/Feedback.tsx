import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type SessionPayload = {
    id: number;
    status: string;
    total_score: number | null;
    max_possible_score: number | null;
    level?: { id: number; name: string };
    completion_message: string;
    ai_status: 'pending' | 'ready' | 'failed' | null;
    ai_error_message: string | null;
};

type FeedbackPayload = {
    rating: number | null;
    testimonial: string | null;
    submitted_at: string | null;
    is_submitted: boolean;
};

type SharedPageProps = PageProps<{
    flash?: {
        status?: string | null;
    };
}>;

export default function Feedback({
    session,
    feedback,
}: {
    session: SessionPayload;
    feedback: FeedbackPayload;
}) {
    const { flash } = usePage<SharedPageProps>().props;
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const form = useForm({
        rating: 0,
        testimonial: '',
    });

    const displayRating = hoverRating ?? form.data.rating;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('student.exams.feedback.store', session.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold text-gray-800">
                    Exam Complete
                </h2>
            }
        >
            <Head title="Exam Feedback" />
            <div className="py-8">
                <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.status ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            {flash.status}
                        </div>
                    ) : null}

                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        {session.ai_status === 'pending' ? (
                            <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                                AI is preparing your personalized feedback. For now, the system is showing the default message.
                            </div>
                        ) : null}
                        {session.ai_status === 'failed' ? (
                            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                                AI feedback could not be generated yet. You are currently seeing the system default feedback.
                                {session.ai_error_message ? (
                                    <p className="mt-1 text-[11px] font-normal leading-relaxed text-amber-800">
                                        Gemini error details: {session.ai_error_message}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                            {session.completion_message}
                        </p>
                        <p className="mt-4 text-sm text-gray-600">
                            Level: {session.level?.name ?? ''} · Score:{' '}
                            {session.total_score ?? 0}/
                            {session.max_possible_score ?? 0}
                        </p>
                    </div>

                    {feedback.is_submitted ? (
                        <div className="space-y-4 rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Feedback saved
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Your feedback has been saved to the database.
                                </p>
                            </div>
                            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                                <p className="text-sm font-medium text-gray-700">
                                    Rating: {feedback.rating ?? '-'} / 5
                                </p>
                                <p className="mt-2 text-sm text-gray-700">
                                    {feedback.testimonial ?? '-'}
                                </p>
                                <p className="mt-2 text-xs text-gray-500">
                                    Saved at:{' '}
                                    {feedback.submitted_at
                                        ? new Date(
                                              feedback.submitted_at,
                                          ).toLocaleString('en-US')
                                        : '-'}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                                <Link
                                    href={route('student.rankings.index')}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                >
                                    View Rankings
                                </Link>
                                <Link
                                    href={route('student.exams.index')}
                                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                                >
                                    Back to Exam List
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={submit}
                            className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Leave a rating & testimonial
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                    Choose a star rating (required) and write a short
                                    testimonial about your exam experience.
                                </p>
                            </div>

                            <div>
                                <h4 className="mb-2 text-sm font-medium text-gray-700">
                                    Rating
                                </h4>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            className="rounded p-1 text-2xl leading-none transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900"
                                            onMouseEnter={() =>
                                                setHoverRating(n)
                                            }
                                            onMouseLeave={() =>
                                                setHoverRating(null)
                                            }
                                            onClick={() =>
                                                form.setData('rating', n)
                                            }
                                            aria-label={`${n} stars`}
                                        >
                                            {n <= displayRating ? '★' : '☆'}
                                        </button>
                                    ))}
                                    <span className="ml-2 text-sm text-gray-600">
                                        {form.data.rating > 0
                                            ? `${form.data.rating}/5`
                                            : 'Select 1–5'}
                                    </span>
                                </div>
                                {form.errors.rating && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {form.errors.rating}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="testimonial"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Testimonial
                                </label>
                                <textarea
                                    id="testimonial"
                                    className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm"
                                    rows={5}
                                    value={form.data.testimonial}
                                    onChange={(e) =>
                                        form.setData(
                                            'testimonial',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Minimum 10 characters"
                                />
                                {form.errors.testimonial && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {form.errors.testimonial}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <PrimaryButton disabled={form.processing}>
                                    Submit feedback
                                </PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
