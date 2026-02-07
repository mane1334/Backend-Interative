import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Order } from '../types';
import { Theme } from '../themes';

interface OrderStatusBarProps {
    currentOrder: Order | null;
    onCancel: () => void;
    theme: Theme;
}

const OrderStatusBar: React.FC<OrderStatusBarProps> = ({ currentOrder, onCancel, theme }) => {
    const [remainingPrep, setRemainingPrep] = useState<number | null>(null);
    const [remainingCancelMs, setRemainingCancelMs] = useState<number>(0);

    useEffect(() => {
        if (currentOrder) {
            setRemainingPrep(currentOrder.prepSeconds);
        } else {
            setRemainingPrep(null);
        }
    }, [currentOrder?.prepSeconds]);

    useEffect(() => {
        let prepInterval: any;
        if (currentOrder && typeof remainingPrep === 'number') {
            prepInterval = setInterval(() => {
                setRemainingPrep(prev => (prev != null ? Math.max(0, prev - 1) : prev));
            }, 1000);
        }
        return () => { if (prepInterval) clearInterval(prepInterval); };
    }, [currentOrder, remainingPrep]);

    useEffect(() => {
        let cancelInterval: any;
        if (currentOrder?.cancelUntil) {
            cancelInterval = setInterval(() => {
                const diff = new Date(currentOrder.cancelUntil!).getTime() - Date.now();
                setRemainingCancelMs(Math.max(0, diff));
            }, 500);
        } else {
            setRemainingCancelMs(0);
        }
        return () => { if (cancelInterval) clearInterval(cancelInterval); };
    }, [currentOrder?.cancelUntil]);

    if (!currentOrder) return null;

    return (
        <View style={[
            styles.orderBar,
            {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.text // Shadow based on text color? No, black usually better.
            }
        ]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.orderBarTitle, { color: theme.colors.text }]}>Pedido em preparo</Text>
                <Text style={[styles.orderBarText, { color: theme.colors.textSecondary }]}>Estimativa: {Math.ceil((remainingPrep ?? 0) / 60)} min</Text>
            </View>
            <TouchableOpacity
                disabled={remainingCancelMs <= 0}
                onPress={onCancel}
                style={[styles.cancelButton, { backgroundColor: theme.colors.error }, remainingCancelMs <= 0 && { opacity: 0.5 }]}
            >
                <Text style={styles.cancelButtonText}>Cancelar ({Math.ceil(remainingCancelMs / 1000)}s)</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    orderBar: { position: 'absolute', bottom: 90, left: 20, right: 20, borderWidth: 1, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
    orderBarTitle: { fontWeight: 'bold', fontSize: 15 },
    orderBarText: { fontSize: 13, marginTop: 2 },
    cancelButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
    cancelButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

export default OrderStatusBar;
