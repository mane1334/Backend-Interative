import React, { useState, useEffect } from 'react';
import { resolveImageUrl, PLACEHOLDER_IMG } from '../utils/images';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AdManagement = () => {
  const [ads, setAds] = useState([]);
  const [editingAd, setEditingAd] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch(`${API_URL}/ads`);
      if (!response.ok) {
        throw new Error('Erro ao buscar anúncios.');
      }
      const data = await response.json();
      setAds(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAd = async (adData) => {
    setLoading(true);
    setActionError(null);
    try {
      let response;
      if (adData.id) {
        // Update existing ad
        response = await fetch(`${API_URL}/ads/${adData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adData),
        });
      } else {
        // Add new ad
        response = await fetch(`${API_URL}/ads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao salvar anúncio.' }));
        throw new Error(errorData.message);
      }
      await response.json();
      fetchAds(); // Refresh the list
      setIsFormVisible(false);
      setEditingAd(null);
    } catch (err) {
      setActionError(err.message);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar este anúncio?')) {
      setLoading(true);
      setActionError(null);
      try {
        const response = await fetch(`${API_URL}/ads/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao deletar anúncio.' }));
          throw new Error(errorData.message);
        }
        fetchAds(); // Refresh the list
      } catch (err) {
        setActionError(err.message);
        setTimeout(() => setActionError(null), 5000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    setIsFormVisible(true);
  };

  const handleAddAd = () => {
    setEditingAd(null);
    setIsFormVisible(true);
  };

  const handleCancelForm = () => {
    setIsFormVisible(false);
    setEditingAd(null);
  };

  if (loading) return <div className="text-center p-8">Carregando anúncios...</div>;
  if (error) return <div className="text-center text-red-500 p-8">Erro: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestão de Anúncios</h1>
      <button
        onClick={handleAddAd}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Adicionar Novo Anúncio
      </button>

      {actionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{actionError}</span>
        </div>
      )}

      {isFormVisible && (
        <AdForm
          ad={editingAd}
          onSave={handleSaveAd}
          onCancel={handleCancelForm}
        />
      )}

      <AdTable
        ads={ads}
        onEdit={handleEditAd}
        onDelete={handleDeleteAd}
      />
    </div>
  );
};

const AdForm = ({ ad, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  useEffect(() => {
    if (ad) {
      setFormData({
        ...ad,
        start_date: ad.start_date ? new Date(ad.start_date).toISOString().split('T')[0] : '',
        end_date: ad.end_date ? new Date(ad.end_date).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        image_url: '',
        start_date: '',
        end_date: '',
        is_active: true,
      });
    }
  }, [ad]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // validação ao digitar
    const next = { ...formErrors };
    if (name === 'title') {
      if (!value || (typeof value === 'string' && value.trim().length < 3)) next.title = 'Título muito curto.'; else delete next.title;
    }
    if (name === 'content') {
      if (!value || (typeof value === 'string' && value.trim().length < 5)) next.content = 'Conteúdo muito curto.'; else delete next.content;
    }
    if (name === 'start_date' || name === 'end_date') {
      const { start_date, end_date } = { ...formData, [name]: value };
      if (!start_date) next.start_date = 'Data de início é obrigatória.'; else delete next.start_date;
      if (!end_date) next.end_date = 'Data de fim é obrigatória.'; else delete next.end_date;
      if (start_date && end_date && start_date > end_date) next.end_date = 'Fim deve ser após o início.';
    }
    setFormErrors(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.title) errors.title = 'Título é obrigatório.';
    if (!formData.content) errors.content = 'Conteúdo é obrigatório.';
    if (!formData.start_date) errors.start_date = 'Data de início é obrigatória.';
    if (!formData.end_date) errors.end_date = 'Data de fim é obrigatória.';
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.end_date = 'Data de fim deve ser posterior à data de início.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const toSave = {
      ...formData,
      title: formData.title.trim(),
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

  // ESC para fechar e bloquear scroll do body
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    try { document.body.style.overflow = 'hidden'; } catch {}
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      try { document.body.style.overflow = ''; } catch {}
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50" onClick={onCancel}>
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col sm:rounded-lg sm:max-w-3xl sm:h-auto h-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 p-6 border-b flex items-start gap-3">
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
            <h2 className="text-2xl font-bold pr-8">{ad ? 'Editar Anúncio' : 'Adicionar Anúncio'}</h2>
            <p className="text-gray-600 mt-1 text-sm">Defina título, conteúdo, vigência e visibilidade do anúncio.</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form id="ad-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Título</label>
              <input 
                type="text" 
                name="title" 
                placeholder="Ex.: Promoção do Fim de Semana"
                value={formData.title} 
                onChange={handleChange} 
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`} 
              />
              {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Conteúdo</label>
              <textarea 
                name="content" 
                placeholder="Mensagem do anúncio"
                value={formData.content} 
                onChange={handleChange} 
                rows={3}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${formErrors.content ? 'border-red-500' : 'border-gray-300'}`}
              ></textarea>
              {formErrors.content && <p className="text-red-500 text-sm mt-1">{formErrors.content}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Data de Início</label>
                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.start_date ? 'border-red-500' : 'border-gray-300'}`} />
                {formErrors.start_date && <p className="text-red-500 text-sm mt-1">{formErrors.start_date}</p>}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Data de Fim</label>
                <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.end_date ? 'border-red-500' : 'border-gray-300'}`} />
                {formErrors.end_date && <p className="text-red-500 text-sm mt-1">{formErrors.end_date}</p>}
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">URL da Imagem</label>
              <input 
                type="text" 
                name="image_url" 
                placeholder="https://... ou /uploads/banner.jpg"
                value={formData.image_url} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
              <p className="text-sm text-gray-500 mt-1">Aceita URL absoluta ou caminho relativo (ex.: /uploads/...)</p>
            </div>
            <div className="flex items-end">
              <label className="flex items-center w-full p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <span className="text-gray-700 font-medium">Anúncio ativo</span>
              </label>
            </div>
            {formData.image_url && (
              <div className="mt-4">
                <span className="block text-sm text-gray-500 mb-2">Pré-visualização</span>
                <img
                  src={resolveImageUrl(formData.image_url)}
                  alt="Pré-visualização"
                  className="h-32 w-32 object-cover rounded-lg border shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMG;
                    try { window.dispatchEvent(new CustomEvent('admin:toast', { detail: { type: 'error', message: 'Falha ao carregar a imagem do anúncio.' } })); } catch {}
                  }}
                />
              </div>
            )}
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
              form="ad-form"
              disabled={saving || Object.keys(formErrors).length > 0}
              className={`px-6 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${saving || Object.keys(formErrors).length > 0 ? 'bg-blue-300 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {saveStatus === 'success' && (
            <div className="mt-3 text-sm text-green-700">Anúncio salvo com sucesso.</div>
          )}
          {saveStatus === 'error' && (
            <div className="mt-3 text-sm text-red-700">Falha ao salvar o anúncio. Tente novamente.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const SortIcon = ({ active, dir }) => (
  <svg className={`w-3 h-3 ml-1 inline ${active ? 'text-gray-700' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
    {dir === 'asc' ? (
      <path d="M3 12l7-8 7 8H3z" />
    ) : (
      <path d="M17 8l-7 8-7-8h14z" />
    )}
  </svg>
);

const AdTable = ({ ads, onEdit, onDelete }) => {
  const [query, setQuery] = React.useState('');
  const [sortKey, setSortKey] = React.useState('title');
  const [sortDir, setSortDir] = React.useState('asc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  React.useEffect(() => { setPage(1); }, [query, ads]);
  React.useEffect(() => {
    setPage(p => Math.max(1, Math.min(p, Math.ceil((filtered.length || 1) / pageSize))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ads;
    return ads.filter(a => (a.title || '').toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q));
  }, [ads, query]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const dirMul = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case 'start_date':
          va = a.start_date ? new Date(a.start_date).getTime() : 0;
          vb = b.start_date ? new Date(b.start_date).getTime() : 0;
          break;
        case 'end_date':
          va = a.end_date ? new Date(a.end_date).getTime() : 0;
          vb = b.end_date ? new Date(b.end_date).getTime() : 0;
          break;
        case 'is_active':
          va = a.is_active ? 1 : 0;
          vb = b.is_active ? 1 : 0;
          break;
        case 'title':
        default:
          va = (a.title || '').toLowerCase();
          vb = (b.title || '').toLowerCase();
      }
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = sorted.slice(startIdx, endIdx);

  const requestSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderHeader = (label, key) => (
    <th className="py-2 px-4 border-b text-left">
      <button onClick={() => requestSort(key)} className="flex items-center select-none">
        <span>{label}</span>
        <SortIcon active={sortKey === key} dir={sortKey === key ? sortDir : 'asc'} />
      </button>
    </th>
  );

  if (!ads || ads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-md">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <p className="text-gray-500">Nenhum anúncio cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="text-sm text-gray-500">Total: {ads.length}</div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Por página</label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="p-2 border rounded">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar anúncio..."
            className="w-full max-w-xs p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">Nenhum anúncio corresponde à pesquisa.</p>
        </div>
      ) : (
        <>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Imagem</th>
                {renderHeader('Título', 'title')}
                <th className="py-2 px-4 border-b text-left">Conteúdo</th>
                {renderHeader('Início', 'start_date')}
                {renderHeader('Fim', 'end_date')}
                {renderHeader('Ativo', 'is_active')}
                <th className="py-2 px-4 border-b text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(ad => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    <div className="h-12 w-12 overflow-hidden rounded group">
                      <img
                        src={ad.image_url ? resolveImageUrl(ad.image_url) : PLACEHOLDER_IMG}
                        alt={ad.title}
                        className="h-12 w-12 object-cover transition-transform duration-200 group-hover:scale-110"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                      />
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b font-medium text-gray-800">
                    <div className="max-w-[220px] truncate" title={ad.title}>{ad.title}</div>
                  </td>
                  <td className="py-2 px-4 border-b text-gray-700">
                    <div className="max-w-[280px] truncate" title={ad.content}>{ad.content}</div>
                  </td>
                  <td className="py-2 px-4 border-b">{ad.start_date ? new Date(ad.start_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{ad.end_date ? new Date(ad.end_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ad.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {ad.is_active ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button onClick={() => onEdit(ad)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2">Editar</button>
                    <button onClick={() => onDelete(ad.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Deletar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
            <div>
              Mostrando {total === 0 ? 0 : startIdx + 1}–{endIdx} de {total}
            </div>
            <div className="space-x-2">
              <button 
                className="px-3 py-1 border rounded disabled:opacity-50" 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={currentPage <= 1}
              >Anterior</button>
              <span>Página {currentPage} de {totalPages}</span>
              <button 
                className="px-3 py-1 border rounded disabled:opacity-50" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage >= totalPages}
              >Seguinte</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdManagement;

