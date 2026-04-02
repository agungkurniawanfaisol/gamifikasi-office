import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type OptionRow = {
    id: number;
    option_text: string;
    is_correct: boolean;
    order: number;
};

type AnswerRow = {
    id: number;
    selected_option_id: number | null;
    answer_text: string | null;
    time_spent_seconds: number | null;
};

type SessionQuestionRow = {
    id: number;
    order: number;
    expected_duration_seconds: number;
    question: {
        id: number;
        type: string;
        question_text: string;
        narrative_text: string | null;
        explanation: string | null;
        options: OptionRow[];
    };
    answer?: AnswerRow;
};

type SessionData = {
    id: number;
    status: string;
    started_at: string;
    duration_seconds: number | null;
    level?: { id: number; name: string };
    session_questions: SessionQuestionRow[];
};

function formatSeconds(v: number): string {
    const sec = Math.max(0, v);
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

function isAnswered(q: SessionQuestionRow): boolean {
    const t = q.question.type;
    if (t === 'multiple_choice' || t === 'true_false') {
        return q.answer?.selected_option_id != null;
    }
    if (t === 'essay' || t === 'fill_blank') {
        return (q.answer?.answer_text?.trim() ?? '') !== '';
    }
    return false;
}

export default function Show({
    session,
    serverNow,
}: {
    session: SessionData;
    serverNow: string;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(
        null,
    );
    const [answerText, setAnswerText] = useState('');
    const [questionStartAt, setQuestionStartAt] = useState<number>(
        Date.now(),
    );
    const [optimisticAnsweredIds, setOptimisticAnsweredIds] = useState<
        Set<number>
    >(new Set());

    const questions = session.session_questions ?? [];
    const active = questions[activeIndex];

    const initialRemaining = useMemo(() => {
        if (! session.duration_seconds) {
            return 0;
        }

        const start = new Date(session.started_at).getTime();
        const now = new Date(serverNow).getTime();
        const elapsed = Math.max(0, Math.floor((now - start) / 1000));
        return Math.max(0, session.duration_seconds - elapsed);
    }, [serverNow, session.duration_seconds, session.started_at]);

    const [globalRemaining, setGlobalRemaining] = useState(initialRemaining);
    const questionRemaining = useMemo(() => {
        if (! active) {
            return 0;
        }
        const elapsed = Math.floor((Date.now() - questionStartAt) / 1000);
        return Math.max(0, active.expected_duration_seconds - elapsed);
    }, [active, questionStartAt, globalRemaining]);

    const answerForm = useForm({
        exam_session_id: session.id,
        exam_session_question_id: 0,
        question_id: 0,
        selected_option_id: null as number | null,
        answer_text: null as string | null,
        time_spent_seconds: 0,
    });

    const completeForm = useForm({
        exam_session_id: session.id,
        timed_out: false,
    });

    const hasDraftAnswer = (): boolean => {
        if (! active) {
            return false;
        }

        if (
            active.question.type === 'multiple_choice' ||
            active.question.type === 'true_false'
        ) {
            return selectedOptionId !== null;
        }

        if (
            active.question.type === 'essay' ||
            active.question.type === 'fill_blank'
        ) {
            return answerText.trim() !== '';
        }

        return false;
    };

    useEffect(() => {
        const t = window.setInterval(() => {
            setGlobalRemaining((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => window.clearInterval(t);
    }, []);

    useEffect(() => {
        if (! active) {
            return;
        }

        setSelectedOptionId(active.answer?.selected_option_id ?? null);
        setAnswerText(active.answer?.answer_text ?? '');
        setQuestionStartAt(Date.now());
    }, [active?.id]);

    useEffect(() => {
        if (globalRemaining !== 0) {
            return;
        }
        completeForm.setData({
            exam_session_id: session.id,
            timed_out: true,
        });
        completeForm.post(route('student.exams.complete'), {
            preserveScroll: true,
        });
    }, [globalRemaining]);

    if (! active) {
        return (
            <AuthenticatedLayout>
                <Head title="Ujian" />
                <div className="p-8 text-sm text-gray-700">
                    Soal tidak tersedia untuk sesi ini.
                </div>
            </AuthenticatedLayout>
        );
    }

    const saveAnswer = (): void => {
        const spent = Math.max(0, Math.floor((Date.now() - questionStartAt) / 1000));
        answerForm.setData({
            exam_session_id: session.id,
            exam_session_question_id: active.id,
            question_id: active.question.id,
            selected_option_id: selectedOptionId,
            answer_text: answerText.trim() === '' ? null : answerText,
            time_spent_seconds: spent,
        });
        answerForm.post(route('student.exams.answer'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (hasDraftAnswer()) {
                    setOptimisticAnsweredIds((prev) => {
                        const next = new Set(prev);
                        next.add(active.id);
                        return next;
                    });
                }
            },
        });
    };

    const saveAndNext = (): void => {
        const spent = Math.max(0, Math.floor((Date.now() - questionStartAt) / 1000));
        answerForm.setData({
            exam_session_id: session.id,
            exam_session_question_id: active.id,
            question_id: active.question.id,
            selected_option_id: selectedOptionId,
            answer_text: answerText.trim() === '' ? null : answerText,
            time_spent_seconds: spent,
        });
        answerForm.post(route('student.exams.answer'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (hasDraftAnswer()) {
                    setOptimisticAnsweredIds((prev) => {
                        const next = new Set(prev);
                        next.add(active.id);
                        return next;
                    });
                }
                setActiveIndex((prev) => Math.min(prev + 1, questions.length - 1));
            },
        });
    };

    const completeExam = (): void => {
        const spent = Math.max(0, Math.floor((Date.now() - questionStartAt) / 1000));
        answerForm.setData({
            exam_session_id: session.id,
            exam_session_question_id: active.id,
            question_id: active.question.id,
            selected_option_id: selectedOptionId,
            answer_text: answerText.trim() === '' ? null : answerText,
            time_spent_seconds: spent,
        });
        answerForm.post(route('student.exams.answer'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (hasDraftAnswer()) {
                    setOptimisticAnsweredIds((prev) => {
                        const next = new Set(prev);
                        next.add(active.id);
                        return next;
                    });
                }
                completeForm.setData({
                    exam_session_id: session.id,
                    timed_out: false,
                });
                completeForm.post(route('student.exams.complete'), {
                    preserveScroll: true,
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Ujian {session.level?.name ?? ''}
                    </h2>
                    <div className="text-sm font-semibold text-gray-700">
                        Total Timer: {formatSeconds(globalRemaining)}
                    </div>
                </div>
            }
        >
            <Head title="Sesi Ujian" />
            <div className="py-8">
                <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
                    <div className="rounded-lg bg-white p-4 shadow-sm lg:col-span-1">
                        <div className="mb-3 text-sm font-semibold text-gray-800">
                            Navigator Soal
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => {
                                const answered =
                                    isAnswered(q) ||
                                    optimisticAnsweredIds.has(q.id);
                                const active = idx === activeIndex;
                                let pill =
                                    'rounded border px-2 py-1 text-xs transition ';
                                if (active) {
                                    pill +=
                                        'border-gray-900 bg-gray-900 text-white';
                                } else if (answered) {
                                    pill +=
                                        'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                                } else {
                                    pill +=
                                        'border-gray-200 bg-white text-gray-700';
                                }
                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => setActiveIndex(idx)}
                                        className={pill}
                                    >
                                        {q.order}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm lg:col-span-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-gray-700">
                                Soal #{active.order}
                            </span>
                            <span className="text-gray-600">
                                Timer Soal: {formatSeconds(questionRemaining)}
                            </span>
                        </div>

                        {active.question.narrative_text && (
                            <div className="rounded border bg-gray-50 p-3 text-sm text-gray-700">
                                {active.question.narrative_text}
                            </div>
                        )}

                        <div className="text-base text-gray-900">
                            {active.question.question_text}
                        </div>

                        {(active.question.type === 'multiple_choice' ||
                            active.question.type === 'true_false') && (
                            <div className="space-y-2">
                                {active.question.options
                                    ?.slice()
                                    .sort((a, b) => a.order - b.order)
                                    .map((opt) => (
                                        <label
                                            key={opt.id}
                                            className="flex items-start gap-2 rounded border p-2 text-sm"
                                        >
                                            <input
                                                type="radio"
                                                name={`opt_${active.id}`}
                                                checked={selectedOptionId === opt.id}
                                                onChange={() => setSelectedOptionId(opt.id)}
                                            />
                                            <span>{opt.option_text}</span>
                                        </label>
                                    ))}
                            </div>
                        )}

                        {(active.question.type === 'essay' ||
                            active.question.type === 'fill_blank') && (
                            <textarea
                                className="w-full rounded border-gray-300 text-sm shadow-sm"
                                rows={6}
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="Tulis jawaban Anda..."
                            />
                        )}

                        <div className="flex flex-wrap gap-2 border-t pt-4">
                            <PrimaryButton
                                type="button"
                                onClick={saveAnswer}
                                disabled={answerForm.processing}
                            >
                                Simpan Jawaban
                            </PrimaryButton>
                            <PrimaryButton
                                type="button"
                                onClick={saveAndNext}
                                disabled={
                                    answerForm.processing ||
                                    activeIndex >= questions.length - 1
                                }
                            >
                                Next Soal
                            </PrimaryButton>
                            <PrimaryButton
                                type="button"
                                onClick={completeExam}
                                disabled={completeForm.processing}
                            >
                                Selesai Ujian
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

