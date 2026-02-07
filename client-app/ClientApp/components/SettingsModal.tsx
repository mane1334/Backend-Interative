import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Alert, NativeModules } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (ip: string, table: string, theme: string, language: string) => void;
    initialIp: string;
    initialTable: string;
    currentTheme: string;
    currentLanguage: string;
}

import { themes } from '../themes';

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onSave, initialIp, initialTable, currentTheme, currentLanguage }) => {
    const [tempIp, setTempIp] = useState(initialIp);
    const [tempTable, setTempTable] = useState(initialTable);
    const [selectedTheme, setSelectedTheme] = useState(currentTheme);
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState('');

    useEffect(() => {
        if (visible) {
            setTempIp(initialIp);
            setTempTable(initialTable);
            setSelectedTheme(currentTheme);
        }
    }, [visible, initialIp, initialTable, currentTheme]);

    const scanNetwork = async () => {
        setIsScanning(true);
        setScanProgress('Iniciando busca...');
        try {
            const state = await NetInfo.fetch();
            if (!state.isConnected || !state.details || !('ipAddress' in state.details)) {
                throw new Error('Sem conexão Wi-Fi ativa.');
            }

            const ip = (state.details as any).ipAddress;
            const subnet = ip.substring(0, ip.lastIndexOf('.'));
            setScanProgress(`Escaneando ${subnet}.x ...`);

            const checkIp = async (i: number) => {
                const target = `${subnet}.${i}`;
                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 500);

                    const response = await fetch(`http://${target}:3000/api/health`, {
                        signal: controller.signal
                    });
                    clearTimeout(id);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.status === 'healthy' || data.status === 'degraded') {
                            return target;
                        }
                    }
                } catch (e) { }
                return null;
            };

            for (let block = 1; block <= 255; block += 25) {
                setScanProgress(`Buscando em ${subnet}.${block}-${Math.min(255, block + 24)}...`);
                const promises = [];
                for (let i = block; i < block + 25 && i <= 255; i++) {
                    promises.push(checkIp(i));
                }
                const results = await Promise.all(promises);
                const found = results.find(r => r !== null);
                if (found) {
                    setTempIp(found);
                    setScanProgress('Servidor encontrado!');
                    setTimeout(() => {
                        setIsScanning(false);
                        setScanProgress('');
                    }, 1000);
                    return;
                }
            }
            setScanProgress('Servidor não encontrado na rede.');
        } catch (err: any) {
            Alert.alert('Erro no Scan', err.message || 'Falha ao buscar rede.');
        } finally {
            setTimeout(() => {
                setIsScanning(false);
                setScanProgress('');
            }, 2000);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.lockOverlay}>
                <View style={styles.container}>
                    <Text style={styles.title}>Configurações</Text>

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>IP do Servidor:</Text>
                            <TouchableOpacity
                                onPress={scanNetwork}
                                disabled={isScanning}
                                style={styles.scanButton}
                            >
                                <Text style={styles.scanButtonText}>{isScanning ? '🔍 Buscando...' : '📡 Auto-Scan'}</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={tempIp}
                            onChangeText={setTempIp}
                            placeholder="Ex: 192.168.1.10"
                            placeholderTextColor="#94a3b8"
                            autoCorrect={false}
                            autoCapitalize="none"
                            selectTextOnFocus={true}
                        />
                        {scanProgress !== '' && (
                            <Text style={styles.progressText}>{scanProgress}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Número da Mesa:</Text>
                        <TextInput
                            style={styles.input}
                            value={tempTable}
                            onChangeText={setTempTable}
                            keyboardType="numeric"
                            selectTextOnFocus={true}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Tema:</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {Object.entries(themes).map(([key, theme]) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[
                                        styles.themeButton,
                                        { backgroundColor: theme.colors.primary },
                                        selectedTheme === key && styles.themeButtonSelected
                                    ]}
                                    onPress={() => setSelectedTheme(key)}
                                >
                                    <Text style={[styles.themeButtonText, selectedTheme === key && { color: '#fff' }]}>{theme.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Idioma / Language:</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {['pt', 'en'].map((lang) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={[
                                        styles.themeButton,
                                        { backgroundColor: '#475569' },
                                        selectedLanguage === lang && styles.themeButtonSelected
                                    ]}
                                    onPress={() => setSelectedLanguage(lang)}
                                >
                                    <Text style={[styles.themeButtonText, selectedLanguage === lang && { color: '#fff' }]}>{lang === 'pt' ? '🇵🇹 Português' : '🇺🇸 English'}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => onSave(tempIp.trim(), tempTable.trim(), selectedTheme, selectedLanguage)}
                    >
                        <Text style={styles.saveButtonText}>Salvar e Conectar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.cancelButton, { marginTop: 20 }]}
                        onPress={() => {
                            Alert.alert(
                                'Sair do Modo Kiosk',
                                'Tem certeza que deseja sair do aplicativo?',
                                [
                                    { text: 'Cancelar', style: 'cancel' },
                                    {
                                        text: 'Sair e Destravar',
                                        style: 'destructive',
                                        onPress: () => NativeModules.KioskModule?.exitApp()
                                    }
                                ]
                            );
                        }}
                    >
                        <Text style={[styles.cancelButtonText, { color: '#ef4444' }]}>Sair do App (Admin)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Fechar Configurações</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(2, 6, 23, 0.98)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 },
    container: { width: '90%', padding: 24, paddingVertical: 32, backgroundColor: '#1e293b', borderRadius: 24, borderWidth: 1, borderColor: '#334155' },
    title: { marginBottom: 24, fontSize: 22, color: '#fff', fontWeight: 'bold' },
    inputGroup: { width: '100%', marginBottom: 20 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { color: '#f8fafc', fontWeight: 'bold', fontSize: 15, marginBottom: 8 },
    input: { backgroundColor: '#334155', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#f8fafc', fontSize: 16, borderWidth: 1, borderColor: '#475569' },
    scanButton: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    scanButtonText: { color: '#60a5fa', fontSize: 12, fontWeight: 'bold' },
    progressText: { color: '#94a3b8', fontSize: 10, marginTop: 4, textAlign: 'center' },
    saveButton: { width: '100%', backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    cancelButton: { alignItems: 'center' },
    cancelButtonText: { color: '#94a3b8', fontSize: 16 },
    themeButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, opacity: 0.7 },
    themeButtonSelected: { opacity: 1, borderWidth: 2, borderColor: '#fff' },
    themeButtonText: { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' },
});

export default SettingsModal;
