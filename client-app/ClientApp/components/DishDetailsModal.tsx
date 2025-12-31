import React, { useState } from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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

const DishDetailsModal: React.FC<DishDetailsModalProps> = ({ visible, dish, onClose, onAddToCart, onRate, theme }) => {
    const [quantity, setQuantity] = useState(1);

    if (!dish) return null;

    const handleAddToCart = () => {
        onAddToCart(dish, quantity);
        setQuantity(1);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Image source={{ uri: dish.image_url || 'https://via.placeholder.com/400' }} style={styles.image} />
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>

                        <View style={styles.content}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.title, { color: theme.colors.text }]}>{dish.name}</Text>
                                <Text style={[styles.price, { color: theme.colors.success }]}>MT {parseFloat(String(dish.price)).toFixed(2)}</Text>
                            </View>

                            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{dish.description}</Text>

                            <View style={[styles.ratingSection, { backgroundColor: theme.colors.background }]}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Avaliação</Text>
                                <StarRating
                                    rating={dish.average_rating || 0}
                                    onRate={(n) => onRate(dish.id, n)}
                                    size={46}
                                />
                                <Text style={[styles.ratingHint, { color: theme.colors.textSecondary }]}>Toque para avaliar</Text>
                            </View>

                            <View style={styles.actionRow}>
                                <View style={[styles.quantityControl, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                    <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={[styles.qtyBtn, { backgroundColor: theme.colors.secondary }]}>
                                        <Text style={[styles.qtyText, { color: theme.colors.text }]}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.qtyValue, { color: theme.colors.text }]}>{quantity}</Text>
                                    <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={[styles.qtyBtn, { backgroundColor: theme.colors.secondary }]}>
                                        <Text style={[styles.qtyText, { color: theme.colors.text }]}>+</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={handleAddToCart}>
                                    <Text style={styles.addButtonText}>Adicionar - MT {(dish.price * quantity).toFixed(2)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    backdrop: { flex: 1 },
    modalContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '70%', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    scrollContent: { paddingBottom: 40 },
    image: { width: '100%', height: 250, resizeMode: 'cover' },
    closeButton: { position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    closeButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    content: { padding: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '900', flex: 1, marginRight: 10 },
    price: { fontSize: 22, fontWeight: 'bold' },
    description: { fontSize: 16, lineHeight: 24, marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    ratingSection: { alignItems: 'center', marginBottom: 32, padding: 16, borderRadius: 16 },
    ratingHint: { fontSize: 12, marginTop: 8 },
    actionRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    quantityControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 6, borderWidth: 1 },
    qtyBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    qtyText: { fontSize: 20, fontWeight: 'bold' },
    qtyValue: { fontSize: 18, fontWeight: 'bold', width: 40, textAlign: 'center' },
    addButton: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default DishDetailsModal;
