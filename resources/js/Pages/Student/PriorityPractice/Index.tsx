import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type SessionData = {
    id: number;
    status: 'active' | 'completed' | 'expired';
    generatedAt: string;
    expiresAt: string;
    completedAt: string | null;
    answeredCount: number;
    correctCount: number;
    totalQuestions: number;
    focusSkill: string;
} | null;

type QuestionData = {
    id: number;
    question_text: string;
    options: Array<{
        id: number;
        option_text: string;
    }>;
};

type AnswerData = {
    id: number;
    question_id: number;
    selected_option_id: number | null;
    is_correct: boolean;
    answered_at: string | null;
};

type PriorityPracticeProps = PageProps<{
    session: SessionData;
    questions: QuestionData[];
    answers: AnswerData[];
    canCreateNewPackage?: boolean;
    errorMessage?: string | null;
    flash?: {
        status?: string | null;
    };
    errors?: Record<string, string>;
}>;

export default function Index({
    session,
    questions,
    answers,
    canCreateNewPackage = true,
    errorMessage,
}: PriorityPracticeProps) {
    const [pendingQuestionId, setPendingQuestionId] = useState<number | null>(
        null,
    );
    const [creatingPackage, setCreatingPackage] = useState(false);
    const page = usePage<PriorityPracticeProps>();
    const flashMessage = page.props.flash?.status ?? null;
    const submitError = page.props.errors?.priority_practice ?? null;

    const selectedByQuestion = useMemo(
        () =>
            answers.reduce<Record<number, number | null>>((carry, answer) => {
                carry[answer.question_id] = answer.selected_option_id;
                return carry;
            }, {}),
        [answers],
    );

    const progressPercent = session
        ? Math.round((session.answeredCount / Math.max(1, session.totalQuestions)) * 100)
        : 0;
    const accuracyPercent =
        session && session.answeredCount > 0
            ? Math.round((session.correctCount / session.answeredCount) * 100)
            : 0;

    const submitAnswer = (questionId: number, optionId: number) => {
        if (!session || session.status !== 'active') {
            return;
        }

        setPendingQuestionId(questionId);

        router.post(
            route('student.priority-practice.answer'),
            {
                priority_practice_session_id: session.id,
                question_id: questionId,
                selected_option_id: optionId,
            },
            {
                preserveScroll: true,
                onFinish: () => setPendingQuestionId(null),
            },
        );
    };

    const createNewPackage = () => {
        setCreatingPackage(true);
        router.post(
            route('student.priority-practice.store'),
            {},
            {
                preserveScroll: true,
                onFinish: () => setCreatingPackage(false),
            },
        );
    };

    const sessionMetaLine = session
        ? session.status === 'expired'
            ? `Package expired on ${session.expiresAt}.`
            : session.status === 'completed'
              ? `Package completed${
                    session.completedAt
                        ? ` on ${session.completedAt}`
                        : ` before ${session.expiresAt}`
                }.`
              : `Package valid until ${session.expiresAt} (48 hours).`
        : '';

    const statusBadgeClass =
        session?.status === 'completed'
            ? 'bg-emerald-100 text-emerald-700'
            : session?.status === 'expired'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-indigo-100 text-indigo-700';

    const statusBadgeLabel =
        session?.status === 'completed'
            ? 'Package completed'
            : session?.status === 'expired'
              ? 'Package expired'
              : 'Package active';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Priority Practice
                </h2>
            }
        >
            <Head title="My Priority Practice" />

            <div className="bg-[radial-gradient(ellipse_120%_80%_at_15%_-10%,rgba(99,102,241,0.22),transparent_50%),radial-gradient(ellipse_100%_70%_at_100%_0%,rgba(45,212,191,0.2),transparent_55%),linear-gradient(180deg,#eef2ff_0%,#ffffff_45%,#ecfeff_100%)] py-8">
                <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {flashMessage ? (
                        <div
                            aria-live="polite"
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                        >
                            {flashMessage}
                        </div>
                    ) : null}
                    {submitError ? (
                        <div
                            aria-live="polite"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800"
                        >
                            {submitError}
                        </div>
                    ) : null}
                    {errorMessage ? (
                        <div
                            aria-live="polite"
                            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
                        >
                            {errorMessage}
                        </div>
                    ) : null}

                    {!session && canCreateNewPackage ? (
                        <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-indigo-100">
                            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-300/30 blur-2xl" />
                            <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-teal-300/30 blur-2xl" />
                            <p className="text-sm font-semibold text-slate-800">
                                No priority practice package yet
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                                The package contains 5 questions from topics that
                                need reinforcement and is valid for 48 hours.
                                Create a new package to start automatic remedial practice.
                            </p>
                            <button
                                type="button"
                                onClick={createNewPackage}
                                disabled={creatingPackage}
                                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {creatingPackage
                                    ? 'Creating package...'
                                    : 'Create New Package'}
                            </button>
                        </section>
                    ) : null}

                    {session ? (
                        <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-indigo-100">
                            <div className="pointer-events-none absolute -left-10 top-24 h-24 w-24 rounded-full bg-violet-300/25 blur-2xl" />
                            <div className="border-b border-white/60 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 px-5 py-5 text-white">
                                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
                                    Automatic Remedial Package
                                </p>
                                <p className="mt-1 text-2xl font-extrabold tracking-tight">
                                    Focus topic: {session.focusSkill}
                                </p>
                                <p className="mt-1 text-sm text-indigo-100">
                                    {sessionMetaLine}
                                </p>
                            </div>
                            <div className="space-y-4 p-5">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <MiniStat
                                        label="Progress"
                                        value={`${session.answeredCount}/${session.totalQuestions}`}
                                    />
                                    <MiniStat
                                        label="Correct Answers"
                                        value={session.correctCount}
                                    />
                                    <MiniStat
                                        label="Accuracy"
                                        value={`${accuracyPercent}%`}
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <span>Package progress</span>
                                        <span>{progressPercent}%</span>
                                    </div>
                                    <div
                                        role="progressbar"
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={progressPercent}
                                        className="h-2.5 rounded-full bg-slate-200"
                                    >
                                        <div
                                            className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 transition-all"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                                <span
                                    className={[
                                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                        statusBadgeClass,
                                    ].join(' ')}
                                >
                                    {statusBadgeLabel}
                                </span>
                                {canCreateNewPackage ? (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={createNewPackage}
                                            disabled={creatingPackage}
                                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                                        >
                                            {creatingPackage
                                            ? 'Creating package...'
                                                : 'Create New Package'}
                                        </button>
                                        <p className="mt-2 text-xs text-slate-500">
                                            This is a summary of your latest package.
                                            Create a new package for the next automatic
                                            remedial cycle (maximum one active package
                                            at a time).
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    ) : null}

                    {session && questions.length > 0 ? (
                        <div className="space-y-4">
                            {questions.map((question, index) => {
                                const selectedOptionId =
                                    selectedByQuestion[question.id];
                                const alreadyAnswered =
                                    selectedOptionId !== undefined;

                                return (
                                    <article
                                        key={question.id}
                                        className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm"
                                    >
                                        <div className="pointer-events-none absolute -right-12 -top-10 h-24 w-24 rounded-full bg-indigo-200/20 blur-2xl" />
                                        <div className="flex items-start gap-3">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-bold text-white">
                                                {index + 1}
                                            </span>
                                            <p className="pt-0.5 font-medium text-gray-900">
                                                {question.question_text}
                                            </p>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {question.options.map((option) => (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() =>
                                                        submitAnswer(
                                                            question.id,
                                                            option.id,
                                                        )
                                                    }
                                                    disabled={
                                                        session.status !==
                                                            'active' ||
                                                        alreadyAnswered ||
                                                        pendingQuestionId !==
                                                            null
                                                    }
                                                    className={[
                                                        'w-full min-h-11 rounded-xl border px-3 py-2.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2',
                                                        selectedOptionId ===
                                                        option.id
                                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm shadow-indigo-100'
                                                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40',
                                                        session.status !==
                                                            'active' ||
                                                        alreadyAnswered ||
                                                        pendingQuestionId !==
                                                            null
                                                            ? 'cursor-not-allowed opacity-80'
                                                            : '',
                                                    ].join(' ')}
                                                >
                                                    {option.option_text}
                                                </button>
                                            ))}
                                        </div>
                                        {alreadyAnswered ? (
                                            <p className="mt-3 text-xs font-semibold text-slate-600">
                                                This question has already been answered.
                                            </p>
                                        ) : null}
                                    </article>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
        </div>
    );
}
