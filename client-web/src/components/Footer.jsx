
import React, { useEffect, useState } from 'react';
import { getAds } from '../services/api';
import { toast } from 'react-toastify';
import { resolveImageUrl, PLACEHOLDER_IMG } from '../utils/images';

const Footer = () => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const data = await getAds();
        // Filter active ads and sort by updated_at (newest first)
        const activeAds = data.filter(ad => ad.is_active).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setAds(activeAds);
      } catch (e) {
        setError(e.message);
        toast.error('Erro ao carregar anúncios.');
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex(prevIndex => (prevIndex + 1) % ads.length);
      }, 10000); // Change ad every 10 seconds
      return () => clearInterval(interval);
    }
  }, [ads]);

  if (loading) return (
    <footer className="bg-gray-800 text-white p-4 text-center mt-8">
      <p>Carregando anúncios...</p>
    </footer>
  );

  if (error) return (
    <footer className="bg-gray-800 text-white p-4 text-center mt-8">
      <p className="text-red-400">Erro ao carregar anúncios: {error}</p>
    </footer>
  );

  if (ads.length === 0) return (
    <footer className="bg-gradient-to-t from-gray-900 to-gray-800 text-white p-8 text-center mt-12">
      <div className="container mx-auto">
        <div className="border-t border-gray-700 pt-8">
          <p className="text-gray-400 mb-4">🍽️ Obrigado por escolher nosso restaurante!</p>
          <p className="text-sm text-gray-500">Sistema de Pedidos Digital - Interactive Restaurant</p>
        </div>
      </div>
    </footer>
  );

  const currentAd = ads[currentAdIndex];

  return (
    <footer className="bg-gradient-to-t from-gray-900 to-gray-800 text-white p-8 text-center mt-12">
      <div className="container mx-auto">
        {/* Ad Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-red-800 to-red-700 rounded-xl shadow-xl">
          {(
            <div className="mb-4">
              <img 
                src={currentAd.image_url ? resolveImageUrl(currentAd.image_url) : PLACEHOLDER_IMG} 
                alt={currentAd.title} 
                className="mx-auto rounded-lg shadow-lg max-h-48 object-contain"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMG;
                }}
              />
            </div>
          )}
          <h3 className="text-2xl font-bold mb-2 text-white">{currentAd.title}</h3>
          <p className="text-red-100 mb-4">{currentAd.content}</p>
          <p className="text-xs text-red-200 opacity-75">Publicidade</p>
          
          {/* Ad navigation dots */}
          {ads.length > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              {ads.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    index === currentAdIndex ? 'bg-white' : 'bg-white opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="border-t border-gray-700 pt-8">
          <p className="text-gray-400 mb-4">🍽️ Obrigado por escolher nosso restaurante!</p>
          <p className="text-sm text-gray-500">Sistema de Pedidos Digital - Interactive Restaurant</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
