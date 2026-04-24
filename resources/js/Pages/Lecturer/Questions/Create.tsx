import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type OptionRow = { option_text: string; is_correct: boolean };
type MediaRow = {
    file: File | null;
    media_type: 'image' | 'audio' | 'video';
};

const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Multiple choice' },
    { value: 'true_false', label: 'True / False' },
    { value: 'essay', label: 'Essay' },
    { value: 'fill_blank', label: 'Fill in the blank' },
] as const;

export default function Create({
    skillCategories,
    levels,
}: {
    skillCategories: { id: number; name: string }[];
    levels: { id: number; name: string }[];
}) {
    const { data, setData, post, processing, errors, transform } = useForm<{
        skill_category_id: number | '';
        level_id: number | '';
        type: string;
        question_text: string;
        explanation: string;
        is_active: boolean;
        options: OptionRow[];
        media: MediaRow[];
    }>({
        skill_category_id: '',
        level_id: '',
        type: 'multiple_choice',
        question_text: '',
        explanation: '',
        is_active: true,
        options: [
            { option_text: '', is_correct: true },
            { option_text: '', is_correct: false },
        ],
        media: [],
    });

    transform((form) => {
        const mediaClean = (form.media ?? [])
            .filter((m): m is MediaRow & { file: File } => m.file !== null)
            .map((m) => ({ file: m.file, media_type: m.media_type }));

        const needsOptions =
            form.type === 'multiple_choice' || form.type === 'true_false';

        const { options: _opts, media: _med, ...rest } = form;

        return {
            ...rest,
            media: mediaClean,
            ...(needsOptions ? { options: form.options } : {}),
        };
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('lecturer.questions.store'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const showAnswerOptions =
        data.type === 'multiple_choice' || data.type === 'true_false';

    function addMediaRow() {
        if (data.media.length >= 5) {
            return;
        }
        setData('media', [
            ...data.media,
            { file: null, media_type: 'image' },
        ]);
    }

    function removeMediaRow(index: number) {
        setData(
            'media',
            data.media.filter((_, i) => i !== index),
        );
    }

    function updateMediaRow(
        index: number,
        patch: Partial<MediaRow>,
    ) {
        const next = [...data.media];
        next[index] = { ...next[index], ...patch };
        setData('media', next);
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Create Question
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
            <Head title="Create Question" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <form
                            onSubmit={submit}
                            className="space-y-6 p-6"
                            encType="multipart/form-data"
                        >
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
                                                e.target.value === ''
                                                    ? ''
                                                    : Number(e.target.value),
                                            )
                                        }
                                        required
                                    >
                                        <option value="">Select...</option>
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
                                                e.target.value === ''
                                                    ? ''
                                                    : Number(e.target.value),
                                            )
                                        }
                                        required
                                    >
                                        <option value="">Select...</option>
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
                                    onChange={(e) => {
                                        const nextType = e.target.value;
                                        setData('type', nextType);
                                        if (nextType === 'true_false') {
                                            setData('options', [
                                                {
                                                    option_text: 'True',
                                                    is_correct: true,
                                                },
                                                {
                                                    option_text: 'False',
                                                    is_correct: false,
                                                },
                                            ]);
                                        }
                                        if (nextType === 'multiple_choice') {
                                            setData('options', [
                                                {
                                                    option_text: '',
                                                    is_correct: true,
                                                },
                                                {
                                                    option_text: '',
                                                    is_correct: false,
                                                },
                                            ]);
                                        }
                                    }}
                                    required
                                >
                                    {QUESTION_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
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
                                    required
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.question_text}
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
                                {(data.type === 'essay' ||
                                    data.type === 'fill_blank') && (
                                    <p className="mt-2 text-xs text-gray-600">
                                        For essay and fill-in-the-blank questions,
                                        enter the reference answer in the
                                        Explanation field.
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            Media (optional)
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            Upload images, audio, or video (max
                                            5 files, 20MB each).
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addMediaRow}
                                        disabled={data.media.length >= 5}
                                        className="mt-2 inline-flex rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50 sm:mt-0"
                                    >
                                        Add file
                                    </button>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {data.media.length === 0 && (
                                        <p className="text-sm text-gray-500">
                                            No files added. Use “Add file” to
                                            attach media to this question.
                                        </p>
                                    )}
                                    {data.media.map((row, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-md border border-gray-200 bg-white p-3"
                                        >
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <InputLabel
                                                        htmlFor={`media_type_${idx}`}
                                                        value="Media type"
                                                    />
                                                    <select
                                                        id={`media_type_${idx}`}
                                                        className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        value={row.media_type}
                                                        onChange={(e) =>
                                                            updateMediaRow(
                                                                idx,
                                                                {
                                                                    media_type:
                                                                        e.target
                                                                            .value as MediaRow['media_type'],
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <option value="image">
                                                            Image
                                                        </option>
                                                        <option value="audio">
                                                            Audio
                                                        </option>
                                                        <option value="video">
                                                            Video
                                                        </option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        htmlFor={`media_file_${idx}`}
                                                        value="File"
                                                    />
                                                    <input
                                                        id={`media_file_${idx}`}
                                                        type="file"
                                                        accept={
                                                            row.media_type ===
                                                            'image'
                                                                ? 'image/jpeg,image/png,image/gif,image/webp'
                                                                : row.media_type ===
                                                                    'audio'
                                                                  ? 'audio/mpeg,audio/wav,audio/ogg'
                                                                  : 'video/mp4,video/webm'
                                                        }
                                                        className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-800"
                                                        onChange={(e) => {
                                                            const f =
                                                                e.target
                                                                    .files?.[0] ??
                                                                null;
                                                            updateMediaRow(
                                                                idx,
                                                                {
                                                                    file: f,
                                                                },
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeMediaRow(idx)
                                                    }
                                                    className="text-sm font-semibold text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {Object.entries(errors)
                                    .filter(([key]) =>
                                        key.startsWith('media.'),
                                    )
                                    .map(([key, msg]) => (
                                        <InputError
                                            key={key}
                                            className="mt-2"
                                            message={msg}
                                        />
                                    ))}
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

                            {showAnswerOptions && (
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            Answer options
                                        </div>
                                        <p className="mt-1 text-xs text-gray-600">
                                            Enter each choice and mark exactly
                                            one correct answer (or adjust for
                                            True/False).
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div />
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
                                            disabled={
                                                data.type === 'true_false' ||
                                                data.options.length >= 6
                                            }
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
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                                    <div className="min-w-0 flex-1">
                                                        <InputLabel
                                                            htmlFor={`opt_${idx}`}
                                                            value={`Answer ${idx + 1}`}
                                                        />
                                                        <TextInput
                                                            id={`opt_${idx}`}
                                                            className="mt-1 block w-full"
                                                            value={opt.option_text}
                                                            disabled={
                                                                data.type ===
                                                                'true_false'
                                                            }
                                                            onChange={(e) => {
                                                                const next = [
                                                                    ...data.options,
                                                                ];
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

                                                    <div className="flex items-center gap-4 pt-1 sm:pt-7">
                                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                                            <input
                                                                type="radio"
                                                                name="correct_option"
                                                                className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                checked={
                                                                    opt.is_correct
                                                                }
                                                                onChange={() => {
                                                                    const next =
                                                                        data.options.map(
                                                                            (
                                                                                o,
                                                                                i,
                                                                            ) => ({
                                                                                ...o,
                                                                                is_correct:
                                                                                    i ===
                                                                                    idx,
                                                                            }),
                                                                        );
                                                                    setData(
                                                                        'options',
                                                                        next,
                                                                    );
                                                                }}
                                                            />
                                                            Correct
                                                        </label>
                                                    </div>

                                                    <div className="pt-1 sm:pt-7">
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
                                                                data.type ===
                                                                    'true_false' ||
                                                                data.options
                                                                    .length <= 2
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

                            {!showAnswerOptions && (
                                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                                    For essay and fill-in-the-blank questions,
                                    the reference answer is stored in the
                                    Explanation field. There are no multiple
                                    choice options for this question type.
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3">
                                <PrimaryButton disabled={processing}>
                                    Create
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
