import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Dish } from '../types';
import StarRating from './StarRating';
import { Theme } from '../themes';

interface DishCardProps {
    item: Dish;
    onRate: (id: number, rating: number) => void;
    onAddToCart: (dish: Dish) => void;
    onPress: () => void;
    theme: Theme;
}

const DishCard: React.FC<DishCardProps> = ({ item, onRate, onAddToCart, onPress, theme }) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.dishCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image_url || 'https://via.placeholder.com/300' }} style={styles.dishImage} />
                <View style={[styles.priceTag, { backgroundColor: theme.colors.overlay, borderColor: theme.colors.border }]}>
                    <Text style={[styles.priceTagText, { color: theme.colors.success }]}>MT {parseFloat(String(item.price)).toFixed(2)}</Text>
                </View>
            </View>
            <View style={styles.dishContent}>
                <Text style={[styles.dishName, { color: theme.colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.dishDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>

                <View style={styles.cardFooter}>
                    <StarRating rating={item.average_rating || 0} onRate={(n) => onRate(item.id, n)} size={14} readOnly />
                    <TouchableOpacity style={[styles.cardAddButton, { backgroundColor: theme.colors.primary }]} onPress={() => onAddToCart(item)}>
                        <Text style={styles.addButtonText}>Adicionar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    dishCard: { borderRadius: 24, marginBottom: 16, width: '48%', overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    imageContainer: { width: '100%', height: 140, position: 'relative' },
    dishImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    priceTag: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
    priceTagText: { fontWeight: 'bold', fontSize: 13 },
    dishContent: { padding: 14 },
    dishName: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
    dishDescription: { fontSize: 12, marginBottom: 12, lineHeight: 18, height: 36 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    cardAddButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
    addButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
});

export default DishCard;
