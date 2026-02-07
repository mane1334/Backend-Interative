// Ajuste aqui para o seu ambiente:
// - Emulador Android: use '10.0.2.2'
// - Dispositivo físico na mesma rede: use o IP local do seu PC, ex: '192.168.1.50'
// - iOS Simulator: geralmente 'localhost' funciona

import { Platform } from 'react-native';
import Config from 'react-native-config';

const DEFAULT_HOST = Platform.select({
  ios: 'localhost',
  android: '10.0.2.2',
  default: 'localhost',
});

const HOST = Config.HOST || DEFAULT_HOST; // Prioritize env var, fallback to default
const PORT = 3000;

export const BASE_URL = `http://${HOST}:${PORT}`;
export const API_URL = `${BASE_URL}/api`;
export const WS_URL = `ws://${HOST}:${PORT}`;


