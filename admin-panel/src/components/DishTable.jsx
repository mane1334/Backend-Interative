import React, { useMemo, useState, useEffect } from 'react';
import { resolveImageUrl, PLACEHOLDER_IMG } from '../utils/images';
import { formatMeticalDisplay } from '../utils/currency';

const SortIcon = ({ active, dir }) => (
  <svg className={`w-3 h-3 ml-1 inline ${active ? 'text-gray-700' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
    {dir === 'asc' ? (
      <path d="M3 12l7-8 7 8H3z" />
    ) : (
      <path d="M17 8l-7 8-7-8h14z" />
    )}
  </svg>
);

const DishTable = ({ dishes, onEdit, onDelete }) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setPage(1); }, [query, dishes]);
  useEffect(() => {
    // Ajusta página se reduzir pageSize e a página atual ficar fora do range
    setPage(p => Math.max(1, Math.min(p, Math.ceil((filtered.length || 1) / pageSize))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dishes;
    return dishes.filter(d => (d.name || '').toLowerCase().includes(q));
  }, [dishes, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dirMul = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case 'price':
          va = parseFloat(a.price || 0);
          vb = parseFloat(b.price || 0);
          break;
        case 'is_available':
          va = a.is_available ? 1 : 0;
          vb = b.is_available ? 1 : 0;
          break;
        case 'name':
        default:
          va = (a.name || '').toLowerCase();
          vb = (b.name || '').toLowerCase();
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

  const renderHeader = (label, key, align = 'left') => (
    <th className={`py-2 px-4 border-b ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button onClick={() => requestSort(key)} className="flex items-center select-none">
        <span>{label}</span>
        <SortIcon active={sortKey === key} dir={sortKey === key ? sortDir : 'asc'} />
      </button>
    </th>
  );

  if (!dishes || dishes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-md">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <p className="text-gray-500">Nenhum prato cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="text-sm text-gray-500">Total: {dishes.length}</div>
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
            placeholder="Pesquisar prato..."
            className="w-full max-w-xs p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">Nenhum prato corresponde à pesquisa.</p>
        </div>
      ) : (
        <>
          <table className="min-w-full bg-white">
            <thead>
              <tr className="text-left">
                <th className="py-2 px-4 border-b">Imagem</th>
                {renderHeader('Nome', 'name')}
                {renderHeader('Preço', 'price')}
                {renderHeader('Disponível', 'is_available')}
                <th className="py-2 px-4 border-b">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(dish => (
                <tr key={dish.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    <div className="h-12 w-12 overflow-hidden rounded group">
                      <img
                        src={dish.image_url ? resolveImageUrl(dish.image_url) : PLACEHOLDER_IMG}
                        alt={dish.name}
                        className="h-12 w-12 object-cover transition-transform duration-200 group-hover:scale-110"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
                      />
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b font-medium text-gray-800">
                    <div className="max-w-[240px] truncate" title={dish.name}>{dish.name}</div>
                  </td>
                  <td className="py-2 px-4 border-b text-gray-700 font-mono">{formatMeticalDisplay(dish.price)}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${dish.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {dish.is_available ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button onClick={() => onEdit(dish)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2">Editar</button>
                    <button onClick={() => onDelete(dish.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Deletar</button>
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

export default DishTable;
