import React, { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { resolveImageUrl, PLACEHOLDER_IMG } from '../utils/images';
import { submitRating } from '../services/api';
import StarRating from './StarRating';
import { toast } from 'react-toastify';

const DishModal = ({ dish, isOpen, onClose, onAddToCart }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !dish) return null;

  const handleClose = () => {
    // Reset state when closing
    setRating(0);
    setComment('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.warn('Por favor, selecione uma avaliação de 1 a 5 estrelas.');
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: Em um app real, o order_id viria do histórico do usuário
      await submitRating({ dish_id: dish.id, rating, comment, order_id: null });
      toast.success('Obrigado pela sua avaliação!');
      handleClose();
    } catch (error) {
      toast.error('Erro ao enviar avaliação. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        ></div>
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="rounded-2xl overflow-hidden">
            <div className="relative">
              <img
                src={resolveImageUrl(dish.image_url) || PLACEHOLDER_IMG}
                alt={dish.name}
                className="w-full h-80 object-cover"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMG;
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <h2 className="text-3xl font-bold text-white mb-2">{dish.name}</h2>
              </div>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Descrição</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{dish.description}</p>
              </div>

              {/* Rating Section */}
              <div className="mb-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Avalie este prato</h3>
                <div className="flex justify-center mb-4">
                    <StarRating rating={rating} setRating={setRating} />
                </div>
                <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deixe um comentário (opcional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="3"
                />
                <button
                    onClick={handleSubmitRating}
                    disabled={isSubmitting || rating === 0}
                    className="mt-4 w-full bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 hover:bg-black disabled:opacity-50"
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t">
                <div>
                  <span className="text-sm text-gray-500 block">Preço</span>
                  <span className="text-3xl font-bold text-red-600">{formatCurrency(dish.price)}</span>
                </div>
                
                <button
                  onClick={() => {
                    onAddToCart();
                    handleClose();
                  }}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🛒 Pedir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishModal;
