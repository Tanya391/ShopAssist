import { GoogleGenAI } from '@google/genai';

let aiInstance = null;

function getAI() {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

/**
 * Generates vector embedding for a single text chunk using Google Generative AI
 */
export async function getEmbedding(text) {
  const ai = getAI();
  if (!ai) {
    return generateSimpleEmbedding(text);
  }

  try {
    const res = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text
    });

    const vector = res.embedding?.values || res.embeddings?.[0]?.values;
    if (vector && vector.length > 0) {
      return vector;
    }
  } catch (err) {
    console.warn('[Embeddings] Gemini embedding API call failed, using fallback:', err);
  }

  return generateSimpleEmbedding(text);
}

/**
 * Batch embedding generator for multiple text chunks
 */
export async function getEmbeddings(texts) {
  return Promise.all(texts.map(t => getEmbedding(t)));
}

/**
 * Simple hash-based fallback embedding vector (dimension 768)
 */
function generateSimpleEmbedding(text) {
  const DIM = 768;
  const vector = new Array(DIM).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const index = Math.abs(hash) % DIM;
    vector[index] += 1 / (i + 1);
  }

  // Normalize vector to unit length
  let norm = 0;
  for (let i = 0; i < DIM; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < DIM; i++) vector[i] /= norm;
  }

  return vector;
}
