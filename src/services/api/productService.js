import api from "./axios";

/**
 * Product Service
 * Handles all product-related API calls
 */

/**
 * Add new products
 * @param {Array} products - Array of product objects
 * @returns {Promise} Response with created products
 */
export const addProducts = async (products) => {
  try {
    const response = await api.post("/products/addProducts", products);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || {
        message: error.message || "Failed to add products",
      },
    };
  }
};

/**
 * Get all products with pagination and filtering
 * @param {number} skip - Number of records to skip
 * @param {number} limit - Maximum number of records to return
 * @param {string} filterField - Field to filter on (productname, productid, barcode, sku, category, brand, description)
 * @param {string} filterValue - Value to search for
 * @returns {Promise} Response with paginated products
 */
export const getAllProducts = async (
  skip = 0,
  limit = 12,
  filterField = null,
  filterValue = "",
) => {
  try {
    let url = `/products/getProducts?skip=${skip}&limit=${limit}`;

    if (filterField && filterValue.trim()) {
      url += `&filter_field=${filterField}&filter_value=${encodeURIComponent(filterValue.trim())}`;
    }

    const response = await api.get(url);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || {
        message: error.message || "Failed to fetch products",
      },
    };
  }
};

/**
 * Get product by ID
 * @param {number} productId - Product ID
 * @returns {Promise} Response with product details
 */
export const getProductById = async (productId) => {
  try {
    const response = await api.get(`/products/getProduct/${productId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || {
        message: error.message || "Failed to fetch product",
      },
    };
  }
};

/**
 * Update product
 * @param {number} productId - Product ID
 * @param {Object} productData - Product data to update
 * @returns {Promise} Response with updated product
 */
export const updateProduct = async (productId, productData) => {
  try {
    const response = await api.put(
      `/products/updateProduct/${productId}`,
      productData,
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || {
        message: error.message || "Failed to update product",
      },
    };
  }
};

/**
 * Delete product
 * @param {number} productId - Product ID
 * @returns {Promise} Response with deletion confirmation
 */
export const deleteProduct = async (productId) => {
  try {
    const response = await api.delete(`/products/deleteProduct/${productId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || {
        message: error.message || "Failed to delete product",
      },
    };
  }
};

/**
 * Search products
 * @param {Object} filters - Search filters
 * @returns {Promise} Response with matching products
 */
export const searchProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.query) params.append("query", filters.query);
    if (filters.category) params.append("category", filters.category);
    if (filters.brand) params.append("brand", filters.brand);
    if (filters.min_price) params.append("min_price", filters.min_price);
    if (filters.max_price) params.append("max_price", filters.max_price);

    const response = await api.get(
      `/products/searchProducts?${params.toString()}`,
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || {
        message: error.message || "Failed to search products",
      },
    };
  }
};
