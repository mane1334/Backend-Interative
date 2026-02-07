import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SharedElement } from 'react-navigation-shared-element';
import StarRating from '../components/StarRating';
import { Dish } from '../types';
import { Theme } from '../themes';
import { resolveImageUrl } from '../utils/urlUtils';

interface DishDetailsScreenProps {
    route: any;
    navigation: any;
    onAddToCart: (dish: Dish, quantity: number) => void;
    onRate: (dishId: number, rating: number) => void;
    theme: Theme;
}

const { width } = Dimensions.get('window');

const DishDetailsScreen: React.FC<DishDetailsScreenProps> = ({ route, navigation, onAddToCart, onRate, theme }) => {
    const { dish } = route.params;
    const [quantity, setQuantity] = useState(1);

    if (!dish) return null;

    const handleAddToCart = () => {
        onAddToCart(dish, quantity);
        setQuantity(1);
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.imageContainer}>
                <SharedElement id={`item.${dish.id}.photo`}>
                    <Image source={{ uri: resolveImageUrl(dish.image_url) }} style={styles.image} />
                </SharedElement>
                <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>{dish.name}</Text>
                        <Text style={[styles.price, { color: theme.colors.success }]}>MT {parseFloat(String(dish.price)).toFixed(2)}</Text>
                    </View>

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

                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{dish.description}</Text>

                    <View style={styles.divider} />

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
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    imageContainer: { height: 350, width: '100%', position: 'relative' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    closeButton: { position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    closeButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    scrollContent: { paddingBottom: 100 },
    content: { padding: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 32, fontWeight: '800', flex: 1 },
    price: { fontSize: 24, fontWeight: '700' },
    infoRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    badgeText: { fontWeight: '600', fontSize: 14 },
    description: { fontSize: 18, lineHeight: 28, marginBottom: 24 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 24 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    ratingSection: { alignItems: 'center' },
    ratingHint: { fontSize: 14, marginTop: 8 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, borderTopWidth: 1, gap: 16, alignItems: 'center' },
    quantityControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 4 },
    qtyBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
    qtyText: { fontSize: 24, fontWeight: 'bold' },
    qtyValue: { fontSize: 20, fontWeight: 'bold', width: 40, textAlign: 'center' },
    addButton: { flex: 1, height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default DishDetailsScreen;
