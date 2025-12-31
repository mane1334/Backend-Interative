import React, { useState, useEffect } from 'react';
import DishForm from './DishForm.jsx';
import DishTable from './DishTable.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const DishManagement = () => {
  const [dishes, setDishes] = useState([]);
  const [editingDish, setEditingDish] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const response = await fetch(`${API_URL}/dishes`);
      if (!response.ok) {
        throw new Error('Erro ao buscar pratos.');
      }
      const data = await response.json();
      setDishes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDish = async (dishData) => {
    setLoading(true);
    setActionError(null);
    try {
      let response;
      if (dishData.id) {
        // Update existing dish
        response = await fetch(`${API_URL}/dishes/${dishData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dishData),
        });
      } else {
        // Add new dish
        response = await fetch(`${API_URL}/dishes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dishData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar prato.' }));
        throw new Error(errorData.message);
      }
      await response.json();
      fetchDishes(); // Refresh the list
      setIsFormVisible(false);
      setEditingDish(null);
    } catch (err) {
      setActionError(err.message);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDish = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este prato?')) {
      setLoading(true);
      setActionError(null);
      try {
        const response = await fetch(`${API_URL}/dishes/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao deletar prato.' }));
          throw new Error(errorData.message);
        }
        fetchDishes(); // Refresh the list
      } catch (err) {
        setActionError(err.message);
        setTimeout(() => setActionError(null), 5000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditDish = (dish) => {
    setEditingDish(dish);
    setIsFormVisible(true);
  };

  const handleAddDish = () => {
    setEditingDish(null);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingDish(null);
  };

  if (loading) return <div className="text-center p-8">Carregando pratos...</div>;
  if (error) return <div className="text-center text-red-500 p-8">Erro: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestão de Cardápio</h1>
      <button
        onClick={handleAddDish}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Adicionar Novo Prato
      </button>

      {actionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{actionError}</span>
        </div>
      )}

      {isFormVisible && (
        <DishForm
          dish={editingDish}
          onSave={handleSaveDish}
          onCancel={handleCancelForm}
        />
      )}

      <DishTable
        dishes={dishes}
        onEdit={handleEditDish}
        onDelete={handleDeleteDish}
      />
    </div>
  );
};

export default DishManagement;

