import examPreparationLottie from '@/assets/Exams Preparation..json';
import { useLottie } from 'lottie-react';

type Props = {
    weeklyRewardPoints: number;
};

export default function RewardCelebration({ weeklyRewardPoints }: Props) {
    const { View } = useLottie(
        {
            animationData: examPreparationLottie,
            loop: false,
        },
        {
            width: '100%',
            maxWidth: '360px',
            margin: '0 auto',
        },
    );

    return (
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-100 via-cyan-100 to-indigo-100 p-4 shadow-lg shadow-emerald-100">
            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/50 blur-2xl" />
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Weekly Reward Unlocked
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
                Weekly badge unlocked
            </p>
            <p className="mt-1 text-sm text-emerald-800">
                Additional {weeklyRewardPoints} points have been added to your account.
            </p>
            <div className="mt-3">{View}</div>
        </div>
    );
}
