import SidebarNav from '@/Components/SidebarNav';
import { ReactNode } from 'react';

export default function MobileSidebarDrawer({
    open,
    onClose,
    title,
}: {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
}) {
    return (
        <div
            className={[
                'fixed inset-0 z-50 md:hidden',
                open ? 'pointer-events-auto' : 'pointer-events-none',
            ].join(' ')}
            aria-hidden={!open}
        >
            <div
                className={[
                    'absolute inset-0 bg-black/40 transition-opacity',
                    open ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
                onClick={onClose}
            />

            <div
                className={[
                    'absolute inset-y-0 left-0 w-[84%] max-w-xs border-r border-indigo-100/80 bg-white/95 shadow-2xl backdrop-blur transition-transform',
                    open ? 'translate-x-0' : '-translate-x-full',
                ].join(' ')}
                role="dialog"
                aria-modal="true"
            >
                <div className="relative flex items-center justify-between border-b border-indigo-100/80 px-4 py-3">
                    <div className="text-sm font-semibold text-indigo-900">
                        {title}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                        aria-label="Close sidebar"
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

                <div className="no-scrollbar h-[calc(100%-56px)] overflow-y-auto">
                    <SidebarNav onNavigate={onClose} />
                </div>
            </div>
        </div>
    );
}

