import { useExamFocusMode } from '@/hooks/useExamFocusMode';
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

function TimerRing({
    remaining,
    total,
    label,
    sub,
    urgent,
}: {
    remaining: number;
    total: number;
    label: string;
    sub: string;
    urgent: boolean;
}) {
    const pct =
        total > 0 ? Math.min(100, Math.max(0, (remaining / total) * 100)) : 0;
    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
        <div className="flex items-center gap-3">
            <div className="relative h-[84px] w-[84px] shrink-0">
                <svg
                    className="-rotate-90 transform"
                    width="84"
                    height="84"
                    viewBox="0 0 84 84"
                    aria-hidden
                >
                    <circle
                        cx="42"
                        cy="42"
                        r="36"
                        fill="none"
                        className="stroke-white/10"
                        strokeWidth="8"
                    />
                    <circle
                        cx="42"
                        cy="42"
                        r="36"
                        fill="none"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className={
                            urgent
                                ? 'stroke-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]'
                                : 'stroke-teal-400'
                        }
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 1s linear',
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span
                        className={`font-mono text-lg font-bold tabular-nums leading-none ${
                            urgent ? 'text-rose-300' : 'text-white'
                        }`}
                    >
                        {formatSeconds(remaining)}
                    </span>
                </div>
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400/90">
                    {label}
                </p>
                <p className="text-xs text-slate-400">{sub}</p>
            </div>
        </div>
    );
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
        if (!session.duration_seconds) {
            return 0;
        }

        const start = new Date(session.started_at).getTime();
        const now = new Date(serverNow).getTime();
        const elapsed = Math.max(0, Math.floor((now - start) / 1000));
        return Math.max(0, session.duration_seconds - elapsed);
    }, [serverNow, session.duration_seconds, session.started_at]);

    const totalExamSeconds = session.duration_seconds ?? 0;

    const [globalRemaining, setGlobalRemaining] = useState(initialRemaining);
    const questionRemaining = useMemo(() => {
        if (!active) {
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
        if (!active) {
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
        if (!active) {
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

    const focusTrackingEnabled =
        questions.length > 0 && active !== undefined;

    const { requestFullscreen } = useExamFocusMode(
        session.id,
        focusTrackingEnabled,
    );

    if (!active) {
        return (
            <AuthenticatedLayout examMode>
                <Head title="Exam" />
                <div className="p-8 text-center text-sm text-slate-400">
                    Questions are not available for this session.
                </div>
            </AuthenticatedLayout>
        );
    }

    const saveAnswer = (): void => {
        const spent = Math.max(
            0,
            Math.floor((Date.now() - questionStartAt) / 1000),
        );
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
        const spent = Math.max(
            0,
            Math.floor((Date.now() - questionStartAt) / 1000),
        );
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
                setActiveIndex((prev) =>
                    Math.min(prev + 1, questions.length - 1),
                );
            },
        });
    };

    const completeExam = (): void => {
        const spent = Math.max(
            0,
            Math.floor((Date.now() - questionStartAt) / 1000),
        );
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

    const answeredCount = questions.filter(
        (q) => isAnswered(q) || optimisticAnsweredIds.has(q.id),
    ).length;
    const progressPct =
        questions.length > 0
            ? Math.round((answeredCount / questions.length) * 100)
            : 0;

    const globalUrgent = globalRemaining > 0 && globalRemaining <= 120;
    const questionUrgent =
        questionRemaining > 0 && questionRemaining <= 30;

    const levelName = session.level?.name ?? 'Exam';

    return (
        <AuthenticatedLayout examMode>
            <Head title={`Exam — ${levelName}`} />

            <div className="relative pb-10 pt-4 sm:pt-6">
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    aria-hidden
                >
                    <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
                    <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8">
                    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-teal-400/90">
                                {levelName}
                            </p>
                            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                                    Exam session
                            </h1>
                            <p className="mt-1 max-w-md text-sm text-slate-400">
                                    Focus on this question. Take a short breath,
                                    then continue - you've got this.
                            </p>
                            <button
                                type="button"
                                onClick={() => requestFullscreen()}
                                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/20"
                            >
                                <span aria-hidden>⛶</span>
                                Full-screen mode (optional)
                            </button>
                        </div>
                        <TimerRing
                            remaining={globalRemaining}
                            total={totalExamSeconds}
                            label="Exam time left"
                            sub="Time up = auto submit"
                            urgent={globalUrgent}
                        />
                    </div>

                    <div className="mb-6">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                            <span>
                                Progress:{' '}
                                <span className="font-semibold text-teal-300">
                                    {answeredCount}
                                </span>{' '}
                                / {questions.length} answered
                            </span>
                            <span className="tabular-nums">{progressPct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 ease-out"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
                        <aside className="lg:col-span-4">
                            <div className="sticky top-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg backdrop-blur-md">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Question map
                                </p>
                                <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
                                    {questions.map((q, idx) => {
                                        const answered =
                                            isAnswered(q) ||
                                            optimisticAnsweredIds.has(q.id);
                                        const isActive = idx === activeIndex;
                                        return (
                                            <button
                                                key={q.id}
                                                type="button"
                                                onClick={() =>
                                                    setActiveIndex(idx)
                                                }
                                                title={`Question ${q.order}`}
                                                className={[
                                                    'relative flex aspect-square items-center justify-center rounded-xl text-sm font-bold transition',
                                                    isActive
                                                        ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30 ring-2 ring-teal-300/60'
                                                        : answered
                                                          ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
                                                          : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10',
                                                ].join(' ')}
                                            >
                                                {q.order}
                                                {answered && !isActive ? (
                                                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                                                        ✓
                                                    </span>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                                    Click a number to jump. Check mark =
                                    answer already saved.
                                </p>
                            </div>
                        </aside>

                        <div className="lg:col-span-8">
                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/90 to-slate-900/95 shadow-2xl">
                                <div className="flex flex-col gap-3 border-b border-white/10 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-teal-400/90">
                                            Question
                                        </span>
                                        <p className="text-lg font-bold text-white">
                                            #{active.order}{' '}
                                            <span className="text-slate-500">
                                                / {questions.length}
                                            </span>
                                        </p>
                                    </div>
                                    <div
                                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-sm font-bold tabular-nums ${
                                            questionUrgent
                                                ? 'border-rose-500/50 bg-rose-500/10 text-rose-200 animate-pulse'
                                                : 'border-white/10 bg-white/5 text-slate-200'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Question timer
                                        </span>
                                        {formatSeconds(questionRemaining)}
                                    </div>
                                </div>

                                <div className="space-y-5 p-5 sm:p-7">
                                    {active.question.narrative_text && (
                                        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm leading-relaxed text-indigo-100">
                                            {active.question.narrative_text}
                                        </div>
                                    )}

                                    <div className="text-lg font-medium leading-relaxed text-white sm:text-xl">
                                        {active.question.question_text}
                                    </div>

                                    {(active.question.type ===
                                        'multiple_choice' ||
                                        active.question.type ===
                                            'true_false') && (
                                        <div className="space-y-3">
                                            {active.question.options
                                                ?.slice()
                                                .sort(
                                                    (a, b) =>
                                                        a.order - b.order,
                                                )
                                                .map((opt, optIdx) => {
                                                    const isSelected =
                                                        selectedOptionId ===
                                                        opt.id;
                                                    const letter =
                                                        String.fromCharCode(
                                                            65 + optIdx,
                                                        );
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedOptionId(
                                                                    opt.id,
                                                                )
                                                            }
                                                            className={[
                                                                'flex w-full gap-4 rounded-2xl border-2 px-4 py-4 text-left transition',
                                                                isSelected
                                                                    ? 'border-teal-400 bg-teal-500/15 shadow-[0_0_0_1px_rgba(45,212,191,0.3)] ring-2 ring-teal-400/20'
                                                                    : 'border-white/10 bg-white/[0.04] hover:border-teal-500/40 hover:bg-white/[0.07]',
                                                            ].join(' ')}
                                                        >
                                                            <span
                                                                className={[
                                                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                                                                    isSelected
                                                                        ? 'bg-teal-500 text-white'
                                                                        : 'bg-white/10 text-slate-300',
                                                                ].join(' ')}
                                                            >
                                                                {letter}
                                                            </span>
                                                            <span className="flex-1 pt-1.5 text-sm leading-relaxed text-slate-100 sm:text-base">
                                                                {
                                                                    opt.option_text
                                                                }
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    )}

                                    {(active.question.type === 'essay' ||
                                        active.question.type ===
                                            'fill_blank') && (
                                        <textarea
                                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white shadow-inner placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:text-base"
                                            rows={8}
                                            value={answerText}
                                            onChange={(e) =>
                                                setAnswerText(e.target.value)
                                            }
                                            placeholder="Write your answer here..."
                                        />
                                    )}

                                    <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
                                        <button
                                            type="button"
                                            onClick={saveAnswer}
                                            disabled={answerForm.processing}
                                            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-40"
                                        >
                                            Save answer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveAndNext}
                                            disabled={
                                                answerForm.processing ||
                                                activeIndex >=
                                                    questions.length - 1
                                            }
                                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:brightness-110 disabled:opacity-40"
                                        >
                                            Save & next question
                                        </button>
                                        <button
                                            type="button"
                                            onClick={completeExam}
                                            disabled={completeForm.processing}
                                            className="inline-flex items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-40 sm:ml-auto"
                                        >
                                            Finish & submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
