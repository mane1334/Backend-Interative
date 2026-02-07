import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StarRatingProps {
    rating: number;
    onRate?: (n: number) => void;
    size?: number;
    readOnly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRate, size = 30, readOnly = false }) => {
    return (
        <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                    key={n}
                    onPress={() => !readOnly && onRate && onRate(n)}
                    disabled={readOnly}
                    activeOpacity={0.7}
                >
                    <Text style={[
                        styles.star,
                        {
                            fontSize: size,
                            color: n <= rating ? '#fbbf24' : '#475569',
                            textShadowColor: n <= rating ? 'rgba(251, 191, 36, 0.5)' : 'transparent',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 10
                        }
                    ]}>
                        ★
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    starContainer: { flexDirection: 'row', gap: 4 },
    star: { includeFontPadding: false },
});

export default StarRating;
