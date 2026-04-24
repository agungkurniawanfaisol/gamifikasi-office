import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type InsightFilters = {
    window: '7d' | '30d' | 'custom';
    from: string;
    to: string;
    level_id: number | null;
    min_attempts: number;
};

type HardestQuestion = {
    question_id: number;
    question_text: string;
    skill_category_id: number;
    skill_category_name: string;
    attempt_count: number;
    correct_count: number;
    wrong_count: number;
    correct_rate: number;
    wrong_rate: number;
    median_time_spent_seconds: number | null;
    difficulty_score: number;
    confidence: 'high' | 'medium' | 'low';
};

type WeakTopic = {
    skill_category_id: number;
    skill_category_name: string;
    attempt_count: number;
    wrong_count: number;
    accuracy: number;
    wrong_rate: number;
    confidence: 'high' | 'medium' | 'low';
    trend_vs_previous_period: number;
};

type RemedialRecommendation = {
    skill_category_id: number;
    skill_category_name: string;
    reason_tag: string;
    active_question_pool: number;
    suggested_questions: Array<{
        question_id: number;
        question_text: string;
        attempt_count: number;
        accuracy: number;
        wrong_count: number;
    }>;
    cta: {
        label: string;
        url: string;
    };
};

type Props = {
    filters: InsightFilters;
    summary: {
        date_range: { from: string; to: string };
        total_questions_analyzed: number;
        total_attempts_analyzed: number;
        average_accuracy: number;
        minimum_sample_threshold: number;
    };
    hardest_questions: HardestQuestion[];
    weak_topics: WeakTopic[];
    remedial_recommendations: RemedialRecommendation[];
    metrics: {
        difficulty_formula: string;
        min_attempts_default: number;
        confidence_thresholds: {
            high: number;
            medium: number;
            low: number;
        };
    };
};

export default function Index({
    filters,
    summary,
    hardest_questions,
    weak_topics,
    remedial_recommendations,
    metrics,
}: Props) {
    const [windowValue, setWindowValue] = useState<InsightFilters['window']>(
        filters.window,
    );
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [minAttempts, setMinAttempts] = useState<number>(filters.min_attempts);
    const [levelId, setLevelId] = useState<string>(
        filters.level_id !== null ? String(filters.level_id) : '',
    );

    const query = useMemo(
        () => ({
            window: windowValue,
            from,
            to,
            min_attempts: minAttempts,
            level_id: levelId === '' ? undefined : Number(levelId),
        }),
        [windowValue, from, to, minAttempts, levelId],
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(route('admin.instructor-insights.index'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Instructor Insight Dashboard
                </h2>
            }
        >
            <Head title="Instructor Insight Dashboard" />

            <div className="space-y-6 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    Window
                                </span>
                                <select
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={windowValue}
                                    onChange={(e) =>
                                        setWindowValue(
                                            e.target
                                                .value as InsightFilters['window'],
                                        )
                                    }
                                >
                                    <option value="7d">Last 7 days</option>
                                    <option value="30d">Last 30 days</option>
                                    <option value="custom">Custom range</option>
                                </select>
                            </label>
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    From date
                                </span>
                                <input
                                    type="date"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </label>
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    To date
                                </span>
                                <input
                                    type="date"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </label>
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    Level ID
                                </span>
                                <input
                                    type="number"
                                    value={levelId}
                                    onChange={(e) => setLevelId(e.target.value)}
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="All levels"
                                />
                            </label>
                            <label className="text-sm text-slate-700">
                                <span className="mb-1 block font-medium">
                                    Minimum attempts
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    value={minAttempts}
                                    onChange={(e) =>
                                        setMinAttempts(
                                            Math.max(1, Number(e.target.value)),
                                        )
                                    }
                                    className="w-full rounded-lg border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </label>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                data-audit="instructor-insights.apply-filters"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
                    <StatCard
                        label="Questions Analyzed"
                        value={summary.total_questions_analyzed}
                    />
                    <StatCard
                        label="Attempts Analyzed"
                        value={summary.total_attempts_analyzed}
                    />
                    <StatCard
                        label="Average Accuracy"
                        value={`${summary.average_accuracy}%`}
                    />
                    <StatCard
                        label="Min Sample"
                        value={summary.minimum_sample_threshold}
                    />
                </div>

                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900">
                            Hardest Questions Heatmap
                        </h3>
                        <p className="mt-1 text-xs text-slate-600">
                            Difficulty formula: {metrics.difficulty_formula}
                        </p>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {[
                                            'Question',
                                            'Topic',
                                            'Attempts',
                                            'Wrong rate',
                                            'Median time',
                                            'Difficulty',
                                            'Confidence',
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {hardest_questions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-3 py-6 text-center text-sm text-slate-500"
                                            >
                                                No difficult questions found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        hardest_questions.map((row) => (
                                            <tr key={row.question_id}>
                                                <td className="px-3 py-2 text-sm text-slate-800">
                                                    {row.question_text}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {row.skill_category_name}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {row.attempt_count}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {row.wrong_rate}%
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {row.median_time_spent_seconds ?? '-'}s
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {row.difficulty_score}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {row.confidence}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900">
                            Most Missed Topics
                        </h3>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {[
                                            'Topic',
                                            'Attempts',
                                            'Wrong answers',
                                            'Accuracy',
                                            'Trend',
                                            'Confidence',
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {weak_topics.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-3 py-6 text-center text-sm text-slate-500"
                                            >
                                                No weak topics found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        weak_topics.map((topic) => (
                                            <tr key={topic.skill_category_id}>
                                                <td className="px-3 py-2 text-sm text-slate-800">
                                                    {topic.skill_category_name}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {topic.attempt_count}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {topic.wrong_count}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {topic.accuracy}%
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {topic.trend_vs_previous_period}%
                                                </td>
                                                <td className="px-3 py-2 text-sm text-slate-700">
                                                    {topic.confidence}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900">
                            Auto Remedial Recommendations
                        </h3>
                        <div className="mt-4 space-y-3">
                            {remedial_recommendations.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No recommendations available for the selected filters.
                                </p>
                            ) : (
                                remedial_recommendations.map((rec) => (
                                    <article
                                        key={rec.skill_category_id}
                                        className="rounded-xl border border-slate-200 p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {rec.skill_category_name}
                                                </p>
                                                <p className="text-xs text-slate-600">
                                                    Reason: {rec.reason_tag}
                                                </p>
                                            </div>
                                            <a
                                                href={rec.cta.url}
                                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                                                data-audit="instructor-insights.create-remedial-package"
                                                data-topic-id={rec.skill_category_id}
                                            >
                                                {rec.cta.label}
                                            </a>
                                        </div>
                                        <ul className="mt-3 space-y-1 text-sm text-slate-700">
                                            {rec.suggested_questions.map((q) => (
                                                <li key={q.question_id}>
                                                    - {q.question_text} ({q.accuracy}% accuracy, {q.attempt_count} attempts)
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}

