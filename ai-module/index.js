import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Interage com o modelo de chat da OpenAI para responder a perguntas dos clientes.
 * @param {string} userMessage - A mensagem do usuário.
 * @param {object} menuContext - O cardápio atual para dar contexto ao modelo.
 * @returns {Promise<string>} - A resposta do assistente de IA.
 */
export async function getChatResponse(userMessage, menuContext) {
  const systemPrompt = `Você é um assistente de restaurante amigável e prestativo. Seu nome é Gêmeos. O cardápio de hoje é: ${JSON.stringify(menuContext)}. Responda às perguntas do cliente sobre os pratos, ingredientes, ou faça sugestões. Seja conciso e educado.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao comunicar com a API da OpenAI:', error);
    return 'Desculpe, não consigo responder no momento. Por favor, chame um de nossos garçons.';
  }
}

/**
 * Transcreve um arquivo de áudio usando a API Whisper da OpenAI.
 * @param {string} audioFilePath - O caminho para o arquivo de áudio.
 * @returns {Promise<string>} - O texto transcrito.
 */
export async function transcribeAudio(audioFilePath) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
    });
    return transcription.text;
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    return '';
  }
}

/**
 * Converte texto em fala usando uma API de TTS (placeholder).
 * Em um cenário real, aqui seria a integração com ElevenLabs, Google TTS, etc.
 * @param {string} text - O texto a ser convertido em fala.
 * @returns {Promise<string>} - O caminho para o arquivo de áudio gerado (ou um mock).
 */
export async function textToSpeech(text) {
  // Gera um arquivo mock para testes locais
  console.log(`Convertendo texto para fala: "${text}"`);
  const aiModuleDir = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
  const mockAudioPath = path.join(aiModuleDir, 'mock_audio.mp3');
  try {
    if (!fs.existsSync(mockAudioPath)) {
      // Cria um arquivo binário mínimo como placeholder
      fs.writeFileSync(mockAudioPath, Buffer.from('mock audio data'));
    }
  } catch (err) {
    console.error('Erro ao criar arquivo de áudio mock:', err);
  }
  return mockAudioPath;
}
