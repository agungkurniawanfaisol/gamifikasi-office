export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role?: 'admin' | 'lecturer' | 'student';
    is_active?: boolean;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
};

export type DashboardStudentAnalytics = {
    completedCount: number;
    inProgressCount: number;
    averageScorePercent: number | null;
    recentScores: Array<{
        date: string | null;
        label: string;
        scorePercent: number;
        levelName: string;
    }>;
    scoresByLevel: Array<{ name: string; avgPercent: number }>;
};

export type DashboardLecturerAnalytics = {
    totalQuestions: number;
    activeQuestions: number;
    questionsBySkill: Array<{ name: string; count: number }>;
};

export type DashboardAdminAnalytics = {
    totalUsers: number;
    usersByRole: {
        admin: number;
        lecturer: number;
        student: number;
    };
    completedExamSessions: number;
};

export type DashboardPageProps = PageProps<{
    role: 'admin' | 'lecturer' | 'student';
    lottieUrl: string | null;
    student?: DashboardStudentAnalytics;
    lecturer?: DashboardLecturerAnalytics;
    admin?: DashboardAdminAnalytics;
}>;
