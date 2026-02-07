import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import DishList from './components/DishList';
import Cart from './components/Cart';
import CallWaiter from './components/CallWaiter';
import CurrentOrder from './components/CurrentOrder';
import Footer from './components/Footer';
import { CartProvider } from './CartContext';
import { SettingsProvider, useSettings } from './SettingsContext'; // Importar o SettingsProvider
import Chat from './components/Chat';

function Content() {
  const { settings } = useSettings();
  const theme = settings?.menu_theme || 'default';
  const open = isOpenNow(settings);
  return (
    <div className={`bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen font-sans text-gray-900 ${themeClass(theme)}`}>
      {!open && (
        <div className="bg-yellow-100 text-yellow-800 text-center py-3">Estamos fechados. Retorne no horário de funcionamento.</div>
      )}
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <DishList />
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              <CurrentOrder />
              <Cart />
              <CallWaiter />
            </div>
          </div>
        </div>
      </main>
      <Chat />
      <Footer />
    </div>
  );
}

function themeClass(theme) {
  if (theme === 'dark') return 'theme-dark';
  if (theme === 'brand') return 'theme-brand';
  return '';
}

function isOpenNow(settings) {
  const open = settings?.open_time || '00:00';
  const close = settings?.close_time || '23:59';
  const now = new Date();
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const openDate = new Date(now); openDate.setHours(oh, om, 0, 0);
  const closeDate = new Date(now); closeDate.setHours(ch, cm, 0, 0);
  return now >= openDate && now <= closeDate;
}

function App() {
  return (
    <SettingsProvider>
      <CartProvider>
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Content />
      </CartProvider>
    </SettingsProvider>
  );
}

export default App;
