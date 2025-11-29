/**
 * Category Service
 * Handles all API requests related to product categories
 * Includes error handling and retry logic for robustness
 */

import { api } from "./axios";

class CategoryServiceError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = "CategoryServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Fetch all categories from the backend database
 * @returns {Promise<Array>} Array of category objects
 * @throws {CategoryServiceError} If fetch fails
 */
export const fetchCategories = async (retryCount = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Fetching categories (attempt ${attempt}/${retryCount})...`);

      const response = await api.get("/categories");

      if (response.status !== 200) {
        const errorData = response.data;
        throw new CategoryServiceError(
          errorData?.detail?.message || "Failed to fetch categories",
          response.status,
          errorData?.detail || {}
        );
      }

      const data = response.data;
      console.log(`Successfully fetched ${data.length} categories`);

      // Transform backend data to frontend format
      return data.map((category) => ({
        label: category.name,
        value: category.id,
        id: category.id,
        name: category.name,
        description: category.description,
      }));
    } catch (error) {
      lastError = error;
      console.error(`Category fetch attempt ${attempt} failed:`, error.message);

      // Exponential backoff for retries (except last attempt)
      if (attempt < retryCount) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  console.error("All category fetch attempts failed");
  throw (
    lastError ||
    new CategoryServiceError(
      "Failed to fetch categories after multiple attempts",
      0
    )
  );
};

/**
 * Fetch a single category by ID
 * @param {number} categoryId - The category ID
 * @returns {Promise<Object>} Category object
 * @throws {CategoryServiceError} If fetch fails
 */
export const fetchCategoryById = async (categoryId) => {
  try {
    const response = await api.get(`/categories/${categoryId}`);

    if (response.status !== 200) {
      const errorData = response.data;
      throw new CategoryServiceError(
        errorData?.detail?.message || "Category not found",
        response.status,
        errorData?.detail || {}
      );
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching category by ID:", error.message);
    throw error instanceof CategoryServiceError
      ? error
      : new CategoryServiceError(
          `Failed to fetch category: ${error.message}`,
          500
        );
  }
};

/**
 * Create a new category
 * @param {Object} categoryData - Category data { name, description }
 * @returns {Promise<Object>} Created category object
 * @throws {CategoryServiceError} If creation fails
 */
export const createCategory = async (categoryData) => {
  try {
    if (!categoryData.name || categoryData.name.trim() === "") {
      throw new CategoryServiceError("Category name is required", 400);
    }

    const response = await api.post("/categories", {
      name: categoryData.name.trim(),
      description: categoryData.description?.trim() || null,
    });

    if (response.status !== 201) {
      const errorData = response.data;
      throw new CategoryServiceError(
        errorData?.detail?.message || "Failed to create category",
        response.status,
        errorData?.detail || {}
      );
    }

    console.log(`Successfully created category: ${response.data.name}`);
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error.message);
    throw error instanceof CategoryServiceError
      ? error
      : new CategoryServiceError(
          `Failed to create category: ${error.message}`,
          500
        );
  }
};

/**
 * Update an existing category
 * @param {number} categoryId - Category ID to update
 * @param {Object} categoryData - Updated category data
 * @returns {Promise<Object>} Updated category object
 * @throws {CategoryServiceError} If update fails
 */
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const response = await api.put(`/categories/${categoryId}`, categoryData);

    if (response.status !== 200) {
      const errorData = response.data;
      throw new CategoryServiceError(
        errorData?.detail?.message || "Failed to update category",
        response.status,
        errorData?.detail || {}
      );
    }

    console.log(`Successfully updated category: ${response.data.name}`);
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error.message);
    throw error instanceof CategoryServiceError
      ? error
      : new CategoryServiceError(
          `Failed to update category: ${error.message}`,
          500
        );
  }
};

/**
 * Delete a category
 * @param {number} categoryId - Category ID to delete
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {CategoryServiceError} If deletion fails
 */
export const deleteCategory = async (categoryId) => {
  try {
    const response = await api.delete(`/categories/${categoryId}`);

    if (response.status !== 200) {
      const errorData = response.data;
      throw new CategoryServiceError(
        errorData?.detail?.message || "Failed to delete category",
        response.status,
        errorData?.detail || {}
      );
    }

    console.log(`Successfully deleted category`);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error.message);
    throw error instanceof CategoryServiceError
      ? error
      : new CategoryServiceError(
          `Failed to delete category: ${error.message}`,
          500
        );
  }
};

export default {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  CategoryServiceError,
};
