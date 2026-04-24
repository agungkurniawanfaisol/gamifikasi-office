import axios from 'axios';
import { useEffect, useRef } from 'react';

type AuditEventPayload = {
    event_type: 'ui_click' | 'navigation';
    event_key: string;
    page_url?: string;
    menu_key?: string;
    element_key?: string;
    click_x?: number;
    click_y?: number;
    metadata?: Record<string, string | number | boolean | null>;
    occurred_at?: string;
};

const DEDUP_MS = 500;

function getCsrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

function buildElementKey(target: Element): string {
    const node = target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    const id = node.id ? `#${node.id}` : '';
    const name = node.getAttribute('name');
    const role = node.getAttribute('role');
    const dataAudit = node.getAttribute('data-audit');

    return `${tag}${id}${name ? `[name=${name}]` : ''}${role ? `[role=${role}]` : ''}${dataAudit ? `[audit=${dataAudit}]` : ''}`;
}

async function postAuditEvent(payload: AuditEventPayload): Promise<void> {
    try {
        await axios.post(route('audit-trails.events.store'), payload, {
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    } catch {
        // Audit trail must never block user interactions.
    }
}

export function useAuditTrailTracker(enabled: boolean): void {
    const lastSignatureRef = useRef('');
    const lastEventAtRef = useRef(0);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const onClick = (event: MouseEvent): void => {
            const target = event.target instanceof Element ? event.target : null;
            if (!target) {
                return;
            }

            const clickable = target.closest('a,button,input,select,textarea');
            if (!clickable) {
                return;
            }

            const now = Date.now();
            const href =
                clickable instanceof HTMLAnchorElement
                    ? clickable.href
                    : undefined;
            const menuKey = clickable.getAttribute('data-menu-key') ?? undefined;
            const elementKey = buildElementKey(clickable);
            const signature = `${menuKey ?? ''}|${elementKey}|${href ?? ''}`;

            if (
                signature === lastSignatureRef.current &&
                now - lastEventAtRef.current < DEDUP_MS
            ) {
                return;
            }

            lastSignatureRef.current = signature;
            lastEventAtRef.current = now;

            void postAuditEvent({
                event_type: 'ui_click',
                event_key: menuKey ? 'menu.click' : 'ui.click',
                page_url: window.location.href,
                menu_key: menuKey,
                element_key: elementKey,
                click_x: Math.max(0, Math.floor(event.clientX)),
                click_y: Math.max(0, Math.floor(event.clientY)),
                metadata: {
                    href: href ?? null,
                    path: window.location.pathname,
                },
                occurred_at: new Date().toISOString(),
            });

            if (href) {
                void postAuditEvent({
                    event_type: 'navigation',
                    event_key: 'navigation.visit',
                    page_url: href,
                    menu_key: menuKey,
                    element_key: elementKey,
                    metadata: {
                        from_url: window.location.href,
                        to_url: href,
                    },
                    occurred_at: new Date().toISOString(),
                });
            }
        };

        document.addEventListener('click', onClick, true);

        return () => {
            document.removeEventListener('click', onClick, true);
        };
    }, [enabled]);
}
