import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [error, setError] = useState('');

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar categorias.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        if (!newCategoryName.trim()) return;

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, { name: newCategoryName });
            } else {
                await createCategory({ name: newCategoryName });
            }
            setNewCategoryName('');
            setEditingCategory(null);
            fetchCategories();
        } catch (err) {
            console.error(err);
            setError('Erro ao salvar categoria. Verifique se o nome já existe.');
        }
    };

    const handleEdit = (cat) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.name);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza? Isso pode afetar pratos vinculados a esta categoria.')) return;
        try {
            await deleteCategory(id);
            fetchCategories();
        } catch (err) {
            console.error(err);
            setError('Erro ao deletar categoria.');
        }
    };

    const handleCancel = () => {
        setEditingCategory(null);
        setNewCategoryName('');
        setError('');
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gerenciar Categorias</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                <form onSubmit={handleSave} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ex: Bebidas"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newCategoryName.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {editingCategory ? 'Atualizar' : 'Adicionar'}
                    </button>
                    {editingCategory && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                    )}
                </form>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={3} className="text-center py-4">Carregando...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={3} className="text-center py-4 text-gray-500">Nenhuma categoria encontrada.</td></tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{cat.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(cat)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                                        <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoryManagement;
