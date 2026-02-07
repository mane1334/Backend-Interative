import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    onHide: () => void;
}

const { width } = Dimensions.get('window');

const Toast: React.FC<ToastProps> = ({ visible, message, type = 'info', onHide }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-50)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 20, // Final position from top
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                hide();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            hide();
        }
    }, [visible]);

    const hide = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -50,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (visible) onHide();
        });
    };

    if (!visible) return null;

    const bgColors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }], backgroundColor: bgColors[type] }]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 10,
        maxWidth: width * 0.8,
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default Toast;
