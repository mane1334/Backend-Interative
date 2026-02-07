import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { Order, CartItem } from '../types';

interface UseOrderProps {
    apiUrl: string;
    tableNumber: string;
    onOrderSent?: () => void;
}

interface UseOrderReturn {
    currentOrder: Order | null;
    isSendingOrder: boolean;
    sendOrder: (cart: CartItem[]) => Promise<boolean>;
    cancelOrder: () => Promise<void>;
    setCurrentOrder: (order: Order | null) => void;
}

export const useOrder = ({ apiUrl, tableNumber, onOrderSent }: UseOrderProps): UseOrderReturn => {
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isSendingOrder, setIsSendingOrder] = useState(false);

    const sendOrder = useCallback(async (cart: CartItem[]): Promise<boolean> => {
        if (cart.length === 0) return false;

        setIsSendingOrder(true);
        try {
            const items = cart.map(item => ({
                dish_id: item.id,
                quantity: item.quantity,
            }));

            const response = await fetch(`${apiUrl}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table_number: parseInt(tableNumber),
                    items,
                }),
            });

            if (!response.ok) throw new Error('Erro ao enviar pedido');

            const data = await response.json();
            setCurrentOrder({
                id: data.order_id,
                prepSeconds: Number(data.prep_time_seconds) || 0,
                cancelUntil: data.cancel_until,
            });

            onOrderSent?.();
            return true;
        } catch (err) {
            Alert.alert('Erro', 'Não foi possível enviar o pedido.');
            return false;
        } finally {
            setIsSendingOrder(false);
        }
    }, [apiUrl, tableNumber, onOrderSent]);

    const cancelOrder = useCallback(async () => {
        if (!currentOrder) return;

        try {
            await fetch(`${apiUrl}/orders/${currentOrder.id}/cancel`, {
                method: 'POST',
            });
            setCurrentOrder(null);
        } catch (e) {
            Alert.alert('Erro', 'Falha ao cancelar.');
        }
    }, [apiUrl, currentOrder]);

    return {
        currentOrder,
        isSendingOrder,
        sendOrder,
        cancelOrder,
        setCurrentOrder,
    };
};

export default useOrder;
