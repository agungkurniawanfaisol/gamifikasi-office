import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    FormEventHandler,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

type QuestionRow = {
    id: number;
    level_id: number;
    type: string;
    question_text: string;
    is_active: boolean;
};

type ItemRow = {
    question_id: number;
    duration_per_question: number;
};

type Filters = {
    level_id: number | null;
    search: string;
};

function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(t);
    }, [value, delay]);

    return debounced;
}

export default function Create({
    levels,
    filters,
    questions,
}: {
    levels: { id: number; name: string }[];
    filters: Filters;
    questions: QuestionRow[];
}) {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        level_id: number | '';
        total_duration_minutes: number;
        items: ItemRow[];
    }>('exam-header-create-form', {
        title: '',
        level_id: filters.level_id ?? '',
        total_duration_minutes: 0,
        items: [],
    });

    const [searchInput, setSearchInput] = useState(filters.search ?? '');
    const debouncedSearch = useDebouncedValue(searchInput, 350);
    const skipInitialRefetch = useRef(true);

    useEffect(() => {
        if (skipInitialRefetch.current) {
            skipInitialRefetch.current = false;

            return;
        }

        router.get(
            route('admin.exam-headers.create'),
            {
                level_id:
                    typeof data.level_id === 'number' && data.level_id > 0
                        ? data.level_id
                        : undefined,
                search: debouncedSearch.trim() || undefined,
            },
            {
                preserveState: true,
                replace: true,
                only: ['questions', 'filters'],
            },
        );
    }, [debouncedSearch, data.level_id]);

    const totalFromItems = useMemo(() => {
        return data.items.reduce((sum, i) => {
            const m = i.duration_per_question;
            return sum + (Number.isFinite(m) ? m : 0);
        }, 0);
    }, [data.items]);

    useEffect(() => {
        setData('total_duration_minutes', totalFromItems);
    }, [totalFromItems, setData]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.cancel();
        post(route('admin.exam-headers.store'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const selectedIds = new Set(data.items.map((i) => i.question_id));

    function setQuestionSelected(questionId: number, checked: boolean): void {
        if (checked) {
            setData('items', [
                ...data.items,
                { question_id: questionId, duration_per_question: 1 },
            ]);

            return;
        }

        setData(
            'items',
            data.items.filter((i) => i.question_id !== questionId),
        );
    }

    function updateDuration(questionId: number, value: number): void {
        const clamped =
            Number.isFinite(value) && value >= 1
                ? Math.min(120, Math.trunc(value))
                : 1;

        setData(
            'items',
            data.items.map((i) =>
                i.question_id === questionId
                    ? { ...i, duration_per_question: clamped }
                    : i,
            ),
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Create Exam Header
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
            <Head title="Create Exam Header" />

            <div className="py-8 pb-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <form
                        id="exam-header-form"
                        onSubmit={submit}
                        className="flex flex-col gap-6"
                    >
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="space-y-5 rounded-lg bg-white p-6 shadow-sm lg:col-span-1">
                            <div>
                                <InputLabel htmlFor="title" value="Title" />
                                <TextInput
                                    id="title"
                                    className="mt-1 block w-full"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.title}
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="level_id" value="Level" />
                                <select
                                    id="level_id"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                                    <option value="">Select level...</option>
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

                            <div>
                                <InputLabel
                                    htmlFor="total_duration_display"
                                    value="Total Duration (minutes)"
                                />
                                <div
                                    id="total_duration_display"
                                    className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium tabular-nums text-gray-900"
                                    role="status"
                                    aria-live="polite"
                                >
                                    {totalFromItems}{' '}
                                    <span className="font-normal text-gray-600">
                                        minutes
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Sum of minutes for each selected question
                                    updates automatically.
                                </p>
                                <InputError
                                    className="mt-2"
                                    message={errors.total_duration_minutes}
                                />
                            </div>
                            </div>

                            <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
                            <div className="mb-4 text-sm font-semibold text-gray-900">
                                Pull questions from bank soal (level-based)
                            </div>
                            <div className="mb-4">
                                <InputLabel
                                    htmlFor="question_search"
                                    value="Search questions"
                                />
                                <TextInput
                                    id="question_search"
                                    type="search"
                                    className="mt-1 block w-full"
                                    value={searchInput}
                                    onChange={(e) =>
                                        setSearchInput(e.target.value)
                                    }
                                    placeholder="Search by question or narrative text…"
                                    autoComplete="off"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Filters the list below; selection and form
                                    fields are kept while searching.
                                </p>
                            </div>
                            <div className="space-y-3">
                                {questions.length === 0 ? (
                                    <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                                        No questions match this level and
                                        search. Try another keyword or clear the
                                        search box.
                                    </p>
                                ) : (
                                    questions.map((q) => {
                                        const checked = selectedIds.has(q.id);
                                        const currentDuration =
                                            data.items.find(
                                                (i) => i.question_id === q.id,
                                            )?.duration_per_question ?? 1;

                                        return (
                                            <div
                                                key={q.id}
                                                className="rounded-md border p-3"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <label className="flex cursor-pointer items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1 rounded border-gray-300"
                                                            checked={checked}
                                                            onChange={(e) =>
                                                                setQuestionSelected(
                                                                    q.id,
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                        <span>
                                                            <span className="block text-sm font-medium text-gray-900">
                                                                {q.question_text}
                                                            </span>
                                                            <span className="block text-xs text-gray-500">
                                                                Type: {q.type}
                                                            </span>
                                                        </span>
                                                    </label>

                                                    <div className="w-40">
                                                        <InputLabel
                                                            htmlFor={`d_${q.id}`}
                                                            value="Minutes"
                                                        />
                                                        <TextInput
                                                            id={`d_${q.id}`}
                                                            type="number"
                                                            min={1}
                                                            max={120}
                                                            disabled={!checked}
                                                            className="mt-1 block w-full"
                                                            value={
                                                                currentDuration
                                                            }
                                                            onChange={(e) => {
                                                                const raw =
                                                                    Number(
                                                                        e
                                                                            .target
                                                                            .value,
                                                                    );
                                                                updateDuration(
                                                                    q.id,
                                                                    raw,
                                                                );
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <InputError
                                className="mt-3"
                                message={errors.items}
                            />
                            </div>
                        </div>

                    </form>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 py-4 backdrop-blur">
                <div className="mx-auto flex max-w-7xl justify-center px-4 sm:px-6 lg:px-8">
                    <PrimaryButton
                        type="submit"
                        form="exam-header-form"
                        disabled={
                            processing ||
                            data.items.length === 0 ||
                            totalFromItems < 1
                        }
                    >
                        Save Header
                    </PrimaryButton>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
