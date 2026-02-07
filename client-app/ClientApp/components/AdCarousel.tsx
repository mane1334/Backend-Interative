import React from 'react';
import { View, FlatList, Image, StyleSheet, Dimensions, Text } from 'react-native';
import { AdItem } from '../types';

interface AdCarouselProps {
    ads: AdItem[];
    fullScreen?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AdCarousel: React.FC<AdCarouselProps> = ({ ads, fullScreen = false }) => {
    const flatListRef = React.useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (!ads || ads.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                const next = (prev + 1) % ads.length;
                flatListRef.current?.scrollToIndex({ index: next, animated: true });
                return next;
            });
        }, 5000); // 5 seconds per slide
        return () => clearInterval(interval);
    }, [ads]);

    if (!ads || ads.length === 0) return null;

    return (
        <View style={[styles.adContainer, fullScreen && styles.fullScreenContainer]}>
            <FlatList
                ref={flatListRef}
                data={ads}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={[styles.adCard, fullScreen && styles.fullScreenCard]}>
                        <Image source={{ uri: item.image_url }} style={styles.adImage} />
                        {fullScreen && (
                            <View style={styles.screensaverTextContainer}>
                                <Text style={styles.screensaverText}>Toque para ativar</Text>
                            </View>
                        )}
                    </View>
                )}
                onMomentumScrollEnd={(ev) => {
                    const idx = Math.round(ev.nativeEvent.contentOffset.x / (fullScreen ? SCREEN_WIDTH : 360)); // Approximate width
                    setCurrentIndex(idx);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    adContainer: { height: 180, marginVertical: 16 },
    fullScreenContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, marginVertical: 0, position: 'absolute', top: 0, left: 0, zIndex: 2000, backgroundColor: '#000' },
    adCard: { width: 340, height: 180, marginLeft: 20, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, position: 'relative' },
    fullScreenCard: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, marginLeft: 0, borderRadius: 0 },
    adImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    screensaverTextContainer: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30 },
    screensaverText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AdCarousel;
