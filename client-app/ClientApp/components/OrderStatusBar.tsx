import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Order } from '../types';

interface OrderStatusBarProps {
    currentOrder: Order | null;
    onCancel: () => void;
}

const OrderStatusBar: React.FC<OrderStatusBarProps> = ({ currentOrder, onCancel }) => {
    const [remainingPrep, setRemainingPrep] = useState<number | null>(null);
    const [remainingCancelMs, setRemainingCancelMs] = useState<number>(0);

    useEffect(() => {
        if (currentOrder) {
            setRemainingPrep(currentOrder.prepSeconds);
        } else {
            setRemainingPrep(null);
        }
    }, [currentOrder?.prepSeconds]); // Watch prepSeconds changes from prop

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
        <View style={styles.orderBar}>
            <View style={{ flex: 1 }}>
                <Text style={styles.orderBarTitle}>Pedido em preparo</Text>
                <Text style={styles.orderBarText}>Estimativa: {Math.ceil((remainingPrep ?? 0) / 60)} min</Text>
            </View>
            <TouchableOpacity
                disabled={remainingCancelMs <= 0}
                onPress={onCancel}
                style={[styles.cancelButton, remainingCancelMs <= 0 && { opacity: 0.5 }]}
            >
                <Text style={styles.cancelButtonText}>Cancelar ({Math.ceil(remainingCancelMs / 1000)}s)</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    orderBar: { position: 'absolute', bottom: 90, left: 20, right: 20, backgroundColor: 'rgba(30, 41, 59, 0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, elevation: 12 },
    orderBarTitle: { color: '#f8fafc', fontWeight: 'bold', fontSize: 15 },
    orderBarText: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
    cancelButton: { backgroundColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
    cancelButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});

export default OrderStatusBar;
