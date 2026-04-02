export default function StatCard({
    title,
    value,
    hint,
    accent = 'teal',
}: {
    title: string;
    value: string | number;
    hint?: string;
    accent?: 'teal' | 'indigo' | 'amber';
}) {
    const ring =
        accent === 'indigo'
            ? 'ring-indigo-100'
            : accent === 'amber'
              ? 'ring-amber-100'
              : 'ring-teal-100';
    const bar =
        accent === 'indigo'
            ? 'bg-indigo-500'
            : accent === 'amber'
              ? 'bg-amber-500'
              : 'bg-teal-500';

    return (
        <div
            className={`rounded-xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ${ring}`}
        >
            <div className={`mb-3 h-1 w-10 rounded-full ${bar}`} />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {title}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                {value}
            </p>
            {hint ? (
                <p className="mt-2 text-xs text-gray-500">{hint}</p>
            ) : null}
        </div>
    );
}
