/**
 * Utilitários para formatação de moeda em Metical (MZN)
 * Formato moçambicano: MT 1.234,56
 */

/**
 * Formata um valor numérico para Metical
 * @param {number|string} value - Valor a ser formatado
 * @param {boolean} showSymbol - Se deve mostrar o símbolo MT (padrão: true)
 * @returns {string} Valor formatado em Metical
 */
export const formatMetical = (value, showSymbol = true) => {
  if (!value || isNaN(value)) {
    return showSymbol ? 'MT 0,00' : '0,00';
  }

  const numericValue = parseFloat(value);
  
  // Formata para 2 casas decimais e substitui ponto por vírgula
  const formattedValue = numericValue.toFixed(2).replace('.', ',');
  
  // Adiciona separadores de milhares
  const parts = formattedValue.split(',');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  const result = parts.join(',');
  
  return showSymbol ? `MT ${result}` : result;
};

/**
 * Formata um valor para exibição em tabelas (sem símbolo)
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado sem símbolo
 */
export const formatMeticalTable = (value) => {
  return formatMetical(value, false);
};

/**
 * Formata um valor para exibição em cards/dashboard (com símbolo)
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado com símbolo
 */
export const formatMeticalDisplay = (value) => {
  return formatMetical(value, true);
};

/**
 * Converte um valor de Metical para número
 * @param {string} meticalString - String formatada em Metical (ex: "MT 1.234,56")
 * @returns {number} Valor numérico
 */
export const parseMetical = (meticalString) => {
  if (!meticalString) return 0;
  
  // Remove o símbolo MT e espaços
  const cleanString = meticalString.replace(/MT\s*/g, '');
  
  // Substitui vírgula por ponto e remove pontos de milhares
  const numericString = cleanString.replace(/\./g, '').replace(',', '.');
  
  return parseFloat(numericString) || 0;
};

/**
 * Formata um valor para input de formulário
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} Valor formatado para input
 */
export const formatMeticalInput = (value) => {
  if (!value || isNaN(value)) return '';
  
  const numericValue = parseFloat(value);
  return numericValue.toFixed(2);
};

const currencyUtils = {
  formatMetical,
  formatMeticalTable,
  formatMeticalDisplay,
  parseMetical,
  formatMeticalInput
};

export default currencyUtils;
