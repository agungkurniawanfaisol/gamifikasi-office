import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Role = 'admin' | 'lecturer' | 'student';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        role: Role;
        is_active: boolean;
        phone_number: string;
        gender: 'male' | 'female';
        birth_date: string;
        address: string;
        bio: string;
        avatar: File | null;
        password: string;
    }>({
        name: '',
        email: '',
        role: 'student',
        is_active: true,
        phone_number: '',
        gender: 'male',
        birth_date: '',
        address: '',
        bio: '',
        avatar: null,
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.users.store'), { forceFormData: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Create User
                    </h2>
                    <Link
                        href={route('admin.users.index')}
                        className="text-sm font-semibold text-gray-700 hover:underline"
                    >
                        Back
                    </Link>
                </div>
            }
        >
            <Head title="Create User" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <form onSubmit={submit} className="space-y-6 p-6">
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

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel
                                        htmlFor="phone_number"
                                        value="Nomor HP"
                                    />
                                    <TextInput
                                        id="phone_number"
                                        className="mt-1 block w-full"
                                        value={data.phone_number}
                                        onChange={(e) =>
                                            setData('phone_number', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.phone_number}
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="gender"
                                        value="Jenis Kelamin"
                                    />
                                    <select
                                        id="gender"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.gender}
                                        onChange={(e) =>
                                            setData(
                                                'gender',
                                                e.target.value as
                                                    | 'male'
                                                    | 'female',
                                            )
                                        }
                                        required
                                    >
                                        <option value="male">Laki-laki</option>
                                        <option value="female">Perempuan</option>
                                    </select>
                                    <InputError
                                        className="mt-2"
                                        message={errors.gender}
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="birth_date"
                                        value="Date Lahir"
                                    />
                                    <TextInput
                                        id="birth_date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.birth_date}
                                        onChange={(e) =>
                                            setData('birth_date', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.birth_date}
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="avatar" value="Avatar" />
                                    <input
                                        id="avatar"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-800"
                                        onChange={(e) =>
                                            setData(
                                                'avatar',
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.avatar}
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="address" value="Alamat" />
                                <textarea
                                    id="address"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    value={data.address}
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.address}
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="bio"
                                    value="Bio (opsional)"
                                />
                                <textarea
                                    id="bio"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={3}
                                    value={data.bio}
                                    onChange={(e) =>
                                        setData('bio', e.target.value)
                                    }
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.bio}
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="role" value="Role" />
                                <select
                                    id="role"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.role}
                                    onChange={(e) =>
                                        setData('role', e.target.value as Role)
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

