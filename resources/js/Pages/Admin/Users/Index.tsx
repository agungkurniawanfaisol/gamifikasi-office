import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'lecturer' | 'student';
    is_active: boolean;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export default function Index({
    users,
}: {
    users: {
        data: UserRow[];
        links: PaginationLink[];
    };
}) {
    const [createOpen, setCreateOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<{
            name: string;
            email: string;
            role: 'admin' | 'lecturer' | 'student';
            is_active: boolean;
            password: string;
        }>({
            name: '',
            email: '',
            role: 'student',
            is_active: true,
            password: '',
        });

    function closeCreate() {
        setCreateOpen(false);
        reset();
        clearErrors();
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Master Users
                    </h2>
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Create
                    </button>
                </div>
            }
        >
            <Head title="Master Users" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="border-b px-4 py-3 sm:px-6">
                            <div className="text-sm text-gray-600">
                                Total shown: {users.data.length}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Active
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {users.data.map((u) => (
                                        <tr key={u.id}>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                                {u.name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                {u.email}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                {u.role}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                <span
                                                    className={[
                                                        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                                                        u.is_active
                                                            ? 'bg-green-50 text-green-700'
                                                            : 'bg-gray-100 text-gray-700',
                                                    ].join(' ')}
                                                >
                                                    {u.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Link
                                                        href={route(
                                                            'admin.users.edit',
                                                            u.id,
                                                        )}
                                                        className="font-semibold text-gray-900 hover:underline"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <Link
                                                        href={route(
                                                            'admin.users.destroy',
                                                            u.id,
                                                        )}
                                                        method="delete"
                                                        as="button"
                                                        className="font-semibold text-red-600 hover:underline"
                                                    >
                                                        Delete
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t px-4 py-3 sm:px-6">
                            <div className="flex flex-wrap gap-2">
                                {users.links.map((l) => (
                                    <Link
                                        key={l.label}
                                        href={l.url ?? ''}
                                        preserveScroll
                                        preserveState
                                        disabled={l.url === null}
                                        className={[
                                            'rounded-md px-3 py-2 text-sm',
                                            l.active
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
                                            l.url === null
                                                ? 'pointer-events-none opacity-50'
                                                : '',
                                        ].join(' ')}
                                        dangerouslySetInnerHTML={{
                                            __html: l.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                open={createOpen}
                onClose={closeCreate}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <DialogTitle className="text-sm font-semibold text-gray-900">
                                Create user
                            </DialogTitle>
                            <button
                                type="button"
                                onClick={closeCreate}
                                className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <form
                            className="space-y-5 p-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                post(route('admin.users.store'), {
                                    onSuccess: () => closeCreate(),
                                });
                            }}
                        >
                            <div>
                                <InputLabel htmlFor="name" value="Name" />
                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="role" value="Role" />
                                <select
                                    id="role"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.role}
                                    onChange={(e) =>
                                        setData(
                                            'role',
                                            e.target.value as 'admin' | 'lecturer' | 'student',
                                        )
                                    }
                                >
                                    <option value="admin">admin</option>
                                    <option value="lecturer">lecturer</option>
                                    <option value="student">student</option>
                                </select>
                                <InputError
                                    className="mt-2"
                                    message={errors.role}
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

                            <div>
                                <InputLabel
                                    htmlFor="password"
                                    value="Password"
                                />
                                <TextInput
                                    id="password"
                                    type="password"
                                    className="mt-1 block w-full"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.password}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={closeCreate}
                                    className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <PrimaryButton disabled={processing}>
                                    Create
                                </PrimaryButton>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </AuthenticatedLayout>
    );
}

