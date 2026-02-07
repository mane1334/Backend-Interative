import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, Alert, LayoutAnimation, UIManager, StatusBar, NativeModules, AppState as RNAppState, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createSharedElementStackNavigator } from 'react-navigation-shared-element';

import CartModal from './CartModal';
import { Dish, CartItem, AdItem, Order, Settings } from './types';
import { themes } from './themes';
import { translations, Language, TranslationKey } from './translations';
import { saveState, loadState } from './persistence';

// Components
import ChatModal from './components/ChatModal';
import SettingsModal from './components/SettingsModal';
import OrderStatusBar from './components/OrderStatusBar';
import AdCarousel from './components/AdCarousel';
import OrderReviewModal from './components/OrderReviewModal';
import WaiterCallModal from './components/WaiterCallModal';
import Toast from './components/Toast';

// Screens
import HomeScreen from './screens/HomeScreen';
import DishDetailsScreen from './screens/DishDetailsScreen';

const { KioskModule } = NativeModules;
const Stack = createSharedElementStackNavigator();

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
  const [serverIp, setServerIp] = useState('10.0.2.2');
  const [tableNumber, setTableNumber] = useState('1');
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('pt');

  const theme = themes[currentTheme] || themes.dark;
  const t = (key: TranslationKey) => translations[currentLanguage][key] || key;

  const currentApiUrl = `http://${serverIp}:3000/api`;
  const currentWsUrl = `ws://${serverIp}:3000`;

  // Load Persistence
  useEffect(() => {
    const init = async () => {
      const state = await loadState();
      setServerIp(state.serverIp);
      setTableNumber(state.tableNumber);
      setCurrentTheme(state.currentTheme);
      setCurrentLanguage(state.currentLanguage as Language);

      if (state.currentOrder) {
        setCurrentOrder(state.currentOrder);
        checkOrderStatus(state.currentOrder.id, state.serverIp);
      }
    };
    init();

    // Immersive Mode & AppState Listener
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        KioskModule?.startKiosk();
      }
    };

    KioskModule?.startKiosk();

    // Subscribe to AppState changes
    const sub = RNAppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, []);

  // Save Persistence
  useEffect(() => {
    saveState({ serverIp, tableNumber, currentTheme, currentLanguage, currentOrder });
  }, [serverIp, tableNumber, currentTheme, currentLanguage, currentOrder]);

  const checkOrderStatus = async (orderId: number, ip: string) => {
    try {
      const res = await fetch(`http://${ip}:3000/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'completed' || data.status === 'cancelled') {
          if (data.status === 'cancelled') {
            setCurrentOrder(null);
            Alert.alert('Aviso', 'Seu pedido anterior foi cancelado.');
          } else if (data.status === 'completed') {
            setCurrentOrder(prev => prev ? { ...prev, status: 'completed' } : null);
          }
        } else {
          setCurrentOrder(prev => prev ? { ...prev, prepSeconds: data.prep_time_seconds, cancelUntil: data.cancel_until } : null);
        }
      } else {
        setCurrentOrder(null);
      }
    } catch (e) {
      console.log('Error checking order status', e);
    }
  };

  const handleRateDish = async (dishId: number, rating: number) => {
    try {
      await fetch(`${currentApiUrl}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_id: dishId, rating, comment: 'Avaliado via Mobile' }),
      });
      setMenu(prev => prev.map(d => d.id === dishId ? { ...d, average_rating: rating } : d));
      Alert.alert('Obrigado!', 'Sua avaliação foi enviada.');
    } catch (e) {
      console.error('Erro ao avaliar:', e);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
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

      // Transform relative image paths to absolute URLs using current serverIp
      const baseUrl = `http://${serverIp}:3000`;
      const resolveUrl = (url: string | undefined) => {
        if (!url) return 'https://via.placeholder.com/300';
        // Fix para imagens que vêm do banco como localhost
        if (url.startsWith('http')) {
          if (url.includes('localhost') || url.includes('127.0.0.1')) {
            return url.replace(/http:\/\/[^/]+/, baseUrl);
          }
          return url;
        }
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return `${baseUrl}/${url}`;
      };

      const processedMenu = menuData.map((dish: Dish) => ({
        ...dish,
        image_url: resolveUrl(dish.image_url),
      }));

      const processedAds = adsData.map((ad: AdItem) => ({
        ...ad,
        image_url: resolveUrl(ad.image_url),
      }));

      setMenu(processedMenu);
      setSettings(settingsData);
      setCategories(['Todos', ...catsData.map((c: any) => c.name)]);

      const now = new Date();
      setActiveAds(processedAds.filter((ad: AdItem) => {
        const startDate = ad.start_date ? new Date(ad.start_date) : new Date(0);
        const endDate = ad.end_date ? new Date(ad.end_date) : new Date(8640000000000000);
        return ad.is_active && now >= startDate && now <= endDate;
      }));
    } catch (error: any) {
      setError('Não foi possível conectar ao servidor. Verifique o IP nas configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ref for currentOrder to access inside WS callback without re-triggering useEffect
  const currentOrderRef = useRef<Order | null>(null);
  useEffect(() => { currentOrderRef.current = currentOrder; }, [currentOrder]);

  useEffect(() => {
    if (serverIp) fetchData();
    const ws = new WebSocket(currentWsUrl);
    ws.onopen = () => { console.log('Conectado ao WebSocket.'); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const activeOrder = currentOrderRef.current;

        if (!activeOrder) return;

        if (data.type === 'PREP_TIME_UPDATE' && data.payload.order_id == activeOrder.id) {
          const secs = Number(data.payload.prep_time_seconds) || 0;
          setCurrentOrder(prev => prev ? { ...prev, prepSeconds: secs } : prev);
        } else if (data.type === 'ORDER_CANCELLED' && data.payload.id == activeOrder.id) {
          const reason = data.payload.cancellation_reason || 'Motivo não informado.';
          Alert.alert('Pedido cancelado pela cozinha', `Motivo: ${reason}`);
          setCurrentOrder(null);
          setLocked(false);
        } else if (data.type === 'COURTESY_MESSAGE' && data.payload.order_id == activeOrder.id) {
          const text = data.payload.message || 'Msg';
          setDelayBanner({ visible: true, text });
          setTimeout(() => setDelayBanner({ visible: false, text: '' }), 30000);
          setLocked(false);
          Alert.alert('Atualização', text);
        } else if (data.type === 'ORDER_STATUS_UPDATE' && data.payload.order_id == activeOrder.id) {
          const status = data.payload.status;
          if (status === 'preparing') {
            Alert.alert('Status', '👨‍🍳 Seu pedido está sendo preparado!');
            setLocked(false);
          } else if (status === 'completed') {
            Alert.alert('Oba!', 'Seu pedido está pronto e a caminho! 🍽️');
            setLocked(false);
            setReviewVisible(true);
          }
        }
      } catch (e) { }
    };
    return () => ws.close();
  }, [serverIp]); // Removed currentOrder from dependency to prevent reconnection

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
      Alert.alert('Erro', 'Não foi possível enviar o pedido.');
    } finally {
      setIsSendingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder) return;
    try {
      await fetch(`${currentApiUrl}/orders/${currentOrder.id}/cancel`, { method: 'POST' });
      showToast('Pedido cancelado.', 'info');
      setCurrentOrder(null);
    } catch (e: any) { Alert.alert('Erro', 'Falha ao cancelar.'); }
  };

  const handleCallWaiter = async (reason: string = 'Chamado Geral') => {
    try {
      await fetch(`${currentApiUrl}/call-waiter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: parseInt(tableNumber), reason }),
      });
      setWaiterModalVisible(false);
      showToast('O garçom foi chamado!', 'success');
    } catch (err) { Alert.alert('Erro', 'Não foi possível chamar o garçom.'); }
  };

  return (
    <SafeAreaProvider onTouchStart={registerInteraction}>
      <NavigationContainer theme={{ colors: { background: theme.colors.background } } as any}>
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: theme.colors.background } }}>
          <Stack.Screen name="Home">
            {(props: any) => <HomeScreen
              {...props}
              menu={menu}
              activeAds={activeAds}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              isLoading={isLoading}
              error={error}
              retryFetch={retryFetch}
              addToCart={addToCart}
              handleRateDish={handleRateDish}
              settings={settings}
              theme={theme}
              tableNumber={tableNumber}
              cart={cart}
              t={t}
              onOpenSettings={() => setSettingsVisible(true)}
              onLock={() => setLocked(true)}
              onCallWaiter={() => setWaiterModalVisible(true)}
              onOpenChat={() => setChatVisible(true)}
              onOpenCart={() => setCartVisible(true)}
            />}
          </Stack.Screen>
          <Stack.Screen
            name="DishDetails"
            sharedElements={(route: any) => {
              const { dish } = route.params;
              return [`item.${dish.id}.photo`];
            }}
            options={{
              cardStyleInterpolator: ({ current: { progress } }: { current: { progress: any } }) => ({
                cardStyle: { opacity: progress }
              }),
              gestureEnabled: false,
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 400 } },
                close: { animation: 'timing', config: { duration: 400 } }
              }
            }}
          >
            {(props: any) => <DishDetailsScreen
              {...props}
              theme={theme}
              onAddToCart={addToCart}
              onRate={handleRateDish}
            />}
          </Stack.Screen>
        </Stack.Navigator>

        <OrderStatusBar currentOrder={currentOrder} onCancel={handleCancelOrder} theme={theme} />

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

        {delayBanner.visible && (
          <View style={[styles.delayBanner, { backgroundColor: theme.colors.warning }]}>
            <Text style={styles.delayBannerText}>{delayBanner.text}</Text>
          </View>
        )}

        {/* Modals must stay outside Navigation to overlay everything */}
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
            setServerIp(ip); setTableNumber(table); setCurrentTheme(newTheme); setCurrentLanguage(newLang as Language); setSettingsVisible(false);
          }}
          currentTheme={currentTheme}
          currentLanguage={currentLanguage}
        />
        <OrderReviewModal
          visible={isReviewVisible}
          onClose={() => setReviewVisible(false)}
          onSubmit={handleReviewSubmit}
        />

        {locked && (
          <View style={[styles.lockOverlay, { backgroundColor: theme.colors.overlay }]}>
            <AdCarousel ads={activeAds} fullScreen />
            <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, zIndex: 2 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Toque para iniciar</Text>
            </View>
            <Text
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
              onPress={() => {
                setLocked(false);
                registerInteraction();
                setCartVisible(false);
                setChatVisible(false);
              }}
            > </Text>
          </View>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  delayBanner: { position: 'absolute', top: 50, left: 20, right: 20, borderRadius: 16, padding: 12, zIndex: 100 },
  delayBannerText: { color: '#0f172a', fontWeight: '900', textAlign: 'center', fontSize: 14 },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 1000 },
});

export default App;
