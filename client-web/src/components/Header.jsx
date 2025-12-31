import React from 'react';
import Diagnostics from './Diagnostics';
import { useSettings } from '../SettingsContext';

const Header = () => {
  const { settings, loading } = useSettings();

  return (
    <header className="relative bg-gradient-to-r from-red-800 via-red-700 to-red-600 text-white shadow-2xl">
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="absolute right-4 top-4">
          <Diagnostics />
        </div>
        {settings.restaurant_logo_url && (
          <img 
            src={settings.restaurant_logo_url} 
            alt={`${settings.restaurant_name || 'Restaurante'} Logo`}
            className="mx-auto mb-4 h-20 w-auto rounded-lg shadow-md"
            crossOrigin="anonymous"
          />
        )}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4">
            {loading ? (
              <span className="animate-pulse">Carregando...</span>
            ) : (
              settings.restaurant_name || 'Restaurante Interactive'
            )}
          </h1>
          <p className="text-xl md:text-2xl mt-4 opacity-95 font-light tracking-wide slide-up">
            Sabor que encanta, momentos que ficam.
          </p>
          <div className="mt-6">
            <div className="inline-flex items-center space-x-2 bg-white bg-opacity-20 rounded-full px-6 py-3">
              <span className="text-lg font-medium">🍽️ Cardápio Digital</span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
    </header>
  );
};

export default Header;
