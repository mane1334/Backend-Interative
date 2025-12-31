import React, { useState } from 'react';
import { callWaiter } from '../services/api';
import { toast } from 'react-toastify';
import { useSettings } from '../SettingsContext';

const CallWaiter = ({ tableNumber = 1 }) => {
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [currentTableNumber, setCurrentTableNumber] = useState(tableNumber);
  const { settings } = useSettings();
  const tablesCount = Number(settings?.tables_count) || 50;

  const handleCallWaiter = async () => {
    if (!currentTableNumber || currentTableNumber < 1) {
      toast.error('Por favor, informe um número de mesa válido.');
      return;
    }
    
    setIsCallingWaiter(true);
    try {
      await callWaiter(currentTableNumber);
      toast.success(`Garçom chamado para a mesa ${currentTableNumber}!`);
    } catch (e) {
      toast.error('Erro ao chamar o garçom. Tente novamente.');
    } finally {
      setIsCallingWaiter(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">👋 Precisa de Ajuda?</h3>
        <p className="text-gray-600 text-sm">Nosso garçom estará com você em instantes!</p>
      </div>
      
      {/* Table Number Input for Waiter Call */}
      <div className="mb-4">
        <label htmlFor="waiterTableNumber" className="block text-sm font-medium text-gray-700 mb-2">
          Número da Mesa
        </label>
        <input
          type="number"
          id="waiterTableNumber"
          min="1"
          max={tablesCount}
          value={currentTableNumber}
          onChange={(e) => setCurrentTableNumber(parseInt(e.target.value) || 1)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Digite o número da sua mesa"
        />
      </div>
      
      <button 
        onClick={handleCallWaiter}
        disabled={isCallingWaiter || !currentTableNumber}
        className={`w-full bg-yellow-600 text-white font-bold py-4 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 
          ${isCallingWaiter || !currentTableNumber ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-700'}`}
      >
        {isCallingWaiter ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mr-3"></div>
            Chamando Garçom...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className="mr-2">🙋‍♂️</span>
            Chamar Garçom
          </div>
        )}
      </button>
    </div>
  );
};

export default CallWaiter;
