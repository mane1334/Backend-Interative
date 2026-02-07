import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface WaiterCallModalProps {
    visible: boolean;
    onClose: () => void;
    onCall: (reason: string) => void;
}

const WaiterCallModal: React.FC<WaiterCallModalProps> = ({ visible, onClose, onCall }) => {
    const options = [
        { label: '💳 Pedir a Conta', icon: '💳', value: 'billing' },
        { label: '🧹 Limpeza / Guardanapos', icon: '🧹', value: 'cleaning' },
        { label: '❓ Dúvida no Menu', icon: '❓', value: 'question' },
        { label: '👋 Outros', icon: '👋', value: 'other' },
    ];

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.container}>
                    <Text style={styles.title}>Como podemos ajudar?</Text>
                    <View style={styles.grid}>
                        {options.map((opt) => (
                            <TouchableOpacity key={opt.value} style={styles.card} onPress={() => onCall(opt.label)}>
                                <Text style={styles.icon}>{opt.icon}</Text>
                                <Text style={styles.label}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    container: { width: '85%', maxWidth: 500, backgroundColor: '#1e293b', borderRadius: 20, padding: 24, alignItems: 'center' },
    title: { fontSize: 22, color: '#f8fafc', fontWeight: 'bold', marginBottom: 24 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
    card: { width: 140, height: 120, backgroundColor: '#334155', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 5 },
    icon: { fontSize: 32 },
    label: { color: '#f8fafc', fontWeight: '600', textAlign: 'center' },
    cancelButton: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 32 },
    cancelText: { color: '#94a3b8', fontSize: 16 },
});

export default WaiterCallModal;
