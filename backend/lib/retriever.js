import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PineconeStore } from '@langchain/pinecone';
import { getPineconeIndex } from './pinecone.js';

let pineconeVectorStore = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_STATE_FILE = path.join(__dirname, '.index-state.json');

function getIndexState() {
  try {
    if (fs.existsSync(INDEX_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(INDEX_STATE_FILE, 'utf-8'));
    }
  } catch(e) { 
    console.error('[Indexer] Failed to parse index state', e.message); 
  }
  return {};
}

function saveIndexState(state) {
  fs.writeFileSync(INDEX_STATE_FILE, JSON.stringify(state, null, 2));
}

function getHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function getVectorStore() {
  if (pineconeVectorStore) return pineconeVectorStore;

  const pineconeIndex = getPineconeIndex();
  if (!pineconeIndex) return null;

  // Monkey-patch to fix LangChain PineconeStore compatibility with Pinecone v8
  const originalNamespace = pineconeIndex.namespace.bind(pineconeIndex);
  pineconeIndex.namespace = (ns) => {
    const namespaceObj = originalNamespace(ns);
    const originalUpsert = namespaceObj.upsert.bind(namespaceObj);
    namespaceObj.upsert = async (options) => {
      if (Array.isArray(options)) {
        return originalUpsert({ records: options });
      }
      return originalUpsert(options);
    };
    return namespaceObj;
  };

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: 'gemini-embedding-2-preview',
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    maxRetries: 0
  });

  pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex
  });

  return pineconeVectorStore;
}

export function loadMarkdownKnowledgeDocs() {
  const kbDir = path.join(__dirname, '..', 'knowledge-base');
  const docs = [];

  if (!fs.existsSync(kbDir)) {
    console.warn(`[DocumentLoader] Directory ${kbDir} does not exist.`);
    return docs;
  }

  const files = fs.readdirSync(kbDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(kbDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract title from first H1 heading or fallback to filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const docTitle = titleMatch
        ? titleMatch[1].trim()
        : file.replace('.md', '').replace(/-/g, ' ');

      docs.push({ fileName: file, docTitle, content });
    }
  }

  return docs;
}

export async function indexSingleDocumentToPinecone(fileName, docTitle, content) {
  const store = await getVectorStore();
  if (!store) {
    console.warn('[RAG Pipeline] Pinecone not configured. Skipping indexing.');
    return 0;
  }
  
  const state = getIndexState();
  const fileHash = getHash(content);
  
  const existingRecord = state[fileName];
  if (existingRecord && existingRecord.hash === fileHash) {
    console.log(`[Indexer] Skipping ${fileName}, content unchanged.`);
    return 0; // Unchanged
  }

  // Delete stale vectors if any exist for this document
  if (existingRecord && existingRecord.chunkCount > 0) {
    const idsToDelete = [];
    for (let i = 0; i < existingRecord.chunkCount; i++) {
      idsToDelete.push(`${fileName}-chunk-${i}`);
    }
    const pineconeIndex = getPineconeIndex();
    if (pineconeIndex) {
      try {
        await pineconeIndex.deleteMany(idsToDelete);
        console.log(`[Indexer] Deleted ${idsToDelete.length} stale chunks for ${fileName}`);
      } catch (err) {
        console.warn(`[Indexer] Failed to delete stale chunks for ${fileName}:`, err.message);
      }
    }
  }

  const doc = new Document({
    pageContent: content,
    metadata: { fileName, docTitle }
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 100,
    separators: ['\n## ', '\n### ', '\n\n', '\n', ' ']
  });

  const chunkedDocs = await splitter.splitDocuments([doc]);
  
  const docsWithIds = chunkedDocs.map((chunk, i) => {
    chunk.id = `${fileName}-chunk-${i}`;
    chunk.metadata.chunkIndex = i;
    chunk.metadata.text = chunk.pageContent; 
    return chunk;
  });

  if (docsWithIds.length > 0) {
    try {
      console.log(`[Indexer] Embedding and indexing ${chunkedDocs.length} chunks for ${fileName}...`);
      await store.addDocuments(docsWithIds, { ids: docsWithIds.map(d => d.id) });
      console.log(`[Indexer] Successfully indexed ${fileName}.`);
      
      // Update state
      state[fileName] = { hash: fileHash, chunkCount: chunkedDocs.length };
      saveIndexState(state);
      
      return chunkedDocs.length;
    } catch (err) {
      console.warn(`[Indexer] Failed to index ${fileName}:`, err.message);
      return 0;
    }
  } else {
    // If empty document, just record it as 0 chunks
    state[fileName] = { hash: fileHash, chunkCount: 0 };
    saveIndexState(state);
    return 0;
  }
}

export async function indexKnowledgeBaseToPinecone() {
  const store = await getVectorStore();
  if (!store) {
    console.warn('[RAG Pipeline] Pinecone not configured. Skipping indexing.');
    return 0;
  }

  const rawDocs = loadMarkdownKnowledgeDocs();
  if (rawDocs.length === 0) return 0;

  let totalIndexed = 0;
  for (const doc of rawDocs) {
    const count = await indexSingleDocumentToPinecone(doc.fileName, doc.docTitle, doc.content);
    totalIndexed += count;
  }
  
  return totalIndexed;
}

export async function retrieveRelevantChunks(userQuery, topK = 3) {
  const store = await getVectorStore();
  if (!store) {
    console.warn('[RAG Pipeline] Pinecone not configured. Returning empty context.');
    return [];
  }

  try {
    const results = await store.similaritySearchWithScore(userQuery, topK);

    return results.map(([doc, score]) => ({
      chunkId: doc.id || 'unknown',
      docId: doc.id || 'unknown',
      id: doc.id || 'unknown',
      fileName: doc.metadata.fileName || 'unknown.md',
      docTitle: doc.metadata.docTitle || 'Policy Document',
      text: doc.pageContent,
      similarityScore: score !== undefined ? score : null 
    }));
  } catch (err) {
    console.warn('[RAG Pipeline] Retrieval failed:', err.message);
    return [];
  }
}

export function buildGroundedRAGPrompt(userQuery, chunks) {
  const contextStr = chunks
    .map((c, i) => `[Source ${i + 1}: ${c.docTitle} (${c.fileName})]\n${c.text}`)
    .join('\n\n');

  return `You are ShopAssist AI, a helpful and accurate e-commerce customer support representative.

Strict Instructions:
1. Answer the customer's query strictly based on the provided company policy excerpts below.
2. If the context does not contain enough information to answer the query, clearly state what information is missing and politely offer to transfer or create a support ticket.
3. Be concise, polite, professional, and clear. Use bullet points or bold text where appropriate.

--- RETRIEVED KNOWLEDGE CONTEXT ---
${contextStr}
-----------------------------------

Customer Query: ${userQuery}

Grounded Response:`;
}
