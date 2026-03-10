import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useState, useRef, useEffect, useMemo } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import "../styles/add-product.css";
import { Calendar } from "primereact/calendar";
import { useLocation, useNavigate } from "react-router-dom";
import { FileUpload } from "primereact/fileupload";

// New imports for refactored features
import LoadingSpinner from "./LoadingSpinner";
import QRCodeScanner from "./QRCodeScanner";
import PrintSlip from "./PrintSlip";
import CategoryManagement from "./CategoryManagement";
import UnitManagement from "./UnitManagement";
import { fetchCategories } from "../services/api/categoryService";
import { fetchBrands, deleteBrand } from "../services/api/brandService";
import { fetchUnitsForDropdown } from "../services/api/unitService";
import { useDependentDataLoader } from "../hooks/useDependentDataLoader";
import api from "../services/api/axios";
import {
  addProducts as addProductsAPI,
  updateProduct as updateProductAPI,
} from "../services/api/productService";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  downloadProductTemplate,
  readExcelFile,
  downloadBulkUploadResults,
} from "../utils/excelTemplateUtils";

/**
 * AddProducts Component
 * Industry-standard product form with:
 * - Dynamic categories fetched from backend database
 * - QR/Barcode scanner with html5-qrcode (100% accuracy)
 * - Loading spinner for dependent API calls
 * - Proper error handling and user feedback
 * - Scalable and reusable architecture
 * - Edit mode support for updating existing products
 */
