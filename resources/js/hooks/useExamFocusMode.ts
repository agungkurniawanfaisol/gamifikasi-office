import axios from 'axios';
import { useCallback, useEffect, useRef } from 'react';

/** Matches App\Enums\FocusViolationType values */
export type FocusViolationTypeString =
    | 'tab_switch'
    | 'window_blur'
    | 'visibility_hidden'
    | 'copy_attempt';

function getCsrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

async function postFocusEvent(
    examSessionId: number,
    eventType: FocusViolationTypeString,
    metadata?: Record<string, string>,
): Promise<void> {
    try {
        await axios.post(
            route('student.exams.focus-events.store', examSessionId),
            {
                event_type: eventType,
                metadata: metadata ?? undefined,
            },
            {
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            },
        );
    } catch {
        /* network errors must not block the exam UI */
    }
}

/**
 * Records focus / anti-cheat events during an in-progress exam session.
 */
export function useExamFocusMode(
    examSessionId: number,
    enabled: boolean,
): {
    requestFullscreen: () => void;
    exitFullscreen: () => void;
} {
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastBlurAt = useRef(0);
    const lastCopyAt = useRef(0);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const onVisibility = (): void => {
            if (document.visibilityState === 'hidden') {
                void postFocusEvent(examSessionId, 'visibility_hidden', {
                    visibility_state: document.visibilityState,
                });
            }
        };

        const onBlur = (): void => {
            if (blurTimer.current) {
                clearTimeout(blurTimer.current);
            }
            blurTimer.current = setTimeout(() => {
                const now = Date.now();
                if (now - lastBlurAt.current < 1200) {
                    return;
                }
                lastBlurAt.current = now;
                void postFocusEvent(examSessionId, 'window_blur', {
                    visibility_state: document.visibilityState,
                });
            }, 600);
        };

        const onCopy = (e: ClipboardEvent): void => {
            const now = Date.now();
            if (now - lastCopyAt.current < 2000) {
                return;
            }
            lastCopyAt.current = now;
            void postFocusEvent(examSessionId, 'copy_attempt', {
                type: e.type,
            });
        };

        const onBeforeUnload = (e: BeforeUnloadEvent): void => {
            e.preventDefault();
            e.returnValue = '';
        };

        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('blur', onBlur);
        document.addEventListener('copy', onCopy);
        document.addEventListener('cut', onCopy);
        window.addEventListener('beforeunload', onBeforeUnload);

        return () => {
            if (blurTimer.current) {
                clearTimeout(blurTimer.current);
            }
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('copy', onCopy);
            document.removeEventListener('cut', onCopy);
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [enabled, examSessionId]);

    const requestFullscreen = useCallback(() => {
        const el = document.documentElement;
        if (el.requestFullscreen) {
            void el.requestFullscreen().catch(() => {});
        }
    }, []);

    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement && document.exitFullscreen) {
            void document.exitFullscreen().catch(() => {});
        }
    }, []);

    return { requestFullscreen, exitFullscreen };
}
