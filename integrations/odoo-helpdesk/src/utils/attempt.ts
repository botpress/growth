import { RuntimeError } from '@botpress/sdk'

/**
 * Attempts to execute a function and throws a custom error if it fails.
 *
 * @param fn - The function to execute
 * @param error - The error to throw if the function fails. Can be:
 *   - A string (will be wrapped in RuntimeError)
 *   - An Error instance (will be thrown directly)
 *   - A function that returns an Error or string (useful for dynamic error messages)
 * @param retries - Optional number of retry attempts. Defaults to 0 (no retries).
 *   If set to n, the function will be attempted up to n+1 times total (initial attempt + n retries).
 * @param timeoutMs - Optional timeout in milliseconds. Each attempt will timeout after this duration.
 *   Defaults to 1000ms (1 second). The timeout applies to each individual attempt, not the total retry time.
 * @returns The result of the function execution
 * @throws The custom error if the function fails after all retry attempts or if a timeout occurs
 *
 * @example
 * ```ts
 * // With a string error message (no retries, default 1s timeout)
 * const result = await attempt(
 *   () => someAsyncFunction(),
 *   'Failed to execute function'
 * )
 *
 * // With retries (will attempt up to 3 times total, default 1s timeout per attempt)
 * const result = await attempt(
 *   () => someAsyncFunction(),
 *   'Failed to execute function',
 *   2
 * )
 *
 * // With custom timeout (5 seconds per attempt)
 * const result = await attempt(
 *   () => someAsyncFunction(),
 *   'Failed to execute function',
 *   0,
 *   5000
 * )
 *
 * // With retries and custom timeout
 * const result = await attempt(
 *   () => someAsyncFunction(),
 *   'Failed to execute function',
 *   2,
 *   3000
 * )
 *
 * // With an Error instance, retries, and custom timeout
 * const result = await attempt(
 *   () => someAsyncFunction(),
 *   new RuntimeError('Custom error'),
 *   3,
 *   10000
 * )
 *
 * // With a function that generates the error dynamically
 * const result = await attempt(
 *   () => someAsyncFunction(),
 *   (originalError) => `Failed to execute: ${originalError.message}`,
 *   1,
 *   5000
 * )
 * ```
 */
export async function attempt<T>({
  fn,
  error,
  retries = 0,
  timeoutMs = 1000,
}: {
  fn: () => Promise<T> | T
  error: RuntimeError | ((originalError: unknown) => RuntimeError)
  retries?: number
  timeoutMs?: number
}): Promise<T> {
  let lastError: unknown

  const executeWithTimeout = async (): Promise<T> => {
    const fnPromise = Promise.resolve(fn())

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    return Promise.race([fnPromise, timeoutPromise])
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await executeWithTimeout()
    } catch (originalError) {
      lastError = originalError

      // If this was the last attempt, throw the custom error.
      if (attempt === retries) {
        let errorToThrow: RuntimeError
        if (error instanceof RuntimeError) {
          errorToThrow = error
        } else {
          // Error is a function.
          const result = error(originalError)
          errorToThrow = typeof result === 'string' ? new RuntimeError(result) : result
        }

        throw errorToThrow
      }
      // Otherwise, continue to the next retry attempt.
    }
  }

  // This should never be reached, but TypeScript needs it.
  throw new RuntimeError('Unexpected error in attempt function')
}
