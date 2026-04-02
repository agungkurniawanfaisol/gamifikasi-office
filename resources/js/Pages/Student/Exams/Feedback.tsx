import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type SessionPayload = {
    id: number;
    status: string;
    total_score: number | null;
    max_possible_score: number | null;
    level?: { id: number; name: string };
    completion_message: string;
};

export default function Feedback({ session }: { session: SessionPayload }) {
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
                    Ujian selesai
                </h2>
            }
        >
            <Head title="Feedback ujian" />
            <div className="py-8">
                <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                            {session.completion_message}
                        </p>
                        <p className="mt-4 text-sm text-gray-600">
                            Level: {session.level?.name ?? ''} · Skor:{' '}
                            {session.total_score ?? 0}/
                            {session.max_possible_score ?? 0}
                        </p>
                    </div>

                    <form
                        onSubmit={submit}
                        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                    >
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                Beri penilaian & testimoni
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Pilih bintang (wajib) dan tuliskan singkat pengalaman
                                kamu mengikuti ujian ini.
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
                                        onMouseEnter={() => setHoverRating(n)}
                                        onMouseLeave={() => setHoverRating(null)}
                                        onClick={() => form.setData('rating', n)}
                                        aria-label={`${n} bintang`}
                                    >
                                        {n <= displayRating ? '★' : '☆'}
                                    </button>
                                ))}
                                <span className="ml-2 text-sm text-gray-600">
                                    {form.data.rating > 0
                                        ? `${form.data.rating}/5`
                                        : 'Pilih 1–5'}
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
                                Testimoni
                            </label>
                            <textarea
                                id="testimonial"
                                className="mt-1 w-full rounded-md border-gray-300 text-sm shadow-sm"
                                rows={5}
                                value={form.data.testimonial}
                                onChange={(e) =>
                                    form.setData('testimonial', e.target.value)
                                }
                                placeholder="Minimal 10 karakter."
                            />
                            {form.errors.testimonial && (
                                <p className="mt-1 text-sm text-red-600">
                                    {form.errors.testimonial}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <PrimaryButton disabled={form.processing}>
                                Kirim feedback
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
