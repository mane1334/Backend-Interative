import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StarRatingProps {
    rating: number;
    onRate?: (n: number) => void;
    size?: number;
    readOnly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRate, size = 20, readOnly = false }) => {
    return (
        <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => !readOnly && onRate && onRate(n)} disabled={readOnly}>
                    <Text style={[styles.star, { fontSize: size, color: n <= rating ? '#f59e0b' : '#334155' }]}>
                        {n <= rating ? '★' : '☆'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    starContainer: { flexDirection: 'row' },
    star: { marginRight: 1 },
});

export default StarRating;
