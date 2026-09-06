import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;

export function getPineconeClient() {
  if (!pineconeClient && process.env.PINECONE_API_KEY) {
    try {
      pineconeClient = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });
    } catch (err) {
      console.warn('[Pinecone] Failed to initialize Pinecone client:', err);
    }
  }
  return pineconeClient;
}

export function getPineconeIndex() {
  const client = getPineconeClient();
  if (client) {
    const indexName = process.env.PINECONE_INDEX || 'shopassist-kb';
    return client.Index(indexName);
  }
  return null;
}
