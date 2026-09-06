import { GoogleGenAI } from '@google/genai';

let _clientInstance = null;
let circuitBreakerOpenUntil = 0;
let requestQueue = [];
let activeRequests = 0;

// Configuration with safe parsing
const parsePositiveInt = (val, defaultVal) => {
  const parsed = parseInt(val, 10);
  return (isNaN(parsed) || parsed <= 0) ? defaultVal : parsed;
};

const parseNonNegativeInt = (val, defaultVal) => {
  const parsed = parseInt(val, 10);
  return (isNaN(parsed) || parsed < 0) ? defaultVal : parsed;
};

const getConcurrencyLimit = () => parsePositiveInt(process.env.GEMINI_MAX_CONCURRENT_REQUESTS, 2);
const getRetryAttempts = () => parseNonNegativeInt(process.env.GEMINI_RETRY_ATTEMPTS, 2);
const getRetryBaseMs = () => parseNonNegativeInt(process.env.GEMINI_RETRY_BASE_DELAY_MS, 1000);
const getCircuitCooldownMs = () => parseNonNegativeInt(process.env.GEMINI_CIRCUIT_COOLDOWN_MS, 300000);
const getMaxQueueSize = () => parsePositiveInt(process.env.GEMINI_MAX_QUEUE_SIZE, 20);
export function __setTestClient(mockClient) {
  _clientInstance = mockClient;
  circuitBreakerOpenUntil = 0;
  requestQueue = [];
  activeRequests = 0;
}

function getGeminiClient() {
  if (!_clientInstance && process.env.GEMINI_API_KEY) {
    try {
      _clientInstance = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client');
    }
  }
  return _clientInstance;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function classifyGeminiError(error) {
  // Extract error info safely
  const status = error.status || error.code || 500;
  const message = (error.message || '').toLowerCase();
  
  // A. DAILY QUOTA EXHAUSTION
  if (
    message.includes('quota exceeded for metric') || 
    message.includes('quota_exceeded') ||
    (status === 429 && message.includes('quota')) ||
    (status === 'RESOURCE_EXHAUSTED' && message.includes('quota'))
  ) {
    return 'DAILY_QUOTA_EXHAUSTED';
  }

  // B. TEMPORARY RATE LIMIT
  if (
    status === 429 || 
    status === 'RESOURCE_EXHAUSTED' || 
    message.includes('rate_limit_exceeded') ||
    message.includes('too many requests')
  ) {
    return 'TEMPORARY_RATE_LIMIT';
  }

  // C. TRANSIENT SERVER ERROR
  if (status === 500 || status === 503 || status === 502 || status === 504) {
    return 'TRANSIENT_SERVER_ERROR';
  }

  // D. NON-RETRYABLE CLIENT ERROR
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return 'NON_RETRYABLE_CLIENT_ERROR';
  }

  // Default to non-retryable if unknown to prevent infinite retries of permanent errors
  return 'NON_RETRYABLE_CLIENT_ERROR';
}

let requestTimestamps = [];

function isRateLimitEnabled() {
  return process.env.GEMINI_RATE_LIMIT_ENABLED === 'true';
}

function getRpmLimit() {
  return parsePositiveInt(process.env.GEMINI_RPM_LIMIT, 10);
}

function getQueueTimeoutMs() {
  return parsePositiveInt(process.env.GEMINI_QUEUE_TIMEOUT_MS, 60000); // Default 60s
}

