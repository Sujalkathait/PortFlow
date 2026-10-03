import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State for a message that auto-clears after a timeout.
 * Use for success/error alerts that shouldn't persist indefinitely.
 */
export function useAutoDismiss(ms = 6000) {
    const [message, setMessage] = useState('');
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const show = useCallback((text: string) => {
        clearTimeout(timer.current);
        setMessage(text);
        if (text) {
            timer.current = setTimeout(() => setMessage(''), ms);
        }
    }, [ms]);

    const clear = useCallback(() => {
        clearTimeout(timer.current);
        setMessage('');
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return [message, show, clear] as const;
}
