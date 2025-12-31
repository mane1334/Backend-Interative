import React, { useEffect, useState, useRef } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { API_URL } from '../config';

const audioRecorderPlayer = new (AudioRecorderPlayer as any)();

interface ChatModalProps {
    visible: boolean;
    onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ visible, onClose }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: string; content: string; audio_url?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const requestAudioPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Permissão de Gravação de Áudio',
                        message: 'Este aplicativo precisa de acesso ao seu microfone para gravação de voz.',
                        buttonNeutral: 'Perguntar Depois',
                        buttonNegative: 'Cancelar',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const playResponse = async (url: string) => {
        try {
            const fullUrl = url.startsWith('http') ? url : `${API_URL.replace('/api', '')}${url}`;
            console.log('Reproduzindo áudio:', fullUrl);
            await audioRecorderPlayer.startPlayer(fullUrl);
            audioRecorderPlayer.addPlayBackListener((e: any) => {
                if (e.currentPosition === e.duration) {
                    audioRecorderPlayer.stopPlayer();
                }
            });
        } catch (err) {
            console.error('Erro ao reproduzir áudio:', err);
        }
    };

    const onStartRecord = async () => {
        const hasPermission = await requestAudioPermission();
        if (!hasPermission) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Permissão de microfone negada.' }]);
            return;
        }

        try {
            const path = Platform.select({
                ios: 'hello.m4a',
                android: 'sdcard/hello.mp4',
            });
            const uri = await audioRecorderPlayer.startRecorder(path!);
            setIsRecording(true);
            console.log(`started recording at: ${uri}`);
        } catch (err) {
            console.error('Erro ao iniciar gravação:', err);
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Erro ao iniciar gravação.' }]);
        }
    };

    const onStopRecord = async () => {
        try {
            const result = await audioRecorderPlayer.stopRecorder();
            setIsRecording(false);

            const formData = new FormData();
            const fileUri = Platform.OS === 'android' ? `file://${result}` : result;
            formData.append('audio', {
                uri: fileUri,
                type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
                name: Platform.OS === 'ios' ? 'audio.m4a' : 'audio.mp4',
            } as any);

            setIsLoading(true);
            const response = await fetch(`${API_URL}/chat/voice`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setChatHistory(prev => [...prev, { role: 'user', content: data.transcription || 'Áudio enviado.' }]);
            if (data.reply) {
                setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, audio_url: data.audio_url }]);
                if (data.audio_url) playResponse(data.audio_url);
            }
        } catch (err) {
            console.error('Erro ao parar gravação ou enviar áudio:', err);
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Erro ao processar áudio.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        const userMessage = { role: 'user', content: message };
        setChatHistory(prev => [...prev, userMessage]);
        const currentMsg = message;
        setMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: currentMsg }),
            });
            const data = await response.json();
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply, audio_url: data.audio_url }]);
            if (data.audio_url) playResponse(data.audio_url);
        } catch (error) {
            console.error('Erro no chat:', error);
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Desculpe, estou com problemas. Tente novamente.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [chatHistory]);

    return (
        <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle}>Gêmeos AI</Text>
                    <TouchableOpacity onPress={() => {
                        audioRecorderPlayer.stopPlayer();
                        onClose();
                    }}>
                        <Text style={styles.closeButton}>Voltar</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView ref={scrollViewRef} style={styles.chatHistory} contentContainerStyle={{ paddingBottom: 20 }}>
                    {chatHistory.map((msg, index) => (
                        <View key={index} style={msg.role === 'user' ? styles.userMessage : styles.aiMessage}>
                            <Text style={styles.messageText}>{msg.content}</Text>
                            {msg.audio_url && (
                                <TouchableOpacity onPress={() => playResponse(msg.audio_url!)} style={styles.playButtonMini}>
                                    <Text style={styles.playButtonTextMini}>▶ Ouvir</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    {isLoading && (
                        <View style={styles.aiMessage}>
                            <ActivityIndicator size="small" color="#94a3b8" />
                        </View>
                    )}
                </ScrollView>
                <View style={styles.chatInputContainer}>
                    <TouchableOpacity
                        style={[styles.recordButton, isRecording && { backgroundColor: '#ef4444' }]}
                        onPressIn={onStartRecord}
                        onPressOut={onStopRecord}
                    >
                        <Text style={styles.sendButtonText}>{isRecording ? 'Gravando...' : '🎤'}</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.chatInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Pergunte algo..."
                        placeholderTextColor="#94a3b8"
                        onSubmitEditing={handleSend}
                        editable={!isRecording}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isRecording || !message.trim()}>
                        <Text style={styles.sendButtonText}>➤</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: '#020617' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderColor: '#1e293b', backgroundColor: '#0f172a' },
    chatTitle: { fontSize: 24, fontWeight: '900', color: '#f8fafc' },
    closeButton: { fontSize: 16, color: '#2563eb', fontWeight: '800' },
    chatHistory: { flex: 1, padding: 20 },
    userMessage: { alignSelf: 'flex-end', backgroundColor: '#2563eb', borderRadius: 22, borderBottomRightRadius: 4, padding: 16, marginBottom: 16, maxWidth: '80%', shadowColor: '#2563eb', shadowOpacity: 0.2, shadowRadius: 10 },
    aiMessage: { alignSelf: 'flex-start', backgroundColor: '#1e293b', borderRadius: 22, borderBottomLeftRadius: 4, padding: 16, marginBottom: 16, maxWidth: '80%', borderWidth: 1, borderColor: '#334155' },
    messageText: { color: '#f8fafc', fontSize: 16, lineHeight: 24 },
    playButtonMini: { marginTop: 8, backgroundColor: '#334155', padding: 6, borderRadius: 8, alignSelf: 'flex-start' },
    playButtonTextMini: { color: '#fff', fontSize: 12 },
    chatInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#1e293b', backgroundColor: '#0f172a' },
    recordButton: { marginRight: 10, padding: 12, borderRadius: 50, backgroundColor: '#334155' },
    chatInput: { flex: 1, backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#f8fafc', fontSize: 16, marginRight: 10 },
    sendButton: { padding: 12, backgroundColor: '#2563eb', borderRadius: 50 },
    sendButtonText: { color: '#fff', fontSize: 16 },
});

export default ChatModal;
