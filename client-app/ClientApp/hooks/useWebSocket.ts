import { useEffect, useRef, useCallback } from 'react';

interface UseWebSocketProps {
    wsUrl: string;
    enabled?: boolean;
    onMessage?: (data: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
    send: (data: any) => void;
    isConnected: boolean;
}

export const useWebSocket = ({
    wsUrl,
    enabled = true,
    onMessage,
    onOpen,
    onClose,
    onError,
}: UseWebSocketProps): UseWebSocketReturn => {
    const wsRef = useRef<WebSocket | null>(null);
    const isConnectedRef = useRef(false);

    const send = useCallback((data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, []);

    useEffect(() => {
        if (!enabled || !wsUrl) return;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            isConnectedRef.current = true;
            console.log('WebSocket conectado');
            onOpen?.();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch (e) {
                console.error('Erro ao processar mensagem WebSocket:', e);
            }
        };

        ws.onerror = (error) => {
            console.error('Erro WebSocket:', error);
            onError?.(error);
        };

        ws.onclose = () => {
            isConnectedRef.current = false;
            console.log('WebSocket desconectado');
            onClose?.();
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [wsUrl, enabled, onMessage, onOpen, onClose, onError]);

    return {
        send,
        isConnected: isConnectedRef.current,
    };
};

export default useWebSocket;
