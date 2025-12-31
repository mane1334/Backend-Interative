import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import { toast } from 'react-toastify';

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Olá! Sou seu assistente virtual. Pergunte-me sobre os pratos do cardápio!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const userMessage = inputValue.trim();
    if (!userMessage) return;

    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userMessage);
      setMessages(prev => [...prev, { sender: 'ai', text: response.reply }]);
    } catch (error) {
      toast.error('Desculpe, não consegui me conectar ao assistente.');
      setMessages(prev => [...prev, { sender: 'ai', text: 'Ocorreu um erro. Tente novamente mais tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <div className="fixed right-4 bottom-6 sm:right-8 sm:bottom-8 z-50">
        <button 
          onClick={toggleChat}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 w-16 h-16 flex items-center justify-center group"
          aria-label="Abrir chat com assistente"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {/* Notification dot */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse border-2 border-white"></div>
            </>
          )}
        </button>
        
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            🤖 Assistente Virtual
          </div>
        )}
      </div>

      {/* Janela do Chat */}
      <div className={`fixed right-4 bottom-24 sm:right-8 sm:bottom-28 z-40 w-80 sm:w-96 h-[460px] sm:h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transform transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'} origin-bottom-right`}>
        {/* Cabeçalho */}
        <div className="bg-gray-800 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="text-xl font-bold">Assistente Virtual</h3>
          <button onClick={toggleChat} className="text-gray-300 hover:text-white">&times;</button>
        </div>

        {/* Mensagens */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg text-white max-w-xs ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-red-600'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="p-3 rounded-lg bg-gray-300">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <div className="flex items-center gap-2">
            <input 
              type="text"
              placeholder={isLoading ? 'Aguarde...' : 'Digite sua pergunta...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            />
            <button type="submit" disabled={isLoading} className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-red-700 transition-colors disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chat;