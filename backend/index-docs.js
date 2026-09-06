import 'dotenv/config';
import { indexKnowledgeBaseToPinecone } from './lib/retriever.js';
import { prisma } from './lib/prisma.js';

async function runIndex() {
  console.log('[Pinecone] Starting knowledge base indexing...');
  try {
    const chunkCount = await indexKnowledgeBaseToPinecone();
    console.log('[Pinecone] Successfully indexed ' + chunkCount + ' chunks.');
    process.exit(0);
  } catch (err) {
    console.error('[Pinecone] Indexing failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runIndex();