import React, { useState } from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Dish } from '../types';
import StarRating from './StarRating';
import { Theme } from '../themes';

interface DishDetailsModalProps {
    visible: boolean;
    dish: Dish | null;
    onClose: () => void;
    onAddToCart: (dish: Dish, quantity: number) => void;
    onRate: (dishId: number, rating: number) => void;
    theme: Theme;
}

const { width } = Dimensions.get('window');

const DishDetailsModal: React.FC<DishDetailsModalProps> = ({ visible, dish, onClose, onAddToCart, onRate, theme }) => {
    const [quantity, setQuantity] = useState(1);

    if (!dish) return null;

    const handleAddToCart = () => {
        onAddToCart(dish, quantity);
        setQuantity(1);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>

                    {/* Header Image */}
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: dish.image_url || 'https://via.placeholder.com/600' }} style={styles.image} />
                        <View style={styles.imageOverlay} />
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.content}>

                            {/* Title & Price */}
                            <View style={styles.headerRow}>
                                <Text style={[styles.title, { color: theme.colors.text }]}>{dish.name}</Text>
                                <Text style={[styles.price, { color: theme.colors.success }]}>MT {parseFloat(String(dish.price)).toFixed(2)}</Text>
                            </View>

                            {/* Prep Time Badge */}
                            <View style={styles.infoRow}>
                                <View style={[styles.badge, { backgroundColor: theme.colors.secondary }]}>
                                    <Text style={[styles.badgeText, { color: theme.colors.text }]}>⏱️ {dish.preparation_time || 15} min</Text>
                                </View>
                                {dish.calories && (
                                    <View style={[styles.badge, { backgroundColor: theme.colors.secondary }]}>
                                        <Text style={[styles.badgeText, { color: theme.colors.text }]}>🔥 {dish.calories} cal</Text>
                                    </View>
                                )}
                            </View>

                            {/* Description */}
                            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{dish.description}</Text>

                            <View style={styles.divider} />

                            {/* Rating Section */}
                            <View style={styles.ratingSection}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Avaliação</Text>
                                <StarRating
                                    rating={dish.average_rating || 0}
                                    onRate={(n) => onRate(dish.id, n)}
                                    size={40}
                                />
                                <Text style={[styles.ratingHint, { color: theme.colors.textSecondary }]}>Toque nas estrelas para avaliar</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <View style={[styles.quantityControl, { backgroundColor: theme.colors.background }]}>
                            <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                                <Text style={[styles.qtyText, { color: theme.colors.text }]}>-</Text>
                            </TouchableOpacity>
                            <Text style={[styles.qtyValue, { color: theme.colors.text }]}>{quantity}</Text>
                            <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                                <Text style={[styles.qtyText, { color: theme.colors.text }]}>+</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={handleAddToCart}>
                            <Text style={styles.addButtonText}>Adicionar • MT {(dish.price * quantity).toFixed(2)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    modalContainer: { width: width * 0.9, maxWidth: 500, height: '85%', borderRadius: 24, overflow: 'hidden', elevation: 10 },
    imageContainer: { height: 220, width: '100%', position: 'relative' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
    closeButton: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    closeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    scrollContent: { paddingBottom: 20 },
    content: { padding: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 26, fontWeight: '800', flex: 1 },
    price: { fontSize: 22, fontWeight: '700' },
    infoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    badgeText: { fontWeight: '600', fontSize: 14 },
    description: { fontSize: 16, lineHeight: 24, marginBottom: 24 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    ratingSection: { alignItems: 'center' },
    ratingHint: { fontSize: 12, marginTop: 8 },
    footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, gap: 16, alignItems: 'center' },
    quantityControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 4 },
    qtyBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    qtyText: { fontSize: 22, fontWeight: 'bold' },
    qtyValue: { fontSize: 18, fontWeight: 'bold', width: 30, textAlign: 'center' },
    addButton: { flex: 1, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default DishDetailsModal;