function processQueue() {
  if (requestQueue.length === 0) return;

  // Enforce RPM Limit using a 1-minute rolling window
  if (isRateLimitEnabled()) {
    const now = Date.now();
    requestTimestamps = requestTimestamps.filter(t => now - t < 60000);

    const rpmLimit = getRpmLimit();
    if (requestTimestamps.length >= rpmLimit) {
      // We hit the RPM limit. Calculate wait time until the oldest request expires.
      const timeToWait = 60000 - (now - requestTimestamps[0]);
      setTimeout(processQueue, timeToWait + 50); // Add 50ms buffer
      return; // Stop processing for now
    }
  }

  while (
    requestQueue.length > 0 &&
    activeRequests < getConcurrencyLimit()
  ) {
    // Only proceed if RPM limit allows another request this cycle
    if (isRateLimitEnabled() && requestTimestamps.length >= getRpmLimit()) {
      break; 
    }

    const { task, resolve, reject, enqueuedAt } = requestQueue.shift();

    // Check Queue Timeout
    if (Date.now() - enqueuedAt > getQueueTimeoutMs()) {
      const timeoutErr = new Error('Request timed out in queue.');
      timeoutErr.code = 'QUEUE_TIMEOUT';
      reject(timeoutErr);
      continue; // Skip this request and move to the next
    }

    activeRequests++;
    
    if (isRateLimitEnabled()) {
      requestTimestamps.push(Date.now());
    }

    executeWithRetries(task)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeRequests--;
        processQueue();
      });
  }
}

async function executeWithRetries(task) {
  let attempts = 0;
  const maxAttempts = getRetryAttempts() + 1; // 1 initial + retries

  while (attempts < maxAttempts) {
    attempts++;
    
    // Check Circuit Breaker inside execution 
    // (This acts as a protection mechanism. It does NOT mean the daily quota itself has reset)
    if (Date.now() < circuitBreakerOpenUntil) {
      const err = new Error('Daily Quota Exhausted. Circuit Breaker Open.');
      err.code = 'QUOTA_EXHAUSTED';
      throw err;
    }

    try {
      return await task();
    } catch (error) {
      const errorCategory = classifyGeminiError(error);

      if (errorCategory === 'DAILY_QUOTA_EXHAUSTED') {
        const cooldownMs = getCircuitCooldownMs();
        console.warn(`[GeminiClient] Daily quota exhausted! Opening circuit breaker for ${cooldownMs}ms.`);
        
        // This cooldown is a temporary stop-gap to prevent rapid looping.
        // It does NOT mean the quota resets after this period.
        circuitBreakerOpenUntil = Date.now() + cooldownMs;
        
        const quotaErr = new Error('Daily Quota Exhausted');
        quotaErr.code = 'QUOTA_EXHAUSTED';
        throw quotaErr;
      }

      if (errorCategory === 'NON_RETRYABLE_CLIENT_ERROR') {
        console.warn(`[GeminiClient] Non-retryable error (Status: ${error.status || error.code}). Aborting.`);
        throw error;
      }

      // Transient errors (TEMPORARY_RATE_LIMIT, TRANSIENT_SERVER_ERROR)
      if (attempts >= maxAttempts) {
        console.warn(`[GeminiClient] Request failed after ${attempts} attempts (Category: ${errorCategory}).`);
        throw error;
      }

      // Exponential backoff with jitter
      const delayMs = getRetryBaseMs() * Math.pow(2, attempts - 1) + Math.random() * 500;
      console.warn(`[GeminiClient] Transient error (${errorCategory}). Retrying in ${Math.round(delayMs)}ms (Attempt ${attempts} of ${maxAttempts})...`);
      await sleep(delayMs);
    }
  }
}

/**
 * Safely generates content using Gemini, managing concurrency, bounded retries,
 * and daily quota circuit breaking.
 */
export async function generateGeminiContent(request) {
  const ai = getGeminiClient();
  
  if (!ai) {
    const err = new Error('Gemini Client not initialized (Missing API Key).');
    err.code = 'CLIENT_MISSING';
    throw err;
  }

  // Circuit check before queueing
  if (Date.now() < circuitBreakerOpenUntil) {
    const err = new Error('Daily Quota Exhausted. Circuit Breaker Open.');
    err.code = 'QUOTA_EXHAUSTED';
    throw err;
  }

  // Queue Limit Check
  if (requestQueue.length >= getMaxQueueSize()) {
    const err = new Error('Gemini Request Queue Full');
    err.code = 'GEMINI_QUEUE_FULL';
    throw err;
  }

  return new Promise((resolve, reject) => {
    requestQueue.push({
      enqueuedAt: Date.now(),
      task: async () => {
        // Enforce configured model
        const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
        return ai.models.generateContent({ ...request, model });
      },
      resolve,
      reject
    });
    
    processQueue();
  });
}
