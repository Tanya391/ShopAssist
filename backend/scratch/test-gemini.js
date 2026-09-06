import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function testGemini() {
  console.log('Initializing Gemini client...');
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const modelName = 'gemini-3.6-flash';
  console.log('Selected model:', modelName);
  console.log('API Key exists:', Boolean(process.env.GEMINI_API_KEY));

  try {
    console.log(`\nCalling generateContent with ${modelName}...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Reply with exactly: GEMINI_CONNECTION_OK'
    });
    console.log('HTTP/API Result: SUCCESS');
    console.log('Generated response:', response.text);
  } catch (error) {
    console.error('HTTP/API Result: FAILED');
    console.error('Error with model', modelName, ':', error.message);
    if (error.status) console.error('Status:', error.status);
    if (error.code) console.error('Code:', error.code);
  }
}

testGemini();
