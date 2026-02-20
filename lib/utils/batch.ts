/**
 * Batch processing utility with concurrency control
 */

export interface BatchProcessOptions {
  concurrency?: number;  // Maximum concurrent operations
  stopOnError?: boolean; // Stop on first error (default: false)
  progressCallback?: (completed: number, total: number) => void; // Progress callback
}

/**
 * Process items in batches with controlled concurrency
 *
 * @param items - Items to process
 * @param processor - Async function to process each item
 * @param options - Batch processing options
 * @returns Array of successfully processed results
 *
 * @example
 * ```ts
 * const results = await batchProcess(
 *   articles,
 *   async (article) => await processWithAI(article),
 *   { concurrency: 5 }
 * );
 * ```
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessOptions = {}
): Promise<R[]> {
  const {
    concurrency = 5,
    stopOnError = false,
    progressCallback,
  } = options;

  const results: R[] = [];
  const errors: Array<{ item: T; error: unknown }> = [];
  let completed = 0;

  // Process items in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    // Process all items in this batch concurrently
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );

    // Collect results and handle errors
    batchResults.forEach((result, index) => {
      completed++;

      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({ item: batch[index], error: result.reason });

        if (stopOnError) {
          throw result.reason;
        }
      }
    });

    // Report progress
    if (progressCallback) {
      progressCallback(completed, items.length);
    }

    // Log batch progress
    console.log(`[Batch] Completed ${completed}/${items.length} items`);
  }

  // Log errors if any
  if (errors.length > 0) {
    console.warn(`[Batch] ${errors.length} items failed to process`);
    errors.forEach(({ error }) => {
      console.error('  -', error instanceof Error ? error.message : String(error));
    });
  }

  return results;
}

/**
 * Process items with retry logic
 *
 * @param items - Items to process
 * @param processor - Async function to process each item
 * @param options - Processing options
 * @returns Array of successfully processed results
 */
export async function batchProcessWithRetry<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: BatchProcessOptions & {
    maxRetries?: number;  // Maximum retry attempts (default: 3)
    retryDelay?: number;  // Delay between retries in ms (default: 1000)
  } = {}
): Promise<R[]> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    ...batchOptions
  } = options;

  const wrappedProcessor = async (item: T): Promise<R> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await processor(item);
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          console.warn(`[Batch] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await sleep(delay);
        }
      }
    }

    throw lastError;
  };

  return batchProcess(items, wrappedProcessor, batchOptions);
}

/**
 * Process items in parallel without concurrency limit
 * Warning: Use with caution, can overwhelm resources
 */
export async function processAll<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results = await Promise.allSettled(
    items.map(item => processor(item))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<R> => result.status === 'fulfilled')
    .map(result => result.value);
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
