import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';

interface UseInactivityLockProps {
    timeoutMinutes: number;
    enabled?: boolean;
    onLock?: () => void;
}

interface UseInactivityLockReturn {
    isLocked: boolean;
    unlock: () => void;
    registerInteraction: () => void;
}

export const useInactivityLock = ({
    timeoutMinutes,
    enabled = true,
    onLock,
}: UseInactivityLockProps): UseInactivityLockReturn => {
    const [isLocked, setIsLocked] = useState(false);
    const lastInteractionRef = useRef(Date.now());

    const registerInteraction = useCallback(() => {
        lastInteractionRef.current = Date.now();
    }, []);

    const unlock = useCallback(() => {
        setIsLocked(false);
        registerInteraction();
    }, [registerInteraction]);

    useEffect(() => {
        if (!enabled || timeoutMinutes <= 0) return;

        const check = setInterval(() => {
            const elapsedMs = Date.now() - lastInteractionRef.current;
            const timeoutMs = timeoutMinutes * 60 * 1000;

            if (elapsedMs > timeoutMs && !isLocked) {
                setIsLocked(true);
                onLock?.();
            }
        }, 1000);

        return () => clearInterval(check);
    }, [timeoutMinutes, enabled, isLocked, onLock]);

    // Reset interaction on app becoming active
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                registerInteraction();
            }
        });

        return () => subscription.remove();
    }, [registerInteraction]);

    return {
        isLocked,
        unlock,
        registerInteraction,
    };
};

export default useInactivityLock;
