import React from 'react';
import { View, FlatList, Image, StyleSheet, Dimensions } from 'react-native';
import { AdItem } from '../types';

interface AdCarouselProps {
    ads: AdItem[];
    fullScreen?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AdCarousel: React.FC<AdCarouselProps> = ({ ads, fullScreen = false }) => {
    if (!ads || ads.length === 0) return null;

    return (
        <View style={[styles.adContainer, fullScreen && styles.fullScreenContainer]}>
            <FlatList
                data={ads}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={[styles.adCard, fullScreen && styles.fullScreenCard]}>
                        <Image source={{ uri: item.image_url }} style={styles.adImage} />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    adContainer: { height: 180, marginVertical: 16 },
    fullScreenContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, marginVertical: 0, position: 'absolute', top: 0, left: 0, zIndex: 2000, backgroundColor: '#000' },
    adCard: { width: 340, height: 180, marginLeft: 20, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15 },
    fullScreenCard: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, marginLeft: 0, borderRadius: 0 },
    adImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});

export default AdCarousel;
