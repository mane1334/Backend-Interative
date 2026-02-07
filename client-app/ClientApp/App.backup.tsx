import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Modal, TextInput, ScrollView, ActivityIndicator, PermissionsAndroid, Platform, Alert, LayoutAnimation, UIManager, StatusBar, NativeModules, AppState as RNAppState } from 'react-native';
import CartModal from './CartModal';
import { API_URL, WS_URL } from './config';
import { Dish, CartItem, AdItem, Order, Settings } from './types';
import { themes, Theme } from './themes';
import { translations, Language, TranslationKey } from './translations';
import { saveState, loadState, AppState } from './persistence';

// Components
import ChatModal from './components/ChatModal';
import DishCard from './components/DishCard';
import StarRating from './components/StarRating';
import SettingsModal from './components/SettingsModal';
import OrderStatusBar from './components/OrderStatusBar';
import CategoryBar from './components/CategoryBar';
import AdCarousel from './components/AdCarousel';
import DishDetailsModal from './components/DishDetailsModal';
import OrderReviewModal from './components/OrderReviewModal';
import WaiterCallModal from './components/WaiterCallModal';
import Toast from './components/Toast';

const { KioskModule } = NativeModules;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const App = () => {
  const [menu, setMenu] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isChatVisible, setChatVisible] = useState(false);
  const [isCartVisible, setCartVisible] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isReviewVisible, setReviewVisible] = useState(false);
  const [isWaiterModalVisible, setWaiterModalVisible] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };
  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [activeAds, setActiveAds] = useState<AdItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [locked, setLocked] = useState(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const [delayBanner, setDelayBanner] = useState<{ visible: boolean; text: string }>(() => ({ visible: false, text: '' }));
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [categories, setCategories] = useState<string[]>(['Todos']);

  // Dynamic Config
  const [wsConnected, setWsConnected] = useState(false);
  const [serverIp, setServerIp] = useState('10.0.2.2');
  const [tableNumber, setTableNumber] = useState('1');
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('pt');

  const theme = themes[currentTheme] || themes.dark;
  const styles = useMemo(() => getStyles(theme), [theme]);

  const t = (key: TranslationKey) => translations[currentLanguage][key] || key;

  const currentApiUrl = `http://${serverIp}:3000/api`;
  const currentWsUrl = `ws://${serverIp}:3000`;

  const filteredMenu = selectedCategory === 'Todos'
    ? menu
    : menu.filter(dish => dish.category_name === selectedCategory);

  // Load Persistence
  useEffect(() => {
    const init = async () => {
      const state = await loadState();
      setServerIp(state.serverIp);
      setTableNumber(state.tableNumber);
      setCurrentTheme(state.currentTheme);
      setCurrentLanguage(state.currentLanguage as Language);

      if (state.currentOrder) {
        // Validate if order is still active
        setCurrentOrder(state.currentOrder);
        checkOrderStatus(state.currentOrder.id, state.serverIp);
      }
    };
    init();

    // Immersive Mode & AppState Listener
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && Platform.OS === 'android') {
        KioskModule?.startKiosk();
        StatusBar.setHidden(true);
        StatusBar.setTranslucent(true);
      }
    };

    if (Platform.OS === 'android') {
      StatusBar.setHidden(true);
      StatusBar.setTranslucent(true);
      KioskModule?.startKiosk();
    }

    // Subscribe to AppState changes
    const sub = RNAppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, []);

  // Save Persistence
  useEffect(() => {
    saveState({
      serverIp,
      tableNumber,
      currentTheme,
      currentLanguage,
      currentOrder
    });
  }, [serverIp, tableNumber, currentTheme, currentLanguage, currentOrder]);

  const checkOrderStatus = async (orderId: number, ip: string) => {
    try {
      const res = await fetch(`http://${ip}:3000/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        // Update status and prep time
        if (data.status === 'completed' || data.status === 'cancelled') {
          // If concluded, maybe just clear it or show review?
          // For now, update it
          if (data.status === 'cancelled') {
            setCurrentOrder(null);
            Alert.alert('Aviso', 'Seu pedido anterior foi cancelado.');
          } else if (data.status === 'completed') {
            // If not reviewed yet? 
            // Check logic for review...
            // Simply update for now
            setCurrentOrder(prev => prev ? { ...prev, status: 'completed' } : null);
          }
        } else {
          setCurrentOrder(prev => prev ? { ...prev, prepSeconds: data.prep_time_seconds, cancelUntil: data.cancel_until } : null);
        }
      } else {
        // If 404, clear order
        setCurrentOrder(null);
      }
    } catch (e) {
      console.log('Error checking order status', e);
    }
  };

  const handleRateDish = async (dishId: number, rating: number) => {
    try {
      const res = await fetch(`${currentApiUrl}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_id: dishId, rating, comment: 'Avaliado via Mobile' }),
      });
      if (res.ok) {
        Alert.alert('Obrigado!', 'Sua avaliação foi enviada.');
        if (selectedDish?.id === dishId) {
          setSelectedDish(prev => prev ? { ...prev, average_rating: rating } : prev);
        }
        setMenu(prev => prev.map(d => d.id === dishId ? { ...d, average_rating: rating } : d));
      }
    } catch (e) {
      console.error('Erro ao avaliar:', e);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    console.log(`Review submitted: ${rating} stars, "${comment}"`);
    Alert.alert('Obrigado!', 'Agradecemos seu feedback.');
    setReviewVisible(false);
    setCurrentOrder(null);
  };

  const retryFetch = async () => {
    await fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [menuRes, adsRes, settingsRes, catsRes] = await Promise.all([
        fetch(`${currentApiUrl}/dishes`),
        fetch(`${currentApiUrl}/ads`),
        fetch(`${currentApiUrl}/settings`),
        fetch(`${currentApiUrl}/categories`)
      ]);

      if (!menuRes.ok) throw new Error('Servidor não encontrado.');

      const menuData = await menuRes.json();
      const adsData = await adsRes.json();
      const settingsData = await settingsRes.json();
      const catsData = await catsRes.json();

      setMenu(menuData);
      setSettings(settingsData);
      setCategories(['Todos', ...catsData.map((c: any) => c.name)]);

      const now = new Date();
      setActiveAds(adsData.filter((ad: AdItem) => {
        // Ensure date parsing works for 'YYYY-MM-DD' strings
        const startDate = ad.start_date ? new Date(ad.start_date) : new Date(0);
        const endDate = ad.end_date ? new Date(ad.end_date) : new Date(8640000000000000); // far future

        // Reset time part for date-only comparison if needed, but simple comparison should work
        return ad.is_active && now >= startDate && now <= endDate;
      }));
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      setError('Não foi possível conectar ao servidor. Verifique o IP nas configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (LayoutAnimation.configureNext) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
    }
    fetchData();

    const ws = new WebSocket(currentWsUrl);
    ws.onopen = () => { console.log('Conectado ao WebSocket.'); setWsConnected(true); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WS Msg:', data.type, data.payload);

        if (data.type === 'NEW_ORDER' || data.type === 'CALL_WAITER') {
          // Ignorar
        } else if (data.type === 'PREP_TIME_UPDATE' && currentOrder && data.payload.order_id == currentOrder.id) {
          const secs = Number(data.payload.prep_time_seconds) || 0;
          setCurrentOrder(prev => prev ? { ...prev, prepSeconds: secs } : prev);
        } else if (data.type === 'ORDER_CANCELLED' && currentOrder && data.payload.id == currentOrder.id) {
          Alert.alert('Pedido cancelado pela cozinha', 'Seu pedido foi cancelado.');
          setCurrentOrder(null);
          setLocked(false);
        } else if (data.type === 'COURTESY_MESSAGE' && currentOrder && data.payload.order_id == currentOrder.id) {
          const text = data.payload.message || 'Pedimos desculpa pelo atraso, seu prato ficará pronto em breve.';
          Alert.alert('Atualização do tempo', text);
          setDelayBanner({ visible: true, text });
          setTimeout(() => setDelayBanner({ visible: false, text: '' }), 30000);
          setLocked(false);
        } else if (data.type === 'ORDER_STATUS_UPDATE' && currentOrder && data.payload.order_id == currentOrder.id) {
          const status = data.payload.status;
          console.log('Order Status Update:', status);
          if (status === 'preparing') {
            Alert.alert('Status do Pedido', '👨‍🍳 Seu pedido começou a ser preparado!');
            setLocked(false);
          } else if (status === 'completed') {
            Alert.alert('Status do Pedido', '🍽️ Seu pedido está pronto! O garçom está a caminho.');
            setLocked(false);
            setReviewVisible(true);
          }
        }
      } catch (e) {
        console.error("Ws error", e);
      }
    };
    ws.onerror = (e) => console.error('Erro no WebSocket:', e);
    ws.onclose = () => { console.log('Desconectado do WebSocket.'); setWsConnected(false); };

    return () => ws.close();
  }, [serverIp]);

  // Re-run fetch data if IP changes
  useEffect(() => {
    if (serverIp) fetchData();
  }, [serverIp]);

  // Inactivity Lock
  useEffect(() => {
    const check = setInterval(() => {
      const mins = Number(settings?.inactivity_timeout_minutes) || 0;
      if (!mins) return;
      const elapsedMs = Date.now() - lastInteractionRef.current;
      if (elapsedMs > mins * 60 * 1000 && !locked) {
        setLocked(true);
      }
    }, 1000);
    return () => clearInterval(check);
  }, [settings?.inactivity_timeout_minutes, locked]);

  const registerInteraction = () => {
    lastInteractionRef.current = Date.now();
  };

  // Cart Functions
  const addToCart = (dish: Dish, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item => item.id === dish.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...dish, quantity }];
    });
    showToast(`${quantity}x ${dish.name} adicionado!`, 'success');
  };
  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));
  const changeQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };
  const clearCart = () => setCart([]);

  // Send Order
  const handleSendOrder = async () => {
    setIsSendingOrder(true);
    try {
      const items = cart.map(item => ({ dish_id: item.id, quantity: item.quantity }));
      const response = await fetch(`${currentApiUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: parseInt(tableNumber), items }),
      });
      if (!response.ok) throw new Error('Erro ao enviar pedido');
      const data = await response.json();
      setCurrentOrder({ id: data.order_id, prepSeconds: Number(data.prep_time_seconds) || 0, cancelUntil: data.cancel_until });
      showToast('Pedido enviado com sucesso!', 'success');
      clearCart();
      setCartVisible(false);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar o pedido. Tente novamente.');
    } finally {
      setIsSendingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder) return;
    try {
      const res = await fetch(`${currentApiUrl}/orders/${currentOrder.id}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Falha ao cancelar.');
      }
      showToast('Pedido cancelado.', 'info');
      setCurrentOrder(null);
    } catch (e: any) {
      Alert.alert('Não foi possível cancelar', e.message || 'Janela expirada.');
    }
  };

  const handleCallWaiter = async (reason: string = 'Chamado Geral') => {
    try {
      const response = await fetch(`${currentApiUrl}/call-waiter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: parseInt(tableNumber), reason }),
      });
      if (!response.ok) throw new Error('Erro ao chamar garçom');
      setWaiterModalVisible(false);
      showToast('O garçom foi chamado!', 'success');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível chamar o garçom. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container} onTouchStart={registerInteraction}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      <WaiterCallModal visible={isWaiterModalVisible} onClose={() => setWaiterModalVisible(false)} onCall={handleCallWaiter} />
      <ChatModal visible={isChatVisible} onClose={() => setChatVisible(false)} />
      <CartModal
        visible={isCartVisible}
        onClose={() => setCartVisible(false)}
        cart={cart}
        onRemoveItem={removeFromCart}
        onChangeQuantity={changeQuantity}
        onSendOrder={handleSendOrder}
        isSending={isSendingOrder}
        theme={theme}
      />

      <SettingsModal
        visible={isSettingsVisible}
        onClose={() => setSettingsVisible(false)}
        initialIp={serverIp}
        initialTable={tableNumber}
        onSave={(ip, table, newTheme, newLang) => {
          setServerIp(ip);
          setTableNumber(table);
          setCurrentTheme(newTheme);
          setCurrentLanguage(newLang as Language);
          setSettingsVisible(false);
          // fetchData() will be triggered by useEffect([serverIp])
        }}
        currentTheme={currentTheme}
        currentLanguage={currentLanguage}
      />

      <DishDetailsModal
        visible={!!selectedDish}
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onAddToCart={addToCart}
        onRate={handleRateDish}
        theme={theme}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{settings?.restaurant_name || 'Restaurante'}</Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{t('table')} {tableNumber} •</Text>
            <Text style={{ color: theme.colors.success, fontSize: 13, fontWeight: 'bold' }}>
              {settings?.opening_hours ? `${t('open')}: ${settings.opening_hours} - ${settings.closing_hours}` : t('welcome')}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={[styles.headerWaiter, { backgroundColor: theme.colors.secondary }]} onLongPress={() => NativeModules.KioskModule?.stopKiosk()}>
            <Text style={styles.headerWaiterText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLocked(true)} style={[styles.headerWaiter, { backgroundColor: theme.colors.error }]}>
            <Text style={[styles.headerWaiterText, { color: '#fff' }]}>🔒</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setWaiterModalVisible(true)} style={styles.headerWaiter}>
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
              onAddToCart={(d) => addToCart(d, 1)}
              onPress={() => setSelectedDish(item)}
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

      <OrderStatusBar currentOrder={currentOrder} onCancel={handleCancelOrder} theme={theme} />

      {delayBanner.visible && (
        <View style={styles.delayBanner}>
          <Text style={styles.delayBannerText}>{delayBanner.text}</Text>
        </View>
      )}

      <OrderReviewModal
        visible={isReviewVisible}
        onClose={() => setReviewVisible(false)}
        onSubmit={handleReviewSubmit}
      />

      {locked && (
        <View style={styles.lockOverlay}>
          <AdCarousel ads={activeAds} fullScreen />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => { setLocked(false); registerInteraction(); setCartVisible(false); setChatVisible(false); }}
          >
            <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Toque para iniciar</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footerButtons}>
        <TouchableOpacity style={[styles.footerButton, styles.footerButtonPrimary]} onPress={() => setChatVisible(true)}>
          <Text style={styles.footerButtonText}>🤖 IA Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerButton, styles.footerButtonDark]} onPress={() => setCartVisible(true)}>
          <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>🛍️ {t('my_orders')} ({cart.reduce((a, b) => a + b.quantity, 0)})</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

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
  delayBanner: { position: 'absolute', top: 80, left: 20, right: 20, backgroundColor: theme.colors.warning, borderRadius: 16, padding: 12, zIndex: 100, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
  delayBannerText: { color: '#0f172a', fontWeight: '900', textAlign: 'center', fontSize: 14 },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 18, color: theme.colors.error, textAlign: 'center', marginBottom: 32, lineHeight: 26 },
  retryButton: { backgroundColor: theme.colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
  retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});

export default App;
