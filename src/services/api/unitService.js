import api from "./axios";

/**
 * Fetch all base units with sub units from the database
 * @returns {Promise<Array>} Array of base units with their sub units
 */
export const fetchUnits = async () => {
  try {
    const response = await api.get("/units/base-units");
    return response.data;
  } catch (error) {
    console.error("Error fetching units:", error);
    throw error;
  }
};

/**
 * Transform base units data into dropdown format grouped by unit title
 * @param {Array} baseUnits - Array of base units from API
 * @returns {Array} Formatted options for grouped dropdown
 */
export const transformUnitsForDropdown = (baseUnits) => {
  if (!Array.isArray(baseUnits) || baseUnits.length === 0) {
    return [];
  }

  return baseUnits.map((baseUnit) => ({
    category: baseUnit.unit_title || baseUnit.base_unit_name,
    items: [
      // Include the base unit itself
      {
        name: baseUnit.base_unit_name,
        symbol: baseUnit.code,
        label: `${baseUnit.base_unit_name} (${baseUnit.code})`,
      },
      // Include all sub units
      ...(baseUnit.sub_units || []).map((subUnit) => ({
        name: subUnit.sub_unit_name,
        symbol: subUnit.code,
        label: `${subUnit.sub_unit_name} (${subUnit.code})`,
        conversionValue: subUnit.conversion_value,
      })),
    ],
  }));
};

/**
 * Fetch units and transform them for dropdown usage
 * @returns {Promise<Array>} Formatted dropdown options
 */
export const fetchUnitsForDropdown = async () => {
  const baseUnits = await fetchUnits();
  return transformUnitsForDropdown(baseUnits);
};
