import examPreparationLottie from '@/assets/Exams Preparation..json';
import { useLottie } from 'lottie-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type LottieJson = Record<string, unknown>;

const bundledAnimation = examPreparationLottie as LottieJson;

const lottieContainerStyle: CSSProperties = {
    maxHeight: '260px',
    width: '100%',
    maxWidth: '28rem',
    margin: '0 auto',
};

export default function LottieBanner({
    url,
    className = '',
}: {
    url: string | null;
    className?: string;
}) {
    const [animationData, setAnimationData] =
        useState<LottieJson>(bundledAnimation);
    const [remoteFailed, setRemoteFailed] = useState(false);

    useEffect(() => {
        if (!url || url.trim() === '') {
            setAnimationData(bundledAnimation);
            setRemoteFailed(false);
            return;
        }

        let cancelled = false;
        setRemoteFailed(false);

        fetch(url, { mode: 'cors' })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to load');
                }
                return res.json();
            })
            .then((json: LottieJson) => {
                if (!cancelled) {
                    setAnimationData(json);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setRemoteFailed(true);
                    setAnimationData(bundledAnimation);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [url]);

    const lottieOptions = useMemo(
        () => ({
            animationData,
            loop: true,
        }),
        [animationData],
    );

    const { View } = useLottie(lottieOptions, lottieContainerStyle);

    return (
        <div
            className={`overflow-hidden rounded-2xl border border-teal-200/60 bg-white shadow-sm ${className}`}
        >
            {remoteFailed && url ? (
                <p className="px-3 pt-2 text-center text-[10px] text-amber-700">
                    Animasi dari URL gagal dimuat; memakai animasi bawaan.
                </p>
            ) : null}
            {View}
        </div>
    );
}
