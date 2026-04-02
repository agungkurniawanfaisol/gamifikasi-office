import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export type SkillCount = { name: string; count: number };

export default function LecturerCharts({
    questionsBySkill,
}: {
    questionsBySkill: SkillCount[];
}) {
    const hasData = questionsBySkill.some((c) => c.count > 0);

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-1 text-sm font-semibold text-gray-900">
                Soal per kategori skill
            </h3>
            <p className="mb-4 text-xs text-gray-500">
                Distribusi soal yang Anda buat
            </p>
            {hasData ? (
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={questionsBySkill}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-gray-200"
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10 }}
                                interval={0}
                                angle={-25}
                                textAnchor="end"
                                height={70}
                            />
                            <YAxis allowDecimals={false} width={32} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#0d9488"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="flex h-48 items-center justify-center text-sm text-gray-500">
                    Belum ada soal per skill.
                </p>
            )}
        </div>
    );
}
