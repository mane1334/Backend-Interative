import React, { useState, useEffect } from 'react';
import { resolveImageUrl, PLACEHOLDER_IMG } from '../utils/images';
import { uploadImage } from '../services/api';

const DishForm = ({ dish, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: 1, // Exemplo, idealmente seria um select
    image_url: '',
    is_available: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (dish) {
      setFormData(dish);
    } else {
      // Reset form for new dish
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: 1,
        image_url: '',
        is_available: true,
      });
    }
  }, [dish]);

  // Fechar com ESC e bloquear scroll do body enquanto o modal estiver aberto
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    try {
      document.body.style.overflow = 'hidden';
    } catch {}
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      try { document.body.style.overflow = ''; } catch {}
    };
  }, [onCancel]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const nextValue = type === 'checkbox' ? checked : value;
      // Precedência: se já há um caminho local ("/...") e o usuário digitar uma URL externa,
      // mantém o caminho local.
      if (
        name === 'image_url' &&
        typeof nextValue === 'string' &&
        nextValue &&
        !nextValue.startsWith('/') &&
        typeof prev.image_url === 'string' &&
        prev.image_url.startsWith('/')
      ) {
        return prev;
      }
      return {
        ...prev,
        [name]: nextValue,
      };
    });
    // validação ao digitar
    const nextErrors = { ...formErrors };
    if (name === 'name') {
      if (!value || (typeof value === 'string' && value.trim().length < 2)) nextErrors.name = 'Informe um nome válido.'; else delete nextErrors.name;
    }
    if (name === 'price') {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0) nextErrors.price = 'Preço deve ser maior que 0.'; else delete nextErrors.price;
    }
    setFormErrors(nextErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name) errors.name = 'Nome é obrigatório.';
    if (!formData.price || formData.price <= 0) errors.price = 'Preço deve ser um número positivo.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const toSave = {
      ...formData,
      name: formData.name.trim(),
      image_url: (formData.image_url || '').trim(),
    };
    try {
      setSaving(true);
      setSaveStatus(null);
      await onSave(toSave);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const { path } = await uploadImage(file);
      // Ao enviar arquivo, sempre priorizar o caminho local retornado
      setFormData(prev => ({
        ...prev,
        image_url: path || prev.image_url,
      }));
    } catch (err) {
      console.error('Erro no upload da imagem:', err);
      setUploadError('Falha ao enviar a imagem. Tente novamente.');
    } finally {
      setUploading(false);
      // permite reenviar o mesmo arquivo caso o usuário selecione o mesmo nome
      try { e.target.value = ''; } catch (_) {}
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50" onClick={onCancel}>
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg sm:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col sm:rounded-lg sm:h-auto h-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 p-4 border-b flex items-start gap-3">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded bg-blue-50 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" 
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold pr-8">{dish ? 'Editar Prato' : 'Adicionar Prato'}</h2>
            <p className="text-gray-600 mt-1 text-sm">Preencha os detalhes do prato e defina a disponibilidade.</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <form id="dish-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coluna esquerda */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Ex.: Frango Grelhado"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Descrição</label>
                  <textarea
                    name="description"
                    placeholder="Breve descrição do prato"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Preço</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.price && <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>}
                </div>
              </div>

              {/* Coluna direita */}
              <div className="space-y-4">
                <label className="flex items-center w-full p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <span className="text-gray-700 font-medium">Disponível no cardápio</span>
                </label>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">URL da Imagem</label>
                  <input
                    type="text"
                    name="image_url"
                    placeholder="https://... ou /uploads/imagem.jpg"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Aceita URL absoluta ou caminho relativo (ex.: /uploads/...)</p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Enviar arquivo de imagem</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploading && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        Enviando...
                      </div>
                    )}
                    {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                    <p className="text-sm text-gray-500">Ao enviar um arquivo, o caminho local gerado terá prioridade sobre URLs externas.</p>
                  </div>
                </div>

                {formData.image_url && (
                  <div>
                    <span className="block text-sm text-gray-500 mb-2">Pré-visualização</span>
                    <img
                      src={resolveImageUrl(formData.image_url)}
                      alt="Pré-visualização"
                      className="h-32 w-32 object-cover rounded-lg border shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMG;
                        try { window.dispatchEvent(new CustomEvent('admin:toast', { detail: { type: 'error', message: 'Falha ao carregar a imagem. Verifique a URL.' } })); } catch {}
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
        <div className="flex-shrink-0 p-6 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="dish-form"
              disabled={saving || Object.keys(formErrors).length > 0}
              className={`px-6 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${saving || Object.keys(formErrors).length > 0 ? 'bg-blue-300 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {saveStatus === 'success' && (
            <div className="mt-3 text-sm text-green-700">Prato salvo com sucesso.</div>
          )}
          {saveStatus === 'error' && (
            <div className="mt-3 text-sm text-red-700">Falha ao salvar o prato. Tente novamente.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishForm;
