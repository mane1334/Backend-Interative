import React, { useEffect, useState } from 'react';
import { getMenu } from '../services/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/currency';
import { useCartDispatch } from '../CartContext';
import { API_URL, BASE_URL } from '../config';
import { resolveImageUrl, PLACEHOLDER_IMG } from '../utils/images';
import { normalizeDish } from '../utils/text';
import DishModal from './DishModal';
const DishList = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDish, setSelectedDish] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useCartDispatch();

  // Categorias dos pratos
  const categories = {
    1: 'Entradas',
    2: 'Pratos Principais', 
    3: 'Sobremesas',
    4: 'Bebidas'
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await getMenu();
        const normalized = Array.isArray(data) ? data.map(normalizeDish) : [];
        setDishes(normalized);
      } catch (e) {
        setError(e.message);
        toast.error('Erro ao carregar o cardápio.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Filtrar pratos por categoria
  const filteredDishes = selectedCategory === 'all' 
    ? dishes 
    : dishes.filter(dish => dish.category_id === parseInt(selectedCategory));

  const openModal = (dish) => {
    setSelectedDish(dish);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDish(null);
    setIsModalOpen(false);
  };

  const handleAddToCart = () => {
    if (selectedDish) {
      dispatch({ type: 'ADD_ITEM', dish: selectedDish });
      toast.success(`${selectedDish.name} foi para o carrinho!`);
    }
  };

  if (loading) return (
    <div className="p-4">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 mb-4 md:mb-6">Nosso Cardápio</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="w-full h-48 skeleton"></div>
            <div className="p-5 space-y-3">
              <div className="h-6 w-2/3 skeleton rounded"></div>
              <div className="h-4 w-full skeleton rounded"></div>
              <div className="h-4 w-5/6 skeleton rounded"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-24 skeleton rounded"></div>
                <div className="flex gap-2">
                  <div className="h-9 w-20 skeleton rounded-full"></div>
                  <div className="h-9 w-20 skeleton rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  if (error) return <div className="p-4 text-red-600 bg-red-100 rounded-lg">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 mb-4 md:mb-6">Nosso Cardápio</h2>
      
      {/* Category Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6 md:mb-8">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform ${
            selectedCategory === 'all'
              ? 'bg-red-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:scale-[1.02]'
          }`}
        >
          Todos os Pratos
        </button>
        {Object.entries(categories).map(([categoryId, categoryName]) => (
          <button
            key={categoryId}
            onClick={() => setSelectedCategory(categoryId)}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform ${
              selectedCategory === categoryId
                ? 'bg-red-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:scale-[1.02]'
            }`}
          >
            {categoryName}
            <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
              {dishes.filter(d => String(d.category_id) === String(categoryId)).length}
            </span>
          </button>
        ))}
      </div>
      
      {filteredDishes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Nenhum prato encontrado nesta categoria.</div>
        </div>
      ) : (
        <div key={selectedCategory} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
        {filteredDishes.map(dish => (
          <div key={dish.id} className="bg-white rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 ease-in-out border border-gray-200 fade-in">
            <div className="dish-image cursor-pointer relative" onClick={() => openModal(dish)}>
              <img 
                src={resolveImageUrl(dish.image_url) || PLACEHOLDER_IMG} 
                alt={dish.name} 
                className="w-full h-48 object-cover transition-all duration-300 hover:brightness-110"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMG;
                }}
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                <span className="text-white font-semibold opacity-0 transition-opacity duration-300">
                  🔍 Ver Detalhes
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-red-600 transition-colors" onClick={() => openModal(dish)}>{dish.name}</h3>
              <p className="text-gray-700 text-sm mb-4 line-clamp-3">{dish.description}</p>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xl font-extrabold text-red-600">{formatCurrency(dish.price)}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openModal(dish)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-full transition-colors duration-300 text-sm"
                  >
                    Ver Mais
                  </button>
                  <button 
                    onClick={() => {
                      dispatch({ type: 'ADD_ITEM', dish });
                      toast.success(`${dish.name} foi para o carrinho!`);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-full transition-colors duration-300 shadow-md"
                  >
                    Pedir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
      
      {/* Dish Detail Modal */}
      <DishModal 
        dish={selectedDish}
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default DishList;
