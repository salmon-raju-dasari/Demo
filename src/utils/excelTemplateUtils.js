import * as XLSX from "xlsx";

/**
 * Generate Excel template for bulk product upload
 * @returns {void} Downloads the Excel template
 */
export const downloadProductTemplate = () => {
  // Define template headers with sample data
  const headers = [
    "productname",
    "barcode",
    "sku",
    "description",
    "brand",
    "category",
    "price",
    "unitvalue",
    "unit",
    "discount",
    "gst",
    "openingstock",
    "stock_alert_quantity",
    "mfgdate",
    "expirydate",
    "suppliername",
    "suppliercontact",
  ];

  // Sample data row for reference
  const sampleData = [
    "Sample Product Name",
    "'1234567890123", // Prefix with ' to force text format in Excel
    "SKU-001",
    "Product description here",
    "Brand Name",
    "Electronics",
    "100.00",
    "1",
    "pieces",
    "0",
    "18",
    "100",
    "10",
    "2024-01-15",
    "2025-01-15",
    "Supplier Name",
    "+91 9876543210",
  ];

  // Instructions row
  const instructions = [
    "Required - Max 500 chars",
    "Required - TEXT format (e.g., '1234567890123)",
    "Required - Max 100 chars (unique)",
    "Optional - Max 2000 chars",
    "Optional - Max 100 chars",
    "Optional - Max 100 chars",
    "Required - Must be > 0",
    "Optional - Decimal (e.g., 0.5, 1.5)",
    "Optional - Max 50 chars",
    "Optional - 0-100",
    "Optional - 0-100",
    "Optional - >= 0",
    "Required - >= 0 (default: 10)",
    "Optional - YYYY-MM-DD",
    "Optional - YYYY-MM-DD",
    "Optional - Max 100 chars",
    "Optional - Max 100 chars",
  ];

  // Create worksheet data
  const wsData = [headers, instructions, sampleData];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Format barcode, SKU, and supplier contact columns as TEXT to prevent Excel from converting to numbers
  // Apply text format starting from row 4 (data rows) onwards
  const textColumns = [1, 2, 16]; // B (barcode), C (sku), Q (suppliercontact)

  for (let row = 3; row <= 1000; row++) {
    // Format first 1000 rows as text
    textColumns.forEach((col) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddress]) {
        ws[cellAddress] = { t: "s", v: "" }; // Initialize empty cells as text
      }
    });
  }

  // Set column widths
  ws["!cols"] = [
    { wch: 30 }, // productname
    { wch: 20 }, // barcode
    { wch: 15 }, // sku
    { wch: 40 }, // description
    { wch: 15 }, // brand
    { wch: 15 }, // category
    { wch: 10 }, // price
    { wch: 12 }, // unitvalue
    { wch: 12 }, // unit
    { wch: 10 }, // discount
    { wch: 10 }, // gst
    { wch: 15 }, // openingstock
    { wch: 18 }, // stock_alert_quantity
    { wch: 12 }, // mfgdate
    { wch: 12 }, // expirydate
    { wch: 20 }, // suppliername
    { wch: 20 }, // suppliercontact
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Products Template");

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `Product_Bulk_Upload_Template_${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};

/**
 * Read Excel file and convert to JSON
 * @param {File} file - Excel file to read
 * @returns {Promise<Array>} Array of product objects
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];

        // Convert to JSON - use raw values to preserve text formatting
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 0,
          defval: null,
          blankrows: false,
          raw: false, // Don't use raw values, preserve formatting
        });

        // Filter out header and instructions rows if they're included
        const products = jsonData
          .filter((row) => {
            // Skip if it's the instruction row (contains "Required" text)
            const firstValue = Object.values(row)[0];
            return (
              firstValue &&
              !String(firstValue).includes("Required") &&
              !String(firstValue).includes("Max")
            );
          })
          .map((product) => {
            // Clean up text fields - remove leading apostrophe if present (Excel text format prefix)
            if (product.barcode && typeof product.barcode === "string") {
              product.barcode = product.barcode.replace(/^'/, "").trim();
            }
            if (product.sku && typeof product.sku === "string") {
              product.sku = product.sku.replace(/^'/, "").trim();
            }
            if (
              product.suppliercontact &&
              typeof product.suppliercontact === "string"
            ) {
              product.suppliercontact = product.suppliercontact
                .replace(/^'/, "")
                .trim();
            }

            // Convert numeric strings back to proper format
            if (product.barcode && typeof product.barcode === "number") {
              product.barcode = String(product.barcode);
            }
            if (product.sku && typeof product.sku === "number") {
              product.sku = String(product.sku);
            }

            return product;
          });

        resolve(products);
      } catch (error) {
        reject(new Error("Failed to read Excel file: " + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generate Excel file from data
 * @param {Array} data - Array of objects
 * @param {string} filename - Name of the file to download
 * @param {string} sheetName - Name of the worksheet
 */
export const generateExcelFile = (data, filename, sheetName = "Sheet1") => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = [];

  if (data.length > 0) {
    Object.keys(data[0]).forEach((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] || "").length),
      );
      colWidths.push({ wch: Math.min(maxLength + 2, maxWidth) });
    });
  }

  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};

/**
 * Download success and failure Excel files after bulk upload
 * @param {Array} successProducts - Array of successfully uploaded products
 * @param {Array} failedProducts - Array of failed products with errors
 */
export const downloadBulkUploadResults = (successProducts, failedProducts) => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .split("T")
    .join("_")
    .substring(0, 19);

  // Download success file if there are any successful uploads
  if (successProducts && successProducts.length > 0) {
    const successData = successProducts.map((product) => ({
      "Product ID": product.productid || product.id || "N/A",
      "Product Name": product.productname,
      SKU: product.sku,
      Barcode: product.barcode,
      Price: product.price,
      Status: "Success",
    }));

    generateExcelFile(
      successData,
      `Bulk_Upload_Success_${timestamp}.xlsx`,
      "Successful Uploads",
    );
  }

  // Download failure file if there are any failures
  if (failedProducts && failedProducts.length > 0) {
    const failureData = failedProducts.map((item) => ({
      "Row Number": item.row_number || item.product_index + 1 || "N/A",
      "Product Name": item.productname || item.product?.productname || "N/A",
      SKU: item.sku || item.product?.sku || "N/A",
      Barcode: item.barcode || item.product?.barcode || "N/A",
      "Error Field": item.field || "Multiple Fields",
      "Error Message": item.error || item.message || "Validation failed",
      Status: "Failed",
    }));

    generateExcelFile(
      failureData,
      `Bulk_Upload_Failures_${timestamp}.xlsx`,
      "Failed Uploads",
    );
  }
};
