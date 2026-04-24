type StepStatus = 'completed' | 'active' | 'locked';

type StepItem = {
    title: string;
    description: string;
    status: StepStatus;
};

type Props = {
    answeredCount: number;
    minRequired: number;
    maxAllowed: number;
    isCompleted: boolean;
    onStepClick?: (stepIndex: number) => void;
};

function statusClasses(status: StepStatus): string {
    if (status === 'completed') {
        return 'border-emerald-300 bg-emerald-100 text-emerald-700';
    }

    if (status === 'active') {
        return 'border-teal-300 bg-teal-100 text-teal-700';
    }

    return 'border-gray-200 bg-gray-100 text-gray-500';
}

export default function ActivityStepper({
    answeredCount,
    minRequired,
    maxAllowed,
    isCompleted,
    onStepClick,
}: Props) {
    const minimumReached = answeredCount >= minRequired;
    const answeredReachedCap = answeredCount >= maxAllowed;

    const steps: StepItem[] = [
        {
            title: 'Start Mission',
            description: 'Start your daily activity.',
            status: answeredCount > 0 || isCompleted ? 'completed' : 'active',
        },
        {
            title: 'Answer Questions',
            description: `${answeredCount}/${maxAllowed} questions answered.`,
            status: minimumReached || isCompleted ? 'completed' : 'active',
        },
        {
            title: 'Review Progress',
            description: minimumReached
                ? 'Minimum reached, ready to finalize.'
                : `Butuh ${Math.max(0, minRequired - answeredCount)} more questions needed.`,
            status: isCompleted
                ? 'completed'
                : minimumReached
                  ? 'active'
                  : 'locked',
        },
        {
            title: 'Complete & Claim',
            description: isCompleted
                ? 'Mission completed today.'
                : answeredReachedCap
                  ? 'Daily limit reached.'
                  : 'Finalize to complete the mission.',
            status: isCompleted ? 'completed' : minimumReached ? 'active' : 'locked',
        },
    ];

    return (
        <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mission Stepper
            </p>

            <div className="mt-3 hidden items-start gap-2 md:flex">
                {steps.map((step, idx) => (
                    <div key={step.title} className="flex min-w-0 flex-1 items-start">
                        <button
                            type="button"
                            onClick={() => onStepClick?.(idx)}
                            className="min-w-0 text-left"
                        >
                            <div
                                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-extrabold ${statusClasses(step.status)}`}
                            >
                                {step.status === 'completed' ? '✓' : idx + 1}
                            </div>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                {step.title}
                            </p>
                            <p className="text-xs text-slate-500">
                                {step.description}
                            </p>
                        </button>
                        {idx < steps.length - 1 ? (
                            <div className="mx-2 mt-4 h-0.5 flex-1 rounded-full bg-slate-200" />
                        ) : null}
                    </div>
                ))}
            </div>

            <div className="mt-2 space-y-3 md:hidden">
                {steps.map((step, idx) => (
                    <button
                        key={step.title}
                        type="button"
                        onClick={() => onStepClick?.(idx)}
                        className="flex w-full items-start gap-3 text-left"
                    >
                        <div
                            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${statusClasses(step.status)}`}
                        >
                            {step.status === 'completed' ? '✓' : idx + 1}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                {step.title}
                            </p>
                            <p className="text-xs text-slate-500">
                                {step.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
