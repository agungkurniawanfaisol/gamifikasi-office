import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export default function AdminCharts({
    usersByRole,
}: {
    usersByRole: {
        admin: number;
        lecturer: number;
        student: number;
    };
}) {
    const data = [
        { name: 'Admin', count: usersByRole.admin },
        { name: 'Dosen', count: usersByRole.lecturer },
        { name: 'Mahasiswa', count: usersByRole.student },
    ];

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-1 text-sm font-semibold text-gray-900">
                Pengguna per peran
            </h3>
            <p className="mb-4 text-xs text-gray-500">
                Jumlah akun terdaftar
            </p>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-gray-200"
                        />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} width={32} />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                            }}
                        />
                        <Bar
                            dataKey="count"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
