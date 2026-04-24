import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export type RecentScorePoint = {
    date: string | null;
    label: string;
    scorePercent: number;
    levelName: string;
};

export type LevelAvgPoint = {
    name: string;
    avgPercent: number;
};

export default function StudentCharts({
    recentScores,
    scoresByLevel,
}: {
    recentScores: RecentScorePoint[];
    scoresByLevel: LevelAvgPoint[];
}) {
    const lineData = recentScores.map((r) => ({
        ...r,
        shortLabel: r.label || '—',
    }));

    const hasLine = lineData.length > 0;
    const hasBar = scoresByLevel.length > 0;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                    Exam score history
                </h3>
                <p className="mb-4 text-xs text-gray-500">
                    Correct-answer percentage per session (chronological)
                </p>
                {hasLine ? (
                    <div className="h-64 w-full min-w-0">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={0}
                            minHeight={240}
                        >
                            <LineChart data={lineData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-gray-200"
                                />
                                <XAxis
                                    dataKey="shortLabel"
                                    tick={{ fontSize: 11 }}
                                    className="text-gray-500"
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11 }}
                                    width={36}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                    }}
                                    labelFormatter={(label) => String(label)}
                                    formatter={(value, _name, item) => {
                                        const v =
                                            typeof value === 'number'
                                                ? value
                                                : Number(value);
                                        const p = item?.payload as
                                            | RecentScorePoint
                                            | undefined;
                                        return [
                                            `${v}%`,
                                            p?.levelName
                                                ? `Level: ${p.levelName}`
                                                : 'Score',
                                        ];
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="scorePercent"
                                    stroke="#0d9488"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: '#0d9488' }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="flex h-48 items-center justify-center text-sm text-gray-500">
                        No completed exam history yet.
                    </p>
                )}
            </div>

            <div className="min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                    Average by level
                </h3>
                <p className="mb-4 text-xs text-gray-500">
                    Correct-answer percentage (average from completed sessions)
                </p>
                {hasBar ? (
                    <div className="h-64 w-full min-w-0">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={0}
                            minHeight={240}
                        >
                            <BarChart data={scoresByLevel} layout="vertical">
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-gray-200"
                                />
                                <XAxis
                                    type="number"
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={100}
                                    tick={{ fontSize: 11 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                    }}
                                    formatter={(value) => {
                                        const v =
                                            typeof value === 'number'
                                                ? value
                                                : Number(value);
                                        return [`${v}%`, 'Average'];
                                    }}
                                />
                                <Bar
                                    dataKey="avgPercent"
                                    fill="#6366f1"
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="flex h-48 items-center justify-center text-sm text-gray-500">
                        No per-level data yet.
                    </p>
                )}
            </div>
        </div>
    );
}
