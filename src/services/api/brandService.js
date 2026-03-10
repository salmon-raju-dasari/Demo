/**
 * Brand Service
 * Handles all API requests related to product brands
 * Includes error handling and retry logic for robustness
 */

import { api } from "./axios";

class BrandServiceError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = "BrandServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Fetch all brands for the current business from the backend database
 * @returns {Promise<Array>} Array of brand objects
 * @throws {BrandServiceError} If fetch fails
 */
export const fetchBrands = async (retryCount = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Fetching brands (attempt ${attempt}/${retryCount})...`);

      const response = await api.get("/brands/");

      if (response.status !== 200) {
        const errorData = response.data;
        throw new BrandServiceError(
          errorData?.detail?.message || "Failed to fetch brands",
          response.status,
          errorData?.detail || {},
        );
      }

      const data = response.data;
      console.log(`Successfully fetched ${data.length} brands`);

      // Transform backend data to frontend format
      return data.map((brand) => ({
        label: brand.brand_name,
        value: brand.id,
        id: brand.id,
        brand_name: brand.brand_name,
      }));
    } catch (error) {
      lastError = error;
      console.warn(
        `Attempt ${attempt} failed:`,
        error.message || error.statusText,
      );

      if (attempt < retryCount) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  const errorMessage =
    lastError instanceof BrandServiceError
      ? lastError.message
      : `Failed to fetch brands after ${retryCount} attempts`;

  console.error("Brand fetch failed:", errorMessage);
  throw new BrandServiceError(errorMessage, lastError?.statusCode || 500);
};

/**
 * Create a new brand
 * @param {string} brandName - Name of the brand
 * @returns {Promise<Object>} Created brand object
 * @throws {BrandServiceError} If creation fails
 */
export const createBrand = async (brandName) => {
  try {
    console.log(`Creating new brand: ${brandName}`);

    const response = await api.post("/brands/", {
      brand_name: brandName,
    });

    if (response.status !== 201) {
      const errorData = response.data;
      throw new BrandServiceError(
        errorData?.detail?.message || "Failed to create brand",
        response.status,
        errorData?.detail || {},
      );
    }

    const data = response.data;
    console.log(`Successfully created brand:`, data);

    return {
      label: data.brand_name,
      value: data.id,
      id: data.id,
      brand_name: data.brand_name,
    };
  } catch (error) {
    const errorMessage =
      error instanceof BrandServiceError
        ? error.message
        : error.response?.data?.detail?.message || "Failed to create brand";

    console.error("Brand creation failed:", errorMessage);
    throw new BrandServiceError(errorMessage, error.statusCode || 500);
  }
};

/**
 * Delete a brand by ID
 * @param {number} brandId - ID of the brand to delete
 * @returns {Promise<Object>} Success message
 * @throws {BrandServiceError} If deletion fails
 */
export const deleteBrand = async (brandId) => {
  try {
    console.log(`Deleting brand ID: ${brandId}`);
    const response = await api.delete(`/brands/${brandId}`);
    console.log(`Successfully deleted brand ID: ${brandId}`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error instanceof BrandServiceError
        ? error.message
        : error.response?.data?.detail || "Failed to delete brand";
    console.error("Brand deletion failed:", errorMessage);
    throw new BrandServiceError(errorMessage, error.response?.status || 500);
  }
};
