import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CategoryBarProps {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ categories, selectedCategory, onSelectCategory }) => {
    return (
        <View style={styles.categoryBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => onSelectCategory(cat)}
                        style={[styles.categoryItem, selectedCategory === cat && styles.categoryItemActive]}
                    >
                        <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    categoryBar: { paddingVertical: 16, backgroundColor: '#020617' },
    categoryScroll: { paddingHorizontal: 20 },
    categoryItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: '#1e293b', marginRight: 10, borderWidth: 1, borderColor: '#334155' },
    categoryItemActive: { backgroundColor: '#2563eb', borderColor: '#3b82f6', shadowColor: '#2563eb', shadowOpacity: 0.4, shadowRadius: 10 },
    categoryText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
    categoryTextActive: { color: '#ffffff', fontWeight: '800' },
});

export default CategoryBar;
