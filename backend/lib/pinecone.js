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

// In-memory vector database storage fallback for local/preview execution
const inMemoryVectorStore = [];

/**
 * Upsert records into Pinecone vector index (or local store)
 */
export async function upsertVectors(records) {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX || 'shopassist-kb';

  if (client) {
    try {
      const index = client.Index(indexName);
      await index.upsert(
        records.map(r => ({
          id: r.id,
          values: r.values,
          metadata: r.metadata
        }))
      );
      console.log(`[Pinecone] Successfully upserted ${records.length} vector records to index '${indexName}'.`);
      return;
    } catch (err) {
      console.warn('[Pinecone] Upsert failed, falling back to local vector store:', err);
    }
  }

  // Fallback in-memory store upsert
  for (const record of records) {
    const existingIdx = inMemoryVectorStore.findIndex(r => r.id === record.id);
    if (existingIdx !== -1) {
      inMemoryVectorStore[existingIdx] = record;
    } else {
      inMemoryVectorStore.push(record);
    }
  }
}

/**
 * Query Pinecone vector database for top-k nearest neighbors
 */
export async function queryVectorDatabase(queryVector, topK = 3) {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX || 'shopassist-kb';

  if (client) {
    try {
      const index = client.Index(indexName);
      const queryResponse = await index.query({
        vector: queryVector,
        topK,
        includeMetadata: true
      });

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        return queryResponse.matches.map(match => ({
          id: match.id,
          score: match.score || 0,
          metadata: match.metadata || {
            fileName: 'unknown.md',
            docTitle: 'Policy Document',
            text: '',
            chunkIndex: 0
          }
        }));
      }
    } catch (err) {
      console.warn('[Pinecone] Vector query failed, falling back to in-memory cosine search:', err);
    }
  }

  // Cosine Similarity search over in-memory store
  const scored = inMemoryVectorStore.map(record => {
    const score = computeCosineSimilarity(queryVector, record.values);
    return {
      id: record.id,
      score,
      metadata: record.metadata
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

function computeCosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dot / denominator : 0;
}
