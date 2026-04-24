import ActivityStepper from '@/Components/DailyActivity/ActivityStepper';
import RewardCelebration from '@/Components/DailyActivity/RewardCelebration';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type Activity = {
    activityDate: string;
    answeredCount: number;
    correctCount: number;
    minRequired: number;
    maxAllowed: number;
    isCompleted: boolean;
    streakAfterDay: number;
    progressPercent: number;
};

type Question = {
    id: number;
    question_text: string;
    options: Array<{
        id: number;
        option_text: string;
    }>;
    correct_option: {
        id: number;
        option_text: string;
    } | null;
};

type Answer = {
    question_id: number;
    selected_option_id: number | null;
    is_correct: boolean;
};

type Props = {
    activity: Activity;
    questions: Question[];
    answers: Answer[];
    rewardJustGranted: boolean;
    weeklyRewardPoints: number;
};

type SharedPageProps = PageProps<{
    flash?: {
        status?: string | null;
    };
    errors?: Record<string, string>;
}>;

export default function DailyActivityIndex({
    activity,
    questions,
    answers,
    rewardJustGranted,
    weeklyRewardPoints,
}: Props) {
    const { flash, errors } = usePage<SharedPageProps>().props;
    const completeForm = useForm({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [pendingQuestionId, setPendingQuestionId] = useState<number | null>(
        null,
    );

    const answerByQuestion = useMemo(
        () =>
            answers.reduce<
                Record<
                    number,
                    {
                        selectedOptionId: number | null;
                        isCorrect: boolean;
                    }
                >
            >((carry, answer) => {
                carry[answer.question_id] = {
                    selectedOptionId: answer.selected_option_id,
                    isCorrect: answer.is_correct,
                };
                return carry;
            }, {}),
        [answers],
    );

    const submitAnswer = (questionId: number, optionId: number) => {
        if (activity.isCompleted) {
            return;
        }

        setSubmitError(null);
        setPendingQuestionId(questionId);

        router.post(
            route('student.daily-activity.answer'),
            {
                question_id: questionId,
                selected_option_id: optionId,
            },
            {
                preserveScroll: true,
                onError: (formErrors) => {
                    const firstError =
                        formErrors.daily_activity ??
                        formErrors.selected_option_id ??
                        formErrors.question_id ??
                        'Answer could not be saved. Please try again.';
                    setSubmitError(firstError);
                },
                onFinish: () => {
                    setPendingQuestionId(null);
                },
            },
        );
    };

    const submitComplete = (e: FormEvent) => {
        e.preventDefault();
        completeForm.post(route('student.daily-activity.complete'), {
            preserveScroll: true,
        });
    };

    const completionRate = Math.round(
        (activity.correctCount / Math.max(1, activity.answeredCount)) * 100,
    );
    const remainingToMinimum = Math.max(
        0,
        activity.minRequired - activity.answeredCount,
    );
    const streakTier =
        activity.streakAfterDay >= 7
            ? 'Legend'
            : activity.streakAfterDay >= 4
              ? 'On Fire'
              : 'Rising';
    const completionLabel = activity.isCompleted
        ? "Today's mission is completed"
        : "Today's mission is not completed yet";
    const scrollToSection = (sectionId: string) => {
        document
            .getElementById(sectionId)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const handleStepClick = (stepIndex: number) => {
        const sectionByStep: Record<number, string> = {
            0: 'daily-hero',
            1: 'daily-questions',
            2: 'daily-summary',
            3: 'daily-complete',
        };
        scrollToSection(sectionByStep[stepIndex] ?? 'daily-hero');
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Daily Activity
                </h2>
            }
        >
            <Head title="Daily Activity" />

            <div className="bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(20,184,166,0.15),transparent_50%),radial-gradient(ellipse_100%_80%_at_100%_0%,rgba(99,102,241,0.14),transparent_55%),linear-gradient(180deg,#f0fdfa_0%,#ffffff_45%,#eef2ff_100%)] py-8">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.status ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            {flash.status}
                        </div>
                    ) : null}
                    {submitError || errors?.daily_activity ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                            {submitError ?? errors?.daily_activity}
                        </div>
                    ) : null}

                    {rewardJustGranted ? (
                        <RewardCelebration
                            weeklyRewardPoints={weeklyRewardPoints}
                        />
                    ) : null}

                    <ActivityStepper
                        answeredCount={activity.answeredCount}
                        minRequired={activity.minRequired}
                        maxAllowed={activity.maxAllowed}
                        isCompleted={activity.isCompleted}
                        onStepClick={handleStepClick}
                    />

                    <div
                        id="daily-hero"
                        className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-teal-100/70 backdrop-blur"
                    >
                        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-teal-200/60 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-indigo-200/60 blur-3xl" />

                        <div className="relative border-b border-white/60 bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500 px-5 py-5 text-white">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-50/90">
                                        Daily Challenge
                                    </p>
                                    <p className="mt-1 text-2xl font-extrabold tracking-tight">
                                        Complete your daily mission
                                    </p>
                                    <p className="mt-1 text-sm text-teal-50/90">
                                        Stay consistent for 7 days to earn a badge +{' '}
                                        {weeklyRewardPoints} points.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/35 bg-white/20 px-4 py-2 text-right backdrop-blur-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-50/90">
                                        Streak Tier
                                    </p>
                                    <p className="text-base font-bold">
                                        {streakTier}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-teal-700">
                                        Activity date {activity.activityDate}
                                    </p>
                                    <p className="mt-1 text-lg font-semibold text-gray-900">
                                        {activity.answeredCount}/{activity.maxAllowed}{' '}
                                        questions answered
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {completionLabel} · Accuracy{' '}
                                        {completionRate}%
                                    </p>
                                </div>
                                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm">
                                    Minimum {activity.minRequired} questions/day
                                </span>
                            </div>

                            <div className="mt-5 rounded-2xl border border-white/60 bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-white">
                                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-300">
                                    <span>Mission Progress</span>
                                    <span>{activity.progressPercent}%</span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-white/20">
                                    <div
                                        className="h-3 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 transition-all"
                                        style={{
                                            width: `${activity.progressPercent}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
                                        Daily target
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-900">
                                        Min {activity.minRequired} questions
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                                        Remaining target
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-900">
                                        {remainingToMinimum} questions left
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-3 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                                        Weekly reward
                                    </p>
                                    <p className="mt-1 text-base font-bold text-slate-900">
                                        Badge + {weeklyRewardPoints} points
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="daily-questions" className="space-y-4">
                        {questions.map((question, index) => (
                            <div
                                key={question.id}
                                className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-md shadow-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 text-xs font-extrabold text-white shadow">
                                        {index + 1}
                                    </span>
                                    <p className="pt-0.5 font-medium text-gray-900">
                                        {question.question_text}
                                    </p>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Choose one best answer.
                                </p>

                                <div className="mt-4 space-y-2">
                                    {question.options.map((option) => {
                                        const answerState =
                                            answerByQuestion[question.id];
                                        const isSelected =
                                            answerState?.selectedOptionId ===
                                            option.id;
                                        const isSelectedCorrect =
                                            Boolean(isSelected) &&
                                            Boolean(answerState?.isCorrect);
                                        const isSelectedWrong =
                                            Boolean(isSelected) &&
                                            !answerState?.isCorrect;
                                        const isCorrectVisible =
                                            question.correct_option?.id ===
                                            option.id;

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                disabled={
                                                    activity.isCompleted ||
                                                    pendingQuestionId !== null
                                                }
                                                onClick={() =>
                                                    submitAnswer(
                                                        question.id,
                                                        option.id,
                                                    )
                                                }
                                                className={[
                                                    'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition',
                                                    isSelectedCorrect
                                                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-sm'
                                                        : isSelectedWrong
                                                          ? 'border-rose-500 bg-gradient-to-r from-rose-50 to-red-50 text-rose-900 shadow-sm'
                                                          : isCorrectVisible
                                                            ? 'border-blue-400 bg-blue-50 text-blue-900'
                                                            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40',
                                                    activity.isCompleted ||
                                                    pendingQuestionId !== null
                                                        ? 'cursor-not-allowed opacity-80'
                                                        : '',
                                                ].join(' ')}
                                            >
                                                {option.option_text}
                                                {isCorrectVisible ? (
                                                    <span className="ml-2 text-xs font-semibold text-blue-700">
                                                        ✓ Correct answer
                                                    </span>
                                                ) : null}
                                                {isSelectedWrong ? (
                                                    <span className="ml-2 text-xs font-semibold text-rose-700">
                                                        ✗ Your answer is incorrect
                                                    </span>
                                                ) : null}
                                                {pendingQuestionId ===
                                                question.id ? (
                                                    <span className="ml-2 text-xs text-blue-700">
                                                        Saving...
                                                    </span>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                                {question.correct_option ? (
                                    <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
                                        Correct answer:{' '}
                                        {question.correct_option.option_text}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>

                    <form
                        id="daily-complete"
                        onSubmit={submitComplete}
                        className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-md"
                    >
                        <p className="text-sm text-gray-600">
                            Daily activity is valid if you answer at least{' '}
                            {activity.minRequired} questions. Maximum answers per
                            day is {activity.maxAllowed} questions.
                        </p>
                        <div className="mt-4 flex justify-end">
                            <PrimaryButton
                                disabled={
                                    activity.isCompleted ||
                                    completeForm.processing ||
                                    pendingQuestionId !== null
                                }
                            >
                                {activity.isCompleted
                                    ? 'Already completed'
                                    : 'Complete daily activity'}
                            </PrimaryButton>
                        </div>
                    </form>

                    <div
                        id="daily-summary"
                        className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900 shadow-sm"
                    >
                        <p className="font-semibold">Today's Progress Summary</p>
                        <p className="mt-1">
                            Answered: {activity.answeredCount}/{activity.maxAllowed}{' '}
                            questions · Accuracy: {completionRate}% · Streak:{' '}
                            {activity.streakAfterDay} days.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