export default function AddProducts() {
  // Get location and navigate for edit mode
  const location = useLocation();
  const navigate = useNavigate();
  const editProduct = location.state?.product;
  const isEditMode = location.state?.isEdit || false;

  // Units will be fetched from the database via useDependentDataLoader

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    openingStock: "",
    stockAlertQuantity: "10",
    addQuantity: "",
    removeQuantity: "",
    currentQuantity: 0,
    unitValue: "",
    skuSuffix: "",
    category: null,
    unit: null,
    expiryDate: "",
    mfgDate: "",
    barcode: "",
    brand_id: null,
    brand_name: "",
    supplierName: "",
    supplierContact: "",
    cgst: "",
    discount: "",
  });

  // UI state
  const [brandDeleteLoading, setBrandDeleteLoading] = useState(false);

  const [productLabels, setProductLabels] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [productImages, setProductImages] = useState([]);
  const [galleriaVisible, setGalleriaVisible] = useState(false);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printSlipVisible, setPrintSlipVisible] = useState(false);
  const [slipProduct, setSlipProduct] = useState(null);
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [unitDialogVisible, setUnitDialogVisible] = useState(false);

  // Bulk upload state
  const [bulkUploadDialogVisible, setBulkUploadDialogVisible] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const fileUploadRef = useRef(null);

  // Custom Labels state for product
  const [labelValueMappings, setLabelValueMappings] = useState({});
  const [dbLabelValues, setDbLabelValues] = useState({});

  // Refs
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Memoize dependencies to prevent infinite loops
  const dependencies = useMemo(
    () => [
      {
        key: "brands",
        fetcher: () => fetchBrands(),
      },
      {
        key: "categories",
        fetcher: () => fetchCategories(),
      },
      {
        key: "units",
        fetcher: () => fetchUnitsForDropdown(),
      },
    ],
    [],
  );

  // Load categories using dependent data loader
  const {
    data: dependentData,
    isLoading,
    error,
    refetch,
  } = useDependentDataLoader(dependencies, {
    parallel: false,
    retryCount: 3,
  });

  const brands = dependentData.brands || [];
  const categories = dependentData.categories || [];
  const units = dependentData.units || [];

  // Handle dependent data errors
  useEffect(() => {
    if (error && error.key === "brands") {
      toast.current?.show({
        severity: "error",
        summary: "Failed to Load Brands",
        detail: "Could not fetch brands from server. Please refresh the page.",
        life: 5000,
      });
    }
    if (error && error.key === "categories") {
      toast.current?.show({
        severity: "error",
        summary: "Failed to Load Categories",
        detail:
          "Could not fetch categories from server. Please refresh the page.",
        life: 5000,
      });
    }
    if (error && error.key === "units") {
      toast.current?.show({
        severity: "error",
        summary: "Failed to Load Units",
        detail: "Could not fetch units from server. Please refresh the page.",
        life: 5000,
      });
    }
  }, [error]);

  // Populate form in edit mode
  useEffect(() => {
    if (
      isEditMode &&
      editProduct &&
      brands.length > 0 &&
      categories.length > 0 &&
      units.length > 0
    ) {
      // Find the matching category ID from category name
      const matchedCategory = categories.find(
        (cat) => cat.name === editProduct.category,
      );

      // Debug: Log unit information
      console.log("=== EDIT MODE DEBUG ===");
      console.log("editProduct.unit:", editProduct.unit);
      console.log("Units available:", units);
      console.log(
        "All available unit symbols:",
        units.flatMap((u) => u.items.map((i) => i.symbol)),
      );

      setProductForm({
        name: editProduct.productname || "",
        description: editProduct.description || "",
        price: editProduct.price || "",
        openingStock: editProduct.quantity || "",
        stockAlertQuantity: editProduct.stock_alert_quantity || "10",
        addQuantity: "",
        removeQuantity: "",
        currentQuantity: editProduct.quantity || 0,
        unitValue: editProduct.unitvalue || "",
        skuSuffix: editProduct.sku || "",
        category: matchedCategory?.id || null, // Store ID, not object
        unit: editProduct.unit || null, // Store symbol directly
        expiryDate: editProduct.expirydate
          ? new Date(editProduct.expirydate)
          : "",
        mfgDate: editProduct.mfgdate ? new Date(editProduct.mfgdate) : "",
        barcode: editProduct.barcode || "",
        brand_id: editProduct.brand_id || null,
        brand_name: editProduct.brand_name || "",
        supplierName: editProduct.suppliername || "",
        supplierContact: editProduct.suppliercontact || "",
        cgst: editProduct.gst || "",
        discount: editProduct.discount || "",
      });

      // Handle product images if available
      if (
        editProduct.productimages &&
        Array.isArray(editProduct.productimages)
      ) {
        setProductImages(
          editProduct.productimages.map((url, index) => ({
            id: Date.now() + index,
            url: url,
            name: `Image ${index + 1}`,
            isPrimary: index === 0,
            isExisting: true, // Flag to indicate this is from database
          })),
        );
      }

      // Handle custom fields if available
      if (editProduct.customfields && Array.isArray(editProduct.customfields)) {
        const labels = editProduct.customfields.map((field, index) => ({
          id: Date.now() + index,
          name: field.field_name || "",
          value: field.field_value || "",
          saved: true,
        }));
        setProductLabels(labels);
      }
    }
  }, [isEditMode, editProduct, brands, categories, units]);

  // Reset form when switching from edit to add mode
  useEffect(() => {
    if (!isEditMode && !editProduct) {
      setProductForm({
        name: "",
        description: "",
        price: "",
        openingStock: "",
        stockAlertQuantity: "10",
        addQuantity: "",
        removeQuantity: "",
        currentQuantity: 0,
        unitValue: "",
        skuSuffix: "",
        category: null,
        unit: null,
        expiryDate: "",
        mfgDate: "",
        barcode: "",
        brand_id: null,
        brand_name: "",
        supplierName: "",
        supplierContact: "",
        cgst: "",
        discount: "",
      });
      setProductImages([]);
      setProductLabels([]);
      setLabelValueMappings({});
      setDbLabelValues({});
    }
  }, [isEditMode, editProduct]);

  // Delete brand handler
  const handleDeleteBrand = (brand, e) => {
    e.preventDefault();
    e.stopPropagation();
    confirmDialog({
      message: `Are you sure you want to delete the brand "${brand.label}"? This will unlink it from all associated products.`,
      header: "Delete Brand",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        setBrandDeleteLoading(true);
        try {
          await deleteBrand(brand.value);
          // Clear form if deleted brand was selected
          if (productForm.brand_id === brand.value) {
            setProductForm((prev) => ({
              ...prev,
              brand_id: null,
              brand_name: "",
            }));
          }
          // Refresh brands list
          await refetch("brands");
          toast.current?.show({
            severity: "success",
            summary: "Brand Deleted",
            detail: `"${brand.label}" has been deleted successfully.`,
            life: 3000,
          });
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Delete Failed",
            detail: err.message || "Failed to delete brand.",
            life: 4000,
          });
        } finally {
          setBrandDeleteLoading(false);
        }
      },
    });
  };

  // Custom brand option template with delete button
  const brandOptionTemplate = (option) => (
    <div className="flex items-center justify-between w-full">
      <span>{option.label}</span>
      <Button
        icon="pi pi-trash"
        rounded
        text
        size="small"
        severity="danger"
        className="w-6! h-6! ml-2 flex-shrink-0"
        onClick={(e) => handleDeleteBrand(option, e)}
        disabled={brandDeleteLoading}
      />
    </div>
  );

  // Form field change handler
  const handleChange = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  // Clear add quantity handler
  const handleClearAddQuantity = () => {
    setProductForm((prev) => ({
      ...prev,
      addQuantity: "",
      currentQuantity: 0,
    }));
  };

  // Clear remove quantity handler
  const handleClearRemoveQuantity = () => {
    setProductForm((prev) => ({
      ...prev,
      removeQuantity: "",
    }));
  };

  // Custom Labels helpers for products
  const addEmptyProductLabel = () => {
    if (productLabels.some((l) => !l.saved)) return;
    setProductLabels((prev) => [
      ...prev,
      { id: Date.now(), name: "", value: "", saved: false },
    ]);
  };

  const saveProductLabel = (id) => {
    const label = productLabels.find((l) => l.id === id);
    if (!label || !label.name.trim() || !label.value.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Input",
        detail: "Please fill in both label name and value.",
        life: 3000,
      });
      return;
    }

    // Check for duplicate label name
    const duplicate = productLabels.find(
      (l) =>
        l.id !== id &&
        l.saved &&
        l.name.trim().toLowerCase() === label.name.trim().toLowerCase(),
    );
    if (duplicate) {
      toast.current?.show({
        severity: "error",
        summary: "Duplicate Label",
        detail: `Label name "${label.name}" already exists. Please use a different name.`,
        life: 3000,
      });
      return;
    }

    // If the typed value is not already in the known options, persist it to DB
    const existingOptions = getLabelValueOptions(label.name).map((o) =>
      o.value.toLowerCase(),
    );
    const typedValue = label.value.trim();
    if (typedValue && !existingOptions.includes(typedValue.toLowerCase())) {
      // Optimistically update local state first so it shows immediately
      setDbLabelValues((prev) => ({
        ...prev,
        [label.name]: [...(prev[label.name] || []), typedValue],
      }));
      // Persist to backend
      api
        .patch(
          `/custom-labels/append-value?label_name=${encodeURIComponent(label.name)}&new_value=${encodeURIComponent(typedValue)}&label_type=product`,
        )
        .catch((err) =>
          console.warn("Could not persist new label value to DB:", err),
        );
    }

    setProductLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, saved: true } : l)),
    );
    toast.current?.show({
      severity: "success",
      summary: "Custom Field Saved",
      detail: `${label.name}: ${label.value}`,
      life: 2000,
    });
  };

  const removeProductLabel = (id) => {
    setProductLabels((prev) => prev.filter((l) => l.id !== id));
  };

  const updateProductLabel = (id, field, value) => {
    setProductLabels((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          // If transitioning from saved to unsaved (editing), preserve original
          if (field === "saved" && value === false && l.saved) {
            return {
              ...l,
              [field]: value,
              originalName: l.name,
              originalValue: l.value,
            };
          }
          // No API call when changing label name - values already loaded
          return { ...l, [field]: value };
        }
        return l;
      }),
    );
  };

  const cancelEditProductLabel = (id) => {
    setProductLabels((prev) =>
      prev
        .map((l) => {
          if (l.id === id) {
            // If has original values, restore them; otherwise it's a new unsaved row, remove it
            if (l.originalName !== undefined && l.originalValue !== undefined) {
              return {
                ...l,
                name: l.originalName,
                value: l.originalValue,
                saved: true,
                originalName: undefined,
                originalValue: undefined,
              };
            }
            // New unsaved row - will be filtered out below
            return null;
          }
          return l;
        })
        .filter(Boolean),
    );
  };

  // Get value options for a specific label name
  const getLabelValueOptions = (labelName) => {
    if (!labelName) return [];

    // Fetch from database if not already loaded
    if (!dbLabelValues[labelName] && !labelValueMappings[labelName]) {
      fetchLabelValues(labelName);
    }

    // Combine predefined mappings with database values
    const predefinedValues = labelValueMappings[labelName] || [];
    const databaseValues = dbLabelValues[labelName] || [];

    // Merge and deduplicate
    const allValues = [...new Set([...predefinedValues, ...databaseValues])];

    return allValues.map((v) => ({ label: v, value: v }));
  };

  // Fetch values for a specific label from database (custom_labels table)
  const fetchLabelValues = async (labelName) => {
    if (!labelName) return;
    try {
      const response = await api.get(
        `/custom-labels-values/${encodeURIComponent(labelName)}`,
      );
      setDbLabelValues((prev) => ({
        ...prev,
        [labelName]: response.data || [],
      }));
    } catch (error) {
      console.error(`Error fetching values for label ${labelName}:`, error);
    }
  };

  // Fetch all product custom labels from database
  const fetchAllProductCustomLabels = async () => {
    try {
      const response = await api.get("/custom-labels?label_type=product");
      const customLabels = response.data || [];

      // Convert array of custom labels to mapping object
      const dbMappings = {};
      customLabels.forEach((label) => {
        dbMappings[label.label_name] = label.label_values;
      });

      // Update mappings
      setLabelValueMappings((prev) => ({
        ...prev,
        ...dbMappings,
      }));

      // Also update dbLabelValues for immediate availability
      setDbLabelValues((prev) => ({
        ...prev,
        ...dbMappings,
      }));
    } catch (error) {
      console.error("Error fetching all product custom labels:", error);
      // Silently fail - custom labels are optional
    }
  };

  // Load product custom labels on component mount
  useEffect(() => {
    fetchAllProductCustomLabels();
  }, []);

  // Build label name options from database
  const labelNameOptions = Object.keys(labelValueMappings).map((name) => ({
    label: name,
    value: name,
  }));

  // Category management removed - now in separate CategoryManagement screen

  // Image management
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraCapture = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Check if adding these images would exceed the 5 image limit
      const totalImages = productImages.length + files.length;
      if (totalImages > 5) {
        toast.current?.show({
          severity: "error",
          summary: "Maximum Images Exceeded",
          detail: `Maximum 5 images allowed per product. You currently have ${productImages.length} image(s). Cannot add ${files.length} more.`,
          life: 4000,
        });
        e.target.value = "";
        return;
      }

      // Convert files to base64
      const newImages = await Promise.all(
        files.map(async (file) => {
          const base64 = await fileToBase64(file);
          return {
            id: Date.now() + Math.random(),
            file: file,
            url: base64, // Use base64 instead of blob URL
            name: file.name,
          };
        }),
      );

      setProductImages((prev) => [...prev, ...newImages]);
      toast.current?.show({
        severity: "success",
        summary: "Images Added",
        detail: `${files.length} image(s) added successfully!`,
        life: 3000,
      });

      e.target.value = "";
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemoveImage = (imageId) => {
    setProductImages((prev) => {
      const newImages = prev.filter((img) => img.id !== imageId);
      if (primaryImageIndex >= newImages.length && newImages.length > 0) {
        setPrimaryImageIndex(newImages.length - 1);
      } else if (newImages.length === 0) {
        setPrimaryImageIndex(0);
        // Close the gallery dialog when all images are removed
        setGalleriaVisible(false);
      }
      return newImages;
    });

    toast.current?.show({
      severity: "info",
      summary: "Image Removed",
      detail: "Image has been removed",
      life: 2000,
    });
  };

  const handleSetPrimaryImage = (index) => {
    setPrimaryImageIndex(index);
    toast.current?.show({
      severity: "success",
      summary: "Primary Image Set",
      detail: "This image will be shown in product listings",
      life: 2000,
    });
  };

  // Generate unique barcode
  const generateBarcode = () => {
    // Generate barcode: 13 digits (EAN-13 format)
    const timestamp = Date.now().toString().slice(-9); // Last 9 digits of timestamp
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0"); // 4 random digits
    const barcode = (timestamp + random).slice(0, 12); // Take 12 digits

    // Calculate checksum for 13th digit (EAN-13 standard)
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    const fullBarcode = barcode + checksum;

    handleChange("barcode", fullBarcode);
    toast.current?.show({
      severity: "success",
      summary: "Barcode Generated",
      detail: `Generated barcode: ${fullBarcode}`,
      life: 3000,
    });
  };

  // QR Scanner handler
  const handleQRScanComplete = (scannedValue) => {
    handleChange("barcode", scannedValue);
    setScannerVisible(false);
  };

  // Submit product handler
  const handleSubmit = async () => {
    // Validation
    if (!productForm.name?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Product Name is required",
        life: 3000,
      });
      return;
    }
    if (!productForm.barcode?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Barcode is required",
        life: 3000,
      });
      return;
    }
    if (!productForm.skuSuffix?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "SKU is required",
        life: 3000,
      });
      return;
    }
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Price must be greater than 0",
        life: 3000,
      });
      return;
    }

    // Validate stock alert quantity (required)
    if (
      !productForm.stockAlertQuantity ||
      parseFloat(productForm.stockAlertQuantity) <= 0
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Stock Alert Quantity is required and must be greater than 0",
        life: 3000,
      });
      return;
    }

    // Validate opening stock or add/remove quantity
    if (isEditMode) {
      // For edit mode: Add to Stock is optional, but if provided must be > 0
      if (productForm.addQuantity && parseInt(productForm.addQuantity) <= 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Validation Error",
          detail: "Quantity to add must be greater than 0",
          life: 3000,
        });
        return;
      }
      // For edit mode: Remove from Stock is optional, but if provided must be > 0
      if (
        productForm.removeQuantity &&
        parseInt(productForm.removeQuantity) <= 0
      ) {
        toast.current?.show({
          severity: "warn",
          summary: "Validation Error",
          detail: "Quantity to remove must be greater than 0",
          life: 3000,
        });
        return;
      }
      // Check if removal would result in negative stock
      const finalQty =
        productForm.currentQuantity +
        (parseInt(productForm.addQuantity) || 0) -
        (parseInt(productForm.removeQuantity) || 0);
      if (finalQty < 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Validation Error",
          detail: `Cannot remove more than available stock. Current: ${productForm.currentQuantity}, After changes: ${finalQty}`,
          life: 4000,
        });
        return;
      }
    } else {
      // For add mode: Opening Stock is required and must be > 0
      if (
        !productForm.openingStock ||
        parseInt(productForm.openingStock) <= 0
      ) {
        toast.current?.show({
          severity: "warn",
          summary: "Validation Error",
          detail: "Opening stock must be greater than 0",
          life: 3000,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Debug: Log form values before processing
      console.log("Product Form:", productForm);
      console.log("Category ID:", productForm.category);
      console.log("Unit Symbol:", productForm.unit);

      // Look up category name from ID
      const categoryName = productForm.category
        ? categories.find((cat) => cat.id === productForm.category)?.name
        : null;

      console.log("Category Name:", categoryName);

      // Prepare product data
      const productData = {
        productname: productForm.name.trim(),
        barcode: productForm.barcode.trim(),
        sku: productForm.skuSuffix?.trim() || null,
        description: productForm.description?.trim() || null,
        // If a known brand was selected from the list, send brand_id only.
        // If a new name was typed (no brand_id), send brand_name only so the
        // backend creates a new brand entry. If neither, send both as null.
        brand_id: productForm.brand_id || null,
        brand_name:
          !productForm.brand_id && productForm.brand_name?.trim()
            ? productForm.brand_name.trim()
            : null,
        category: categoryName, // Use looked-up category name
        price: parseFloat(productForm.price),
        unitvalue: productForm.unitValue
          ? parseFloat(productForm.unitValue)
          : null,
        unit: productForm.unit || null, // Unit is already the symbol string
        discount: productForm.discount ? parseInt(productForm.discount) : 0,
        gst: productForm.cgst ? parseInt(productForm.cgst) : 0,
        openingstock: isEditMode
          ? productForm.currentQuantity +
            (parseInt(productForm.addQuantity) || 0) -
            (parseInt(productForm.removeQuantity) || 0)
          : productForm.openingStock
            ? parseInt(productForm.openingStock)
            : 0,
        stock_alert_quantity: productForm.stockAlertQuantity
          ? parseFloat(productForm.stockAlertQuantity)
          : 10,
        mfgdate: productForm.mfgDate
          ? productForm.mfgDate.toISOString().split("T")[0]
          : null,
        expirydate: productForm.expiryDate
          ? productForm.expiryDate.toISOString().split("T")[0]
          : null,
        suppliername: productForm.supplierName?.trim() || null,
        suppliercontact: productForm.supplierContact?.trim() || null,
        productimages: productImages.slice(0, 5).map((img) => img.url),
        customfields: productLabels
          .filter((l) => l.saved)
          .map((l) => ({
            field_name: l.name,
            field_value: l.value,
          })),
      };

      let result;

      // Call appropriate API based on mode
      if (isEditMode && editProduct?.id) {
        result = await updateProductAPI(editProduct.id, productData);
      } else {
        result = await addProductsAPI([productData]);
      }

      console.log("API Response:", result);

      // Check for success and ensure error status is handled properly
      if (result && result.success === true) {
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: isEditMode
            ? "Product updated successfully!"
            : "Product added successfully!",
          life: 3000,
        });

        // Navigate back to products list after a delay
        setTimeout(() => {
          navigate("/products");
        }, 1500);
      } else if (result && result.success === false) {
        // Extract detailed error message from backend response
        let errorMessage = "Failed to add product";

        console.log(
          "Full error object:",
          JSON.stringify(result.error, null, 2),
        );

        if (result.error?.detail) {
          // Check for validation_errors (field-specific errors)
          if (
            result.error.detail.validation_errors &&
            Array.isArray(result.error.detail.validation_errors)
          ) {
            const validationErrors = result.error.detail.validation_errors;
            errorMessage = validationErrors
              .map((err) => `${err.field}: ${err.error}`)
              .join("\n");
          } else if (typeof result.error.detail === "string") {
            errorMessage = result.error.detail;
          } else if (result.error.detail.message) {
            errorMessage = result.error.detail.message;
          } else if (Array.isArray(result.error.detail)) {
            // Pydantic validation errors - extract field name and create detailed message
            errorMessage = result.error.detail
              .map((err) => {
                const fieldName = err.loc?.[err.loc.length - 1] || "Field";
                const baseMsg = `${fieldName}: ${err.msg}`;

                // Add context details
                if (err.ctx) {
                  if (err.ctx.max_length) {
                    return `${baseMsg} (max ${err.ctx.max_length} characters)`;
                  }
                  if (err.ctx.min_length) {
                    return `${baseMsg} (min ${err.ctx.min_length} characters)`;
                  }
                }
                return baseMsg;
              })
              .join("\n");
          } else {
            // Object format error
            errorMessage = JSON.stringify(result.error.detail);
          }
        } else if (result.error?.message) {
          errorMessage = result.error.message;
        }

        console.error("Product creation error:", result.error);
        console.error("Error message to display:", errorMessage);

        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: errorMessage,
          life: 5000,
        });
      } else {
        // Unexpected response format
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Unexpected response from server. Please try again.",
          life: 5000,
        });
      }
    } catch (error) {
      console.error(
        isEditMode ? "Error updating product:" : "Error adding product:",
        error,
      );

      // Try to extract meaningful error message
      let errorDetail = "An unexpected error occurred. Please try again.";
      let errorCode = "";

      // Get error code if available
      if (error.response?.status) {
        errorCode = `(${error.response.status})`;
      }

      if (error.response?.data?.detail) {
        // Check for validation_errors first (field-specific errors)
        if (
          error.response.data.detail.validation_errors &&
          Array.isArray(error.response.data.detail.validation_errors)
        ) {
          const validationErrors = error.response.data.detail.validation_errors;
          errorDetail = validationErrors
            .map((err) => `${err.field}: ${err.error}`)
            .join("\n");
        } else if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors array
          errorDetail = error.response.data.detail
            .map((err) => {
              const fieldName = err.loc?.[err.loc.length - 1] || "Field";
              const baseMsg = `${fieldName}: ${err.msg}`;

              // Add context details
              if (err.ctx) {
                if (err.ctx.max_length) {
                  return `${baseMsg} (max ${err.ctx.max_length} characters)`;
                }
                if (err.ctx.min_length) {
                  return `${baseMsg} (min ${err.ctx.min_length} characters)`;
                }
              }
              return baseMsg;
            })
            .join("\n");
        } else if (typeof error.response.data.detail === "string") {
          errorDetail = error.response.data.detail;
        } else if (error.response.data.detail.message) {
          errorDetail = error.response.data.detail.message;
        } else if (error.response.data.detail.error) {
          errorDetail = error.response.data.detail.error;
        }
      } else if (error.response?.data?.message) {
        errorDetail = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorDetail = error.response.data.error;
      } else if (error.message) {
        errorDetail = error.message;
      }

      console.error("Full error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      toast.current?.show({
        severity: "error",
        summary: `Error ${errorCode}`,
        detail: errorDetail,
        life: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Upload Handlers
  const handleDownloadTemplate = () => {
    try {
      downloadProductTemplate();
      toast.current?.show({
        severity: "success",
        summary: "Template Downloaded",
        detail:
          "Excel template downloaded successfully. Fill it with your product data.",
        life: 3000,
      });
    } catch (err) {
      console.error("Error downloading template:", err);
      toast.current?.show({
        severity: "error",
        summary: "Download Failed",
        detail: "Failed to download template. Please try again.",
        life: 3000,
      });
    }
  };

  const handleBulkUploadSelect = (event) => {
    const file = event.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (
        !allowedTypes.includes(file.type) &&
        !file.name.endsWith(".xlsx") &&
        !file.name.endsWith(".xls")
      ) {
        toast.current?.show({
          severity: "error",
          summary: "Invalid File",
          detail: "Please upload an Excel file (.xlsx or .xls)",
          life: 3000,
        });
        fileUploadRef.current?.clear();
        return;
      }

      setBulkUploadFile(file);
    }
  };

  const handleBulkUploadSubmit = async () => {
    if (!bulkUploadFile) {
      toast.current?.show({
        severity: "warn",
        summary: "No File Selected",
        detail: "Please select an Excel file to upload",
        life: 3000,
      });
      return;
    }

    setIsBulkUploading(true);

    try {
      // Read Excel file
      const products = await readExcelFile(bulkUploadFile);

      if (!products || products.length === 0) {
        toast.current?.show({
          severity: "warn",
          summary: "No Data Found",
          detail: "The Excel file contains no product data",
          life: 3000,
        });
        setIsBulkUploading(false);
        return;
      }

      console.log("Read products from Excel:", products);

      // Send to backend for bulk processing
      const response = await api.post("/products/bulkUpload", { products });

      console.log("Bulk upload response:", response);

      const {
        success_count,
        failure_count,
        successful_products,
        failed_products,
      } = response.data;

      // Show summary toast
      if (success_count > 0 && failure_count === 0) {
        toast.current?.show({
          severity: "success",
          summary: "Upload Successful",
          detail: `All ${success_count} products uploaded successfully!`,
          life: 5000,
        });
      } else if (success_count > 0 && failure_count > 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Partial Success",
          detail: `${success_count} products uploaded, ${failure_count} failed. Check downloaded files for details.`,
          life: 5000,
        });
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Upload Failed",
          detail: `All ${failure_count} products failed validation. Check downloaded file for details.`,
          life: 5000,
        });
      }

      // Download result files
      downloadBulkUploadResults(successful_products, failed_products);

      // Clear upload
      setBulkUploadFile(null);
      fileUploadRef.current?.clear();
      setBulkUploadDialogVisible(false);

      // Refresh products list if in products view
      if (success_count > 0) {
        toast.current?.show({
          severity: "info",
          summary: "Tip",
          detail: "Navigate to Products page to see newly added products",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Bulk upload error:", error);

      let errorMessage = "Failed to upload products. Please try again.";

      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === "string") {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.detail.message) {
          errorMessage = error.response.data.detail.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.current?.show({
        severity: "error",
        summary: "Upload Failed",
        detail: errorMessage,
        life: 5000,
      });
    } finally {
      setIsBulkUploading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} position="top-right" appendTo={document.body} />
      <ConfirmDialog appendTo={document.body} />

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleQRScanComplete}
        dialogHeader="Scan Product Barcode/QR Code"
      />

      {/* Bulk Upload Dialog */}
      <Dialog
        header="Bulk Upload Products from Excel"
        visible={bulkUploadDialogVisible}
        style={{ width: "90vw", maxWidth: "600px" }}
        onHide={() => {
          setBulkUploadDialogVisible(false);
          setBulkUploadFile(null);
          fileUploadRef.current?.clear();
        }}
        modal
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-600">
              Download the Excel template, fill it with your product data, and
              upload it here. The system will validate all products and save the
              valid ones to the database.
            </p>
            <p className="text-sm text-gray-600 font-semibold">
              After upload, you'll receive two Excel files:
            </p>
            <ul className="text-sm text-gray-600 list-disc ml-5">
              <li>
                <strong>Success File:</strong> Products successfully uploaded
                with their IDs
              </li>
              <li>
                <strong>Failure File:</strong> Products that failed validation
                with error details
              </li>
            </ul>
          </div>

          <Button
            label="Download Template"
            icon="pi pi-download"
            onClick={handleDownloadTemplate}
            className="w-full"
            severity="help"
          />

          <div className="border-t pt-4">
            <label className="block text-sm font-semibold mb-2">
              Upload Filled Template
            </label>
            <FileUpload
              ref={fileUploadRef}
              mode="basic"
              name="bulkUpload"
              accept=".xlsx,.xls"
              maxFileSize={5000000}
              onSelect={handleBulkUploadSelect}
              chooseLabel="Choose Excel File"
              className="w-full"
              auto={false}
            />
            {bulkUploadFile && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {bulkUploadFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setBulkUploadDialogVisible(false);
                setBulkUploadFile(null);
                fileUploadRef.current?.clear();
              }}
              className="p-button-text"
              disabled={isBulkUploading}
            />
            <Button
              label={isBulkUploading ? "Uploading..." : "Upload Products"}
              icon={isBulkUploading ? "pi pi-spin pi-spinner" : "pi pi-upload"}
              onClick={handleBulkUploadSubmit}
              disabled={!bulkUploadFile || isBulkUploading}
              severity="success"
            />
          </div>
        </div>
      </Dialog>

      {/* Add Category Dialog removed - now in separate CategoryManagement screen */}

      {/* Bulk Upload Section - Top of Page */}
      {!isEditMode && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4 border border-blue-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-1">
                <i className="pi pi-file-excel mr-2"></i>
                Bulk Upload Products
              </h3>
              <p className="text-sm text-gray-600">
                Upload multiple products at once using an Excel file. Download
                the template, fill it, and upload to save time.
              </p>
            </div>
            <Button
              label="Bulk Upload"
              icon="pi pi-cloud-upload"
              onClick={() => setBulkUploadDialogVisible(true)}
              severity="info"
              className="whitespace-nowrap"
            />
          </div>
        </div>
      )}

      {/* Main Product Form */}
      <div className="flex flex-col gap-3 w-full">
        {/* Media Section */}
        <div className="bg-blue-100 p-4 pt-3 rounded">
          <label className="text-[1rem] font-bold">Media</label>
          <div className="flex flex-col gap-3 mt-3">
            <div className="flex items-center w-full justify-between">
              <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
                Product Images
              </label>
              <div className="flex gap-2 w-full">
                <Button
                  icon="pi pi-upload"
                  severity="secondary"
                  onClick={handleFileUpload}
                  className="flex-1 md:hidden!"
                  tooltip="Upload Images"
                  tooltipOptions={{ position: "top" }}
                />
                <Button
                  icon="pi pi-upload"
                  label="Upload"
                  severity="secondary"
                  onClick={handleFileUpload}
                  className="flex-1 hidden! md:flex!"
                />
                <Button
                  icon="pi pi-camera"
                  severity="secondary"
                  onClick={handleCameraClick}
                  className="flex-1 md:hidden!"
                  tooltip="Capture Images"
                  tooltipOptions={{ position: "top" }}
                />
                <Button
                  icon="pi pi-camera"
                  label="Camera"
                  severity="secondary"
                  onClick={handleCameraClick}
                  className="flex-1 hidden! md:flex!"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleCameraCapture}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                style={{ display: "none" }}
                onChange={handleCameraCapture}
              />
            </div>

            {/* Image Thumbnails */}
            {productImages.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.75rem] text-gray-600">
                    {productImages.length} image(s) added
                  </span>
                  {productImages.length > 3 && (
                    <Button
                      icon="pi pi-images"
                      label="See All"
                      size="small"
                      text
                      onClick={() => setGalleriaVisible(true)}
                    />
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {productImages.slice(0, 4).map((img, index) => (
                    <div
                      key={img.id}
                      className="relative"
                      style={{
                        width: "60px",
                        height: "60px",
                        border:
                          primaryImageIndex === index
                            ? "2px solid #3b82f6"
                            : "1px solid #ddd",
                        borderRadius: "4px",
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                      onClick={() => setGalleriaVisible(true)}
                    >
                      <img
                        src={img.url}
                        alt={img.name || `Product image ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect fill='%23f0f0f0' width='60' height='60'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='sans-serif' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      {primaryImageIndex === index && (
                        <div
                          style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            background: "#3b82f6",
                            color: "white",
                            borderRadius: "50%",
                            width: "16px",
                            height: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                          }}
                        >
                          ★
                        </div>
                      )}
                      {index === 3 && productImages.length > 4 && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(0,0,0,0.6)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          +{productImages.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barcode Details Section */}
        <div className="bg-blue-100 p-4 pt-3 rounded">
          <div className="flex items-center justify-between">
            <label className="font-bold">Barcode Details</label>
            <div className="flex gap-2">
              <Button
                icon="pi pi-sync"
                label="Generate"
                size="small"
                severity="success"
                onClick={generateBarcode}
                tooltip="Auto-generate unique barcode"
                tooltipOptions={{ position: "top" }}
              />
              <Button
                icon="pi pi-qrcode"
                label="Scan"
                size="small"
                severity="secondary"
                onClick={() => setScannerVisible(true)}
                tooltip="Scan Barcode/QR Code"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
          <div className="flex items-center w-full justify-between mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
              Barcode <span className="text-red-500">*</span>
            </label>
            <InputText
              className="p-inputtext-sm w-full p-[5px]!"
              value={productForm.barcode}
              keyfilter="int"
              maxLength="13"
              onChange={(e) => handleChange("barcode", e.target.value)}
              placeholder="Scan, generate, or enter barcode (required) - EAN-13 (13 digits)"
            />
          </div>
          <div className="flex items-center w-full justify-between mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
              SKU <span className="text-red-500">*</span>
            </label>
            <InputText
              className="p-inputtext-sm w-full p-[5px]!"
              value={productForm.skuSuffix}
              onChange={(e) =>
                handleChange("skuSuffix", e.target.value.toUpperCase())
              }
              placeholder="Stock Keeping Unit (required)"
            />
          </div>
        </div>

        {/* Basic Product Information */}
        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Product Name <span className="text-red-500">*</span>
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter product name (required)"
          />
        </div>

        <div className="flex items-start w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold mt-2">
            Description
          </label>
          <InputTextarea
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Product description (optional - up to 500 characters)"
            rows={4}
            maxLength="500"
          />
        </div>

        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Brand
          </label>
          <Dropdown
            className="w-full"
            value={productForm.brand_id || productForm.brand_name}
            options={brands}
            onChange={(e) => {
              const selected = brands.find((b) => b.value === e.value);
              if (selected) {
                setProductForm({
                  ...productForm,
                  brand_id: selected.value,
                  brand_name: selected.label,
                });
              } else {
                setProductForm({
                  ...productForm,
                  brand_id: null,
                  brand_name: e.value || "",
                });
              }
            }}
            optionLabel="label"
            optionValue="value"
            placeholder="Search or type brand name"
            editable
            itemTemplate={brandOptionTemplate}
          />
        </div>

        {/* Category Selection from Database */}
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center gap-2 min-w-[120px]">
            <label className="label-add-product text-[0.8rem] font-bold">
              Category
            </label>
            {isLoading && (
              <i
                className="pi pi-spinner pi-spin"
                style={{ fontSize: "0.8rem", color: "#3b82f6" }}
              ></i>
            )}
            <Button
              icon="pi pi-plus"
              rounded
              text
              size="small"
              severity="success"
              onClick={() => setCategoryDialogVisible(true)}
              tooltip="Add Category"
              tooltipOptions={{ position: "top" }}
              style={{ width: "1.5rem", height: "1.5rem" }}
            />
          </div>

          <Dropdown
            className="w-full"
            value={productForm.category}
            options={categories}
            onChange={(e) => handleChange("category", e.value)}
            optionLabel="label"
            optionValue="id"
            dataKey="id"
            placeholder={
              isLoading ? "Loading categories..." : "Select a Category"
            }
            filter
            disabled={isLoading || categories.length === 0}
          />
        </div>
      </div>

      {/* Pricing Details Section */}
      <div className="bg-blue-100 rounded p-4 pt-3 mt-3">
        <label className="label-add-product text-[1.1rem] font-extrabold">
          Pricing Details
        </label>
        <div className="flex flex-col items-center w-full justify-between mt-3">
          <div className="flex items-center flex-wrap md:flex-row gap-2 w-full">
            <label className="label-add-product text-[0.8rem] min-w-[100px] font-bold">
              Price <span className="text-red-500">*</span>
            </label>
            <InputText
              className="p-inputtext-sm w-full flex-1 p-[5px]!"
              value={productForm.price}
              placeholder="0.00 (required)"
              keyfilter="pnum"
              onChange={(e) => handleChange("price", e.target.value)}
            />
          </div>
          <div className="flex items-center flex-wrap md:flex-row gap-2 w-full mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[100px] font-bold">
              Unit Value
            </label>
            <InputText
              className="p-inputtext-sm w-full flex-1 p-[5px]!"
              value="1"
              readOnly
            />
          </div>
          <div className="flex items-center flex-wrap md:flex-row gap-2 w-full mt-3">
            <div className="flex items-center gap-2 min-w-[100px]">
              <label className="label-add-product text-[0.8rem] font-bold">
                Unit
              </label>
              {isLoading && (
                <i
                  className="pi pi-spinner pi-spin"
                  style={{ fontSize: "0.8rem", color: "#3b82f6" }}
                ></i>
              )}
              <Button
                icon="pi pi-plus"
                rounded
                text
                size="small"
                severity="success"
                onClick={() => setUnitDialogVisible(true)}
                tooltip="Add Unit"
                tooltipOptions={{ position: "top" }}
                style={{ width: "1.5rem", height: "1.5rem" }}
              />
            </div>
            <Dropdown
              className="flex-1 flex-wrap w-full"
              value={productForm.unit}
              options={units}
              optionLabel="label"
              optionValue="symbol"
              dataKey="symbol"
              optionGroupLabel="category"
              optionGroupChildren="items"
              onChange={(e) => handleChange("unit", e.value)}
              placeholder={isLoading ? "Loading units..." : "Select Unit"}
              filter
            />
          </div>
          <div className="flex items-center flex-wrap md:flex-row gap-2 w-full mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[100px] font-bold">
              Discount (%)
            </label>
            <InputText
              className="p-inputtext-sm w-full flex-1 p-[5px]!"
              value={productForm.discount}
              placeholder="0.00"
              keyfilter="pnum"
              onChange={(e) => handleChange("discount", e.target.value)}
            />
          </div>
          <div className="flex items-center flex-wrap md:flex-row gap-2 w-full mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[100px] font-bold">
              GST (%)
            </label>
            <InputText
              className="p-inputtext-sm w-full flex-1 p-[5px]!"
              value={productForm.cgst}
              placeholder="0.00"
              keyfilter="pnum"
              onChange={(e) => handleChange("cgst", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stock & Dates */}
      {isEditMode && (
        <div className="flex items-center w-full justify-between mt-3 gap-2">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Current Quantity
          </label>
          <div className="p-inputgroup w-full" style={{ display: "flex" }}>
            <InputText
              className="p-inputtext-sm p-[5px]! bg-gray-100"
              value={
                productForm.currentQuantity +
                (parseInt(productForm.addQuantity) || 0) -
                (parseInt(productForm.removeQuantity) || 0)
              }
              readOnly
              disabled
              placeholder="Current quantity"
              style={{ flex: 1 }}
            />
            <Button
              icon="pi pi-times"
              className="p-button-sm p-button-danger"
              onClick={handleClearAddQuantity}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center w-full justify-between mt-3">
        <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
          {isEditMode ? (
            <span style={{ color: "#16a34a" }}>Add to Stock</span>
          ) : (
            <>
              Opening Stock
              <span className="text-red-500">*</span>
            </>
          )}
        </label>
        <InputText
          className="p-inputtext-sm w-full p-[5px]!"
          value={
            isEditMode ? productForm.addQuantity : productForm.openingStock
          }
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            handleChange(isEditMode ? "addQuantity" : "openingStock", value);
          }}
          placeholder={
            isEditMode
              ? "Enter quantity to add (optional, must be > 0 if provided)"
              : "Enter opening stock (required, must be > 0)"
          }
        />
      </div>

      {isEditMode && (
        <div className="flex items-center w-full justify-between mt-3">
          <label
            className="label-add-product text-[0.8rem] min-w-[120px] font-bold"
            style={{ color: "#dc2626" }}
          >
            Remove to Stock
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.removeQuantity}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              handleChange("removeQuantity", value);
            }}
            placeholder="Enter quantity to remove (optional, must be > 0 if provided)"
          />
        </div>
      )}

      <div className="flex items-center w-full justify-between mt-3">
        <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
          Stock Alert Quantity<span className="text-red-500">*</span>
        </label>
        <InputText
          className="p-inputtext-sm w-full p-[5px]!"
          keyfilter="num"
          value={productForm.stockAlertQuantity}
          onChange={(e) => handleChange("stockAlertQuantity", e.target.value)}
          placeholder="Default: 10 (alert when quantity reaches this level)"
        />
      </div>

      <div className="flex items-center w-full mt-3">
        <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
          MFG Date
        </label>
        <Calendar
          value={productForm.mfgDate}
          onChange={(e) => handleChange("mfgDate", e.value)}
          placeholder="Enter MFG date"
          className="w-full!"
          touchUI
        />
      </div>

      <div className="flex items-center w-full justify-between mt-3">
        <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
          Expiry Date
        </label>
        <Calendar
          value={productForm.expiryDate}
          onChange={(e) => handleChange("expiryDate", e.value)}
          placeholder="Enter Expiry date"
          className="w-full!"
          touchUI
        />
      </div>

      {/* Custom Labels Section */}
      <div className="bg-blue-100 p-4 pt-3 rounded mt-3">
        <div className="flex items-center justify-between">
          <label className="text-[1rem] font-bold">Custom Fields</label>
          <Button
            icon="pi pi-plus-circle"
            label="Add Field"
            size="small"
            severity="secondary"
            onClick={addEmptyProductLabel}
            disabled={productLabels.some((l) => !l.saved)}
          />
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {productLabels.length === 0 && (
            <p className="text-[0.75rem] text-gray-600">
              No custom fields added.
            </p>
          )}
          {productLabels.map((label) => (
            <div
              key={label.id}
              className="grid md:grid-cols-[1fr_1fr_auto] grid-cols-[1fr] gap-2 items-center bg-blue-50 p-3 rounded"
            >
              {label.saved ? (
                <>
                  <div className="col-span-2 text-sm font-semibold">
                    {label.name}:{" "}
                    <span className="font-normal">{label.value}</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      severity="info"
                      className="w-6! h-6!"
                      onClick={() =>
                        updateProductLabel(label.id, "saved", false)
                      }
                      tooltip="Edit"
                      tooltipOptions={{ position: "top" }}
                    />
                    <Button
                      icon="pi pi-trash"
                      rounded
                      severity="danger"
                      className="w-6! h-6!"
                      onClick={() => removeProductLabel(label.id)}
                      tooltip="Delete"
                      tooltipOptions={{ position: "top" }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col w-full">
                    <label className="text-[0.8rem] font-semibold mb-1">
                      Label Name
                    </label>
                    <Dropdown
                      value={label.name}
                      options={labelNameOptions}
                      onChange={(e) =>
                        updateProductLabel(label.id, "name", e.value)
                      }
                      placeholder="Select label name"
                      className="w-full!"
                      filter
                      optionLabel="label"
                      optionValue="value"
                    />
                  </div>
                  <div className="flex flex-col w-full">
                    <label className="text-[0.8rem] font-semibold mb-1">
                      Label Value
                    </label>
                    <Dropdown
                      value={label.value}
                      options={getLabelValueOptions(label.name)}
                      onChange={(e) =>
                        updateProductLabel(label.id, "value", e.value)
                      }
                      placeholder="Select or type a value"
                      className="w-full!"
                      editable
                      optionLabel="label"
                      optionValue="value"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      icon="pi pi-check"
                      rounded
                      severity="success"
                      className="w-6! h-6!"
                      onClick={() => saveProductLabel(label.id)}
                      tooltip="Save"
                      tooltipOptions={{ position: "top" }}
                    />
                    <Button
                      icon="pi pi-times"
                      rounded
                      severity="secondary"
                      className="w-6! h-6!"
                      onClick={() => cancelEditProductLabel(label.id)}
                      tooltip="Cancel"
                      tooltipOptions={{ position: "top" }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Supplier Details Section */}
      <div className="mt-3 bg-blue-100 p-4 pt-3 rounded">
        <label className="font-bold">Supplier Details</label>
        <div className="flex items-center w-full justify-between mt-3">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Supplier Name
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.supplierName}
            onChange={(e) => handleChange("supplierName", e.target.value)}
          />
        </div>
        <div className="flex items-center w-full justify-between mt-3">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Supplier Contact
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.supplierContact}
            onChange={(e) => handleChange("supplierContact", e.target.value)}
          />
        </div>
      </div>

      {/* Image Gallery Dialog */}
      <Dialog
        header="Product Images"
        visible={galleriaVisible}
        style={{ width: "95vw", maxWidth: "800px" }}
        onHide={() => setGalleriaVisible(false)}
        draggable={false}
        resizable={false}
        blockScroll
      >
        <div className="flex flex-col gap-3">
          {productImages.map((img, index) => (
            <div
              key={img.id}
              className="flex flex-col gap-2 p-3 border rounded"
            >
              <div className="flex items-start gap-3">
                <img
                  src={img.url}
                  alt={img.name || "Product image"}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='sans-serif' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {img.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      inputId={`primary-${img.id}`}
                      checked={primaryImageIndex === index}
                      onChange={() => handleSetPrimaryImage(index)}
                    />
                    <label
                      htmlFor={`primary-${img.id}`}
                      className="text-xs cursor-pointer"
                    >
                      Set as Primary Image
                    </label>
                  </div>
                  <Button
                    icon="pi pi-trash"
                    label="Remove"
                    size="small"
                    severity="danger"
                    outlined
                    onClick={() => handleRemoveImage(img.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Dialog>

      {/* Add/Update Product Button */}
      <div className="flex justify-end gap-2 mt-6 pb-4">
        <Button
          label={isEditMode ? "Update Product" : "Add Product"}
          icon={isEditMode ? "pi pi-check" : "pi pi-plus"}
          severity="success"
          size="large"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full md:w-auto"
        />
      </div>

      {/* Loading Dialog */}
      <Dialog
        visible={isSubmitting}
        modal
        closable={false}
        showHeader={false}
        style={{ width: "300px" }}
        contentStyle={{
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <ProgressSpinner
          style={{ width: "50px", height: "50px" }}
          strokeWidth="4"
        />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
            {isEditMode ? "Updating Product..." : "Adding Product..."}
          </div>
          <div style={{ fontSize: "0.875rem", color: "#666" }}>Please wait</div>
        </div>
      </Dialog>

      {/* Print Slip Dialog */}
      <PrintSlip
        visible={printSlipVisible}
        onHide={() => setPrintSlipVisible(false)}
        product={slipProduct}
      />

      {/* Category Management Dialog */}
      <Dialog
        header="Category Management"
        visible={categoryDialogVisible}
        style={{ width: "90vw", maxWidth: "800px" }}
        onHide={() => {
          setCategoryDialogVisible(false);
          // Refresh categories when dialog is closed
          refetch("categories");
        }}
        modal
        dismissableMask
        draggable={false}
        resizable={false}
      >
        <CategoryManagement
          onCategoryAdded={() => {
            // Close dialog and refresh categories when a new category is added
            setCategoryDialogVisible(false);
            refetch("categories");
          }}
        />
      </Dialog>

      {/* Unit Management Dialog */}
      <Dialog
        header="Unit Management"
        visible={unitDialogVisible}
        style={{ width: "95vw", maxWidth: "1200px", maxHeight: "90vh" }}
        onHide={() => {
          setUnitDialogVisible(false);
          // Refresh units when dialog is closed
          refetch("units");
        }}
        modal
        dismissableMask
        draggable={false}
        resizable={false}
        contentStyle={{ overflow: "auto" }}
      >
        <UnitManagement />
      </Dialog>
    </>
  );
}
