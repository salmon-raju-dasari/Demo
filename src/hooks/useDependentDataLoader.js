/**
 * useDependentDataLoader Hook
 * Manages loading state for multiple dependent API calls
 * Implements industry-standard patterns for data fetching and error handling
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to handle loading and fetching dependent data
 * @param {Array<Object>} dependencies - Array of dependency objects
 * @param {Function} dependencies[].fetcher - Async function that fetches data
 * @param {string} dependencies[].key - Unique key for the data (used in result object)
 * @param {boolean} [options.parallel=false] - Whether to fetch all in parallel or sequentially
 * @param {number} [options.retryCount=3] - Number of retries for failed requests
 * @returns {Object} { data, isLoading, error, retry }
 */
export const useDependentDataLoader = (dependencies = [], options = {}) => {
  const { parallel = false, retryCount = 3 } = options;

  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [failedKeys, setFailedKeys] = useState(new Set());

  /**
   * Fetch data with retry logic
   */
  const fetchWithRetry = useCallback(
    async (fetcher, key, retries = 0) => {
      try {
        const result = await fetcher();
        setData((prev) => ({
          ...prev,
          [key]: result,
        }));
        setFailedKeys((prev) => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
        setError(null);
        return result;
      } catch (err) {
        console.error(`Failed to fetch ${key}:`, err.message);

        if (retries < retryCount) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retries), 5000);
          console.log(`Retrying ${key} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchWithRetry(fetcher, key, retries + 1);
        } else {
          setFailedKeys((prev) => new Set(prev).add(key));
          setError({
            key,
            message: err.message,
            originalError: err,
          });
          throw err;
        }
      }
    },
    [retryCount]
  );

  /**
   * Load all dependencies
   */
  const loadDependencies = useCallback(async () => {
    if (dependencies.length === 0) return;

    setIsLoading(true);
    setError(null);
    setFailedKeys(new Set());

    try {
      if (parallel) {
        // Fetch all in parallel
        const promises = dependencies.map((dep) =>
          fetchWithRetry(dep.fetcher, dep.key)
            .then((result) => ({ key: dep.key, result, success: true }))
            .catch(() => ({ key: dep.key, success: false }))
        );

        const results = await Promise.all(promises);

        // Check if any failed
        const failedResults = results.filter((r) => !r.success);
        if (failedResults.length > 0) {
          const failedKeys = failedResults.map((r) => r.key);
          throw new Error(`Failed to load: ${failedKeys.join(", ")}`);
        }
      } else {
        // Fetch sequentially
        for (const dep of dependencies) {
          await fetchWithRetry(dep.fetcher, dep.key);
        }
      }
    } catch (err) {
      console.error("Error loading dependencies:", err.message);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [dependencies, parallel, fetchWithRetry]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  /**
   * Retry function to reload specific or all failed dependencies
   */
  const retry = useCallback(
    async (keyToRetry = null) => {
      setIsLoading(true);
      setError(null);

      try {
        if (keyToRetry) {
          // Retry specific dependency
          const dep = dependencies.find((d) => d.key === keyToRetry);
          if (dep) {
            await fetchWithRetry(dep.fetcher, dep.key);
          }
        } else {
          // Retry all failed dependencies
          const retryDeps = dependencies.filter((dep) =>
            failedKeys.has(dep.key)
          );

          for (const dep of retryDeps) {
            await fetchWithRetry(dep.fetcher, dep.key);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [dependencies, failedKeys, fetchWithRetry]
  );

  return {
    data,
    isLoading,
    error,
    retry,
    failedKeys,
    isSuccess:
      failedKeys.size === 0 && !isLoading && Object.keys(data).length > 0,
  };
};

export default useDependentDataLoader;
