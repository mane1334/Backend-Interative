import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../themes';

interface CategoryBarProps {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    theme: Theme;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ categories, selectedCategory, onSelectCategory, theme }) => {
    return (
        <View style={[styles.categoryBar, { backgroundColor: theme.colors.background }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {categories.map(cat => {
                    const isActive = selectedCategory === cat;
                    return (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => onSelectCategory(cat)}
                            style={[
                                styles.categoryItem,
                                {
                                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                                    borderColor: isActive ? theme.colors.primary : theme.colors.border
                                }
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                { color: isActive ? '#ffffff' : theme.colors.textSecondary }
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    categoryBar: { paddingVertical: 16 },
    categoryScroll: { paddingHorizontal: 20 },
    categoryItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, marginRight: 10, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    categoryText: { fontWeight: '600', fontSize: 14 },
});

export default CategoryBar;
