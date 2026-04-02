import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type OptionRow = { option_text: string; is_correct: boolean };
type Role = 'admin' | 'lecturer' | 'student';

export default function Edit({
    question,
    skillCategories,
    levels,
}: {
    question: {
        id: number;
        skill_category_id: number;
        level_id: number;
        type: string;
        question_text: string;
        narrative_text: string | null;
        explanation: string | null;
        is_active: boolean;
        options: {
            id: number;
            option_text: string;
            is_correct: boolean;
            order: number;
        }[];
    };
    skillCategories: { id: number; name: string }[];
    levels: { id: number; name: string }[];
}) {
    const { data, setData, put, processing, errors } = useForm<{
        skill_category_id: number;
        level_id: number;
        type: string;
        question_text: string;
        narrative_text: string;
        explanation: string;
        is_active: boolean;
        options: OptionRow[];
    }>({
        skill_category_id: question.skill_category_id,
        level_id: question.level_id,
        type: question.type,
        question_text: question.question_text,
        narrative_text: question.narrative_text ?? '',
        explanation: question.explanation ?? '',
        is_active: question.is_active,
        options:
            question.options?.length > 0
                ? [...question.options]
                      .sort((a, b) => a.order - b.order)
                      .map((o) => ({
                          option_text: o.option_text,
                          is_correct: o.is_correct,
                      }))
                : [
                      { option_text: '', is_correct: true },
                      { option_text: '', is_correct: false },
                  ],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('lecturer.questions.update', question.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Question
                    </h2>
                    <Link
                        href={route('lecturer.questions.index')}
                        className="text-sm font-semibold text-gray-700 hover:underline"
                    >
                        Back
                    </Link>
                </div>
            }
        >
            <Head title="Edit Question" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <form onSubmit={submit} className="space-y-6 p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="skill_category_id"
                                        value="Skill Category"
                                    />
                                    <select
                                        id="skill_category_id"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.skill_category_id}
                                        onChange={(e) =>
                                            setData(
                                                'skill_category_id',
                                                Number(e.target.value),
                                            )
                                        }
                                    >
                                        {skillCategories.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        className="mt-2"
                                        message={errors.skill_category_id}
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="level_id"
                                        value="Level"
                                    />
                                    <select
                                        id="level_id"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.level_id}
                                        onChange={(e) =>
                                            setData(
                                                'level_id',
                                                Number(e.target.value),
                                            )
                                        }
                                    >
                                        {levels.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {l.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        className="mt-2"
                                        message={errors.level_id}
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="type" value="Type" />
                                <select
                                    id="type"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.type}
                                    onChange={(e) =>
                                        setData('type', e.target.value)
                                    }
                                >
                                    <option value="multiple_choice">
                                        Multiple choice
                                    </option>
                                    <option value="true_false">
                                        True / False
                                    </option>
                                    <option value="essay">Essay</option>
                                    <option value="fill_blank">
                                        Fill in the blank
                                    </option>
                                </select>
                                <InputError
                                    className="mt-2"
                                    message={errors.type}
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="question_text"
                                    value="Question"
                                />
                                <textarea
                                    id="question_text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={5}
                                    value={data.question_text}
                                    onChange={(e) =>
                                        setData('question_text', e.target.value)
                                    }
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.question_text}
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="narrative_text"
                                    value="Narrative (optional)"
                                />
                                <textarea
                                    id="narrative_text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    value={data.narrative_text}
                                    onChange={(e) =>
                                        setData(
                                            'narrative_text',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.narrative_text}
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="explanation"
                                    value="Explanation (optional)"
                                />
                                <textarea
                                    id="explanation"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    value={data.explanation}
                                    onChange={(e) =>
                                        setData('explanation', e.target.value)
                                    }
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.explanation}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData('is_active', e.target.checked)
                                    }
                                />
                                <label
                                    htmlFor="is_active"
                                    className="text-sm text-gray-700"
                                >
                                    Active
                                </label>
                                <InputError
                                    className="mt-2"
                                    message={errors.is_active}
                                />
                            </div>

                            {(data.type === 'multiple_choice' ||
                                data.type === 'true_false') && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold text-gray-900">
                                            Options
                                        </div>
                                        <button
                                            type="button"
                                            className="text-sm font-semibold text-gray-700 hover:underline"
                                            onClick={() =>
                                                setData('options', [
                                                    ...data.options,
                                                    {
                                                        option_text: '',
                                                        is_correct: false,
                                                    },
                                                ])
                                            }
                                            disabled={data.options.length >= 6}
                                        >
                                            Add option
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {data.options.map((opt, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-md border p-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1">
                                                        <InputLabel
                                                            htmlFor={`opt_${idx}`}
                                                            value={`Option ${idx + 1}`}
                                                        />
                                                        <TextInput
                                                            id={`opt_${idx}`}
                                                            className="mt-1 block w-full"
                                                            value={opt.option_text}
                                                            onChange={(e) => {
                                                                const next =
                                                                    [...data.options];
                                                                next[idx] = {
                                                                    ...next[idx],
                                                                    option_text:
                                                                        e.target
                                                                            .value,
                                                                };
                                                                setData(
                                                                    'options',
                                                                    next,
                                                                );
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="pt-7">
                                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                                checked={
                                                                    opt.is_correct
                                                                }
                                                                onChange={(e) => {
                                                                    const next =
                                                                        [
                                                                            ...data.options,
                                                                        ];
                                                                    next[idx] =
                                                                        {
                                                                            ...next[
                                                                                idx
                                                                            ],
                                                                            is_correct:
                                                                                e
                                                                                    .target
                                                                                    .checked,
                                                                        };
                                                                    setData(
                                                                        'options',
                                                                        next,
                                                                    );
                                                                }}
                                                            />
                                                            Correct
                                                        </label>
                                                    </div>

                                                    <div className="pt-7">
                                                        <button
                                                            type="button"
                                                            className="text-sm font-semibold text-red-600 hover:underline"
                                                            onClick={() => {
                                                                const next =
                                                                    data.options.filter(
                                                                        (_, i) =>
                                                                            i !==
                                                                            idx,
                                                                    );
                                                                setData(
                                                                    'options',
                                                                    next,
                                                                );
                                                            }}
                                                            disabled={
                                                                data.options
                                                                    .length <=
                                                                2
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <InputError
                                        className="mt-2"
                                        message={errors.options}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3">
                                <PrimaryButton disabled={processing}>
                                    Save
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

