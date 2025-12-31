import React, { useEffect, useRef, useState } from 'react';

const Notification = ({ message, type = 'success', onClear }) => {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!message) return;
    if (isHovered) return; // pausa o timer ao passar o mouse

    timerRef.current = setTimeout(() => {
      onClear();
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, isHovered, onClear]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClear]);

  if (!message) return null;

  const colorByType = {
    success: {
      bg: 'bg-green-600',
      ring: 'focus:ring-offset-green-600',
      title: 'Sucesso',
    },
    error: {
      bg: 'bg-red-600',
      ring: 'focus:ring-offset-red-600',
      title: 'Erro',
    },
    warning: {
      bg: 'bg-yellow-600',
      ring: 'focus:ring-offset-yellow-600',
      title: 'Aviso',
    },
    info: {
      bg: 'bg-blue-600',
      ring: 'focus:ring-offset-blue-600',
      title: 'Info',
    },
  };
  const colors = colorByType[type] || colorByType.success;

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className={`fixed right-4 top-20 z-50 max-w-sm w-[90vw] sm:w-auto ${colors.bg} text-white p-4 rounded-lg shadow-lg pointer-events-auto motion-safe:animate-bounce motion-reduce:animate-none`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{colors.title}</p>
          <p className="break-words">{message}</p>
        </div>
        <button
          type="button"
          aria-label="Fechar notificação"
          className={`ml-2 inline-flex items-center justify-center rounded-md/none rounded bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${colors.ring} p-1`}
          onClick={onClear}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Notification;

