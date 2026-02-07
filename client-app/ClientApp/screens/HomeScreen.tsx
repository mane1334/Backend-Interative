import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SharedElement } from 'react-navigation-shared-element';
import DishCard from '../components/DishCard';
import AdCarousel from '../components/AdCarousel';
import CategoryBar from '../components/CategoryBar';
import { Dish, CartItem, AdItem, Settings } from '../types';
import { isRestaurantOpen } from '../utils/openingHours';
import { Theme } from '../themes';

interface HomeScreenProps {
    navigation: any;
    menu: Dish[];
    activeAds: AdItem[];
    categories: string[];
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
    isLoading: boolean;
    error: string | null;
    retryFetch: () => void;
    addToCart: (dish: Dish) => void;
    handleRateDish: (id: number, rating: number) => void;
    settings: Settings | null;
    theme: Theme;
    tableNumber: string;
    cart: CartItem[];
    t: (key: string) => string;
    onOpenSettings: () => void;
    onLock: () => void;
    onCallWaiter: () => void;
    onOpenChat: () => void;
    onOpenCart: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
    navigation,
    menu,
    activeAds,
    categories,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
    retryFetch,
    addToCart,
    handleRateDish,
    settings,
    theme,
    tableNumber,
    cart,
    t,
    onOpenSettings,
    onLock,
    onCallWaiter,
    onOpenChat,
    onOpenCart
}) => {
    const filteredMenu = selectedCategory === 'Todos'
        ? menu
        : menu.filter(dish => dish.category_name === selectedCategory);

    const getStyles = (theme: Theme) => StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        header: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 20, paddingVertical: 16,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1, borderColor: theme.colors.border
        },
        title: { fontSize: 26, fontWeight: '900', color: theme.colors.text, letterSpacing: -0.5 },
        headerWaiter: {
            backgroundColor: theme.colors.warning,
            paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
            shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5
        },
        headerWaiterText: { color: '#0f172a', fontWeight: 'bold', fontSize: 13 },
        listContainer: { paddingHorizontal: 12, paddingBottom: 100 },
        gridRow: { justifyContent: 'space-between' },
        footerButtons: {
            flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1, borderColor: theme.colors.border
        },
        footerButton: { flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
        footerButtonPrimary: { backgroundColor: theme.colors.primary },
        footerButtonDark: { backgroundColor: 'transparent' },
        footerButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
        errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
        errorText: { fontSize: 18, color: theme.colors.error, textAlign: 'center', marginBottom: 32, lineHeight: 26 },
        retryButton: { backgroundColor: theme.colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
        retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
    });

    const styles = getStyles(theme);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{settings?.restaurant_name || 'Restaurante'}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{t('table')} {tableNumber} •</Text>

                        {(() => {
                            const isOpen = isRestaurantOpen(settings?.opening_hours, settings?.closing_hours);
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOpen ? theme.colors.success : theme.colors.error }} />
                                    <Text style={{ color: isOpen ? theme.colors.success : theme.colors.error, fontSize: 13, fontWeight: 'bold' }}>
                                        {isOpen ? t('open').toUpperCase() : t('closed').toUpperCase()}
                                    </Text>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginLeft: 4 }}>
                                        {settings?.opening_hours && `(${settings.opening_hours} - ${settings.closing_hours})`}
                                    </Text>
                                </View>
                            );
                        })()}
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={onOpenSettings} style={[styles.headerWaiter, { backgroundColor: theme.colors.secondary }]}>
                        <Text style={styles.headerWaiterText}>⚙️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onLock} style={[styles.headerWaiter, { backgroundColor: theme.colors.error }]}>
                        <Text style={[styles.headerWaiterText, { color: '#fff' }]}>🔒</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onCallWaiter} style={styles.headerWaiter}>
                        <Text style={styles.headerWaiterText}>🔔 {t('waiter_call')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <AdCarousel ads={activeAds} />
            <CategoryBar categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} theme={theme} />

            {isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredMenu}
                    renderItem={({ item }) => (
                        <DishCard
                            item={item}
                            onRate={handleRateDish}
                            onAddToCart={addToCart}
                            onPress={() => navigation.navigate('DishDetails', { dish: item })}
                            theme={theme}
                        />
                    )}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    numColumns={2}
                    columnWrapperStyle={styles.gridRow}
                />
            )}

            <View style={styles.footerButtons}>
                <TouchableOpacity style={[styles.footerButton, styles.footerButtonPrimary]} onPress={onOpenChat}>
                    <Text style={styles.footerButtonText}>🤖 IA Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.footerButton, styles.footerButtonDark]} onPress={onOpenCart}>
                    <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>🛍️ {t('my_orders')} ({cart.reduce((a, b) => a + b.quantity, 0)})</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default HomeScreen;
