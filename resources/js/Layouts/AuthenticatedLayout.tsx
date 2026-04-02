import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import MobileSidebarDrawer from '@/Components/MobileSidebarDrawer';
import SidebarNav from '@/Components/SidebarNav';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user!;
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-b from-gray-100 to-gray-50">
            <MobileSidebarDrawer
                open={mobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
                title={
                    <div className="flex items-center gap-2">
                        <ApplicationLogo className="h-6 w-6 fill-current text-gray-900" />
                        <span>Gamifikasi</span>
                    </div>
                }
            />

            <div className="flex h-screen">
                <aside className="hidden w-72 shrink-0 border-r border-gray-200/80 bg-white md:block">
                    <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
                        <Link href="/" className="flex items-center gap-2">
                            <ApplicationLogo className="h-7 w-7 fill-current text-gray-900" />
                            <span className="text-base font-semibold text-gray-900">
                                Gamifikasi
                            </span>
                        </Link>
                    </div>
                    <div className="h-[calc(100vh-64px)] overflow-y-auto">
                        <SidebarNav />
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <nav className="sticky top-0 z-40 border-b border-gray-100/80 bg-white/95 backdrop-blur">
                        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
                                    onClick={() => setMobileSidebarOpen(true)}
                                    aria-label="Open sidebar"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-6 w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                </button>

                                <div className="flex items-center gap-2 md:hidden">
                                    <Link
                                        href="/"
                                        className="flex items-center gap-2"
                                    >
                                        <ApplicationLogo className="h-7 w-7 fill-current text-gray-900" />
                                        <span className="text-sm font-semibold text-gray-900">
                                            Gamifikasi
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 focus:outline-none"
                                                >
                                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    {user.name}
                                                    <svg
                                                        className="ms-2 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link
                                                href={route('profile.edit')}
                                            >
                                                Profile
                                            </Dropdown.Link>
                                            <Dropdown.Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>
                    </nav>

                    {header && (
                        <header className="border-b border-gray-100 bg-white/90">
                            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                                {header}
                            </div>
                        </header>
                    )}

                    <main className="min-w-0 flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
