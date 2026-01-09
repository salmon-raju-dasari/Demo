import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { useState, useRef, useEffect, useMemo } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import "../styles/add-product.css";
import { Calendar } from "primereact/calendar";
import { useLocation, useNavigate } from "react-router-dom";

// New imports for refactored features
import LoadingSpinner from "./LoadingSpinner";
import QRCodeScanner from "./QRCodeScanner";
import PrintSlip from "./PrintSlip";
import {
  fetchCategories,
  createCategory as apiCreateCategory,
} from "../services/api/categoryService";
import { useDependentDataLoader } from "../hooks/useDependentDataLoader";
import api from "../services/api/axios";
import {
  addProducts as addProductsAPI,
  updateProduct as updateProductAPI,
} from "../services/api/productService";
import { ProgressSpinner } from "primereact/progressspinner";

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

  // Unit categories configuration
  const units = [
    {
      category: "Weight",
      items: [
        { name: "Milligram", symbol: "mg", label: "Milligram (mg)" },
        { name: "Gram", symbol: "g", label: "Gram (g)" },
        { name: "Kilogram", symbol: "kg", label: "Kilogram (kg)" },
      ],
    },
    {
      category: "Volume",
      items: [
        { name: "Milliliter", symbol: "ml", label: "Milliliter (ml)" },
        { name: "Centiliter", symbol: "cl", label: "Centiliter (cl)" },
        { name: "Liter", symbol: "L", label: "Liter (L)" },
        { name: "Cubic meter", symbol: "m³", label: "Cubic meter (m³)" },
      ],
    },
    {
      category: "Size",
      items: [
        { name: "Millimeter", symbol: "mm", label: "Millimeter (mm)" },
        { name: "Centimeter", symbol: "cm", label: "Centimeter (cm)" },
        { name: "Meter", symbol: "m", label: "Meter (m)" },
      ],
    },
    {
      category: "Area",
      items: [
        { name: "Square meter", symbol: "m²", label: "Square meter (m²)" },
      ],
    },
    {
      category: "Per item",
      items: [{ name: "Item", symbol: "item", label: "Item (item)" }],
    },
  ];

  // Product form state
  const [productForm, setProductForm] = useState({
    productId: "",
    name: "",
    description: "",
    price: "",
    openingStock: "",
    unitValue: "",
    skuSuffix: "",
    category: null,
    unit: null,
    expiryDate: "",
    mfgDate: "",
    barcode: "",
    brand: "",
    supplierName: "",
    supplierContact: "",
    cgst: "",
    discount: "",
  });

  // UI state
  const [productLabels, setProductLabels] = useState([]);
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [galleriaVisible, setGalleriaVisible] = useState(false);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printSlipVisible, setPrintSlipVisible] = useState(false);
  const [slipProduct, setSlipProduct] = useState(null);

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
        key: "categories",
        fetcher: () => fetchCategories(),
      },
    ],
    []
  );

  // Load categories using dependent data loader
  const {
    data: dependentData,
    isLoading,
    error,
  } = useDependentDataLoader(dependencies, {
    parallel: false,
    retryCount: 3,
  });

  const categories = dependentData.categories || [];

  // Handle dependent data errors
  useEffect(() => {
    if (error && error.key === "categories") {
      toast.current?.show({
        severity: "error",
        summary: "Failed to Load Categories",
        detail:
          "Could not fetch categories from server. Please refresh the page.",
        life: 5000,
      });
    }
  }, [error]);

  // Populate form in edit mode
  useEffect(() => {
    if (isEditMode && editProduct && categories.length > 0) {
      // Find the matching category from categories list
      const matchedCategory = categories.find(
        (cat) => cat.name === editProduct.category
      );

      // Find the matching unit from units list
      let matchedUnit = null;
      for (const unitCategory of units) {
        const foundUnit = unitCategory.items.find(
          (u) => u.symbol === editProduct.unit
        );
        if (foundUnit) {
          matchedUnit = foundUnit;
          break;
        }
      }

      setProductForm({
        productId: editProduct.productid || "",
        name: editProduct.productname || "",
        description: editProduct.description || "",
        price: editProduct.price || "",
        openingStock: editProduct.quantity || "",
        unitValue: editProduct.unitvalue || "",
        skuSuffix: editProduct.sku || "",
        category: matchedCategory || null,
        unit: matchedUnit || null,
        expiryDate: editProduct.expirydate
          ? new Date(editProduct.expirydate)
          : "",
        mfgDate: editProduct.mfgdate ? new Date(editProduct.mfgdate) : "",
        barcode: editProduct.barcode || "",
        brand: editProduct.brand || "",
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
          }))
        );
      }

      // Handle custom fields if available
      if (editProduct.customfields && Array.isArray(editProduct.customfields)) {
        const labels = editProduct.customfields.map((field, index) => ({
          id: Date.now() + index,
          name: field.fieldname || "",
          value: field.fieldvalue || "",
          saved: true,
        }));
        setProductLabels(labels);
      }
    }
  }, [isEditMode, editProduct, categories]);

  // Form field change handler
  const handleChange = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
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
        l.name.trim().toLowerCase() === label.name.trim().toLowerCase()
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

    setProductLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, saved: true } : l))
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
          // If changing label name, fetch values for the new label
          if (field === "name" && value !== l.name) {
            fetchLabelValues(value);
          }
          return { ...l, [field]: value };
        }
        return l;
      })
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
        .filter(Boolean)
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
        `/custom-labels-values/${encodeURIComponent(labelName)}`
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

  // Category management
  const handleAddCategory = () => {
    setCategoryDialogVisible(true);
  };

  const handleCategorySubmit = async () => {
    if (!newCategory.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Input",
        detail: "Please enter a category name.",
        life: 3000,
      });
      return;
    }

    setIsCreatingCategory(true);
    try {
      await apiCreateCategory({ name: newCategory, description: "" });
      toast.current?.show({
        severity: "success",
        summary: "Category Added",
        detail: `Category "${newCategory}" has been added successfully!`,
        life: 3000,
      });
      setNewCategory("");
      setCategoryDialogVisible(false);
      // Refresh categories list
      window.location.reload(); // In production, use proper state management
    } catch (err) {
      console.error("Error creating category:", err);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.message || "Failed to create category",
        life: 4000,
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCategoryCancel = () => {
    setNewCategory("");
    setCategoryDialogVisible(false);
  };

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
        })
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
    if (!productForm.productId?.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Product ID is required",
        life: 3000,
      });
      return;
    }
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
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Price must be greater than 0",
        life: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare product data
      const productData = {
        productid: productForm.productId.trim(),
        productname: productForm.name.trim(),
        barcode: productForm.barcode.trim(),
        sku: productForm.skuSuffix?.trim() || null,
        description: productForm.description?.trim() || null,
        brand: productForm.brand?.trim() || null,
        category: productForm.category || null,
        price: parseFloat(productForm.price),
        unitvalue: productForm.unitValue
          ? parseInt(productForm.unitValue)
          : null,
        unit: productForm.unit || null,
        discount: productForm.discount ? parseInt(productForm.discount) : 0,
        gst: productForm.cgst ? parseInt(productForm.cgst) : 0,
        openingstock: productForm.openingStock
          ? parseInt(productForm.openingStock)
          : 0,
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
            [l.name]: l.value,
          })),
      };

      let result;

      // Call appropriate API based on mode
      if (isEditMode && editProduct?.id) {
        result = await updateProductAPI(editProduct.id, productData);
      } else {
        result = await addProductsAPI([productData]);
      }

      if (result.success) {
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
      } else {
        const errorMessage =
          result.error?.message ||
          result.error?.detail?.message ||
          (isEditMode ? "Failed to update product" : "Failed to add product");
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: errorMessage,
          life: 5000,
        });
      }
    } catch (error) {
      console.error(
        isEditMode ? "Error updating product:" : "Error adding product:",
        error
      );
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "An unexpected error occurred. Please try again.",
        life: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toast ref={toast} position="top-right" appendTo={document.body} />

      {/* Loading Spinner for dependent data */}
      <LoadingSpinner
        isLoading={isLoading}
        message="Loading product categories..."
        fullScreen={true}
        size="md"
      />

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleQRScanComplete}
        dialogHeader="Scan Product Barcode/QR Code"
      />

      {/* Add Category Dialog */}
      <Dialog
        header="Add New Category"
        visible={categoryDialogVisible}
        style={{ width: "90vw", maxWidth: "400px" }}
        onHide={handleCategoryCancel}
        draggable={false}
        resizable={false}
        blockScroll
      >
        <div className="flex flex-col gap-4 p-3">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="category-name"
              className="text-[0.9rem] font-semibold"
            >
              Category Name
            </label>
            <InputText
              id="category-name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="w-full"
              disabled={isCreatingCategory}
            />
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={handleCategoryCancel}
              className="px-4"
              disabled={isCreatingCategory}
            />
            <Button
              label="Add"
              severity="success"
              onClick={handleCategorySubmit}
              className="px-4"
              loading={isCreatingCategory}
            />
          </div>
        </div>
      </Dialog>

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
              Barcode
            </label>
            <InputText
              className="p-inputtext-sm w-full p-[5px]!"
              value={productForm.barcode}
              onChange={(e) => handleChange("barcode", e.target.value)}
              placeholder="Scan, generate, or enter barcode"
            />
          </div>
          <div className="flex items-center w-full justify-between mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
              SKU
            </label>
            <InputText
              className="p-inputtext-sm w-full p-[5px]!"
              value={productForm.skuSuffix}
              onChange={(e) => handleChange("skuSuffix", e.target.value)}
              placeholder="Stock Keeping Unit"
            />
          </div>
        </div>

        {/* Basic Product Information */}
        {/* Product ID above Product Name */}
        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Product ID
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.productId}
            onChange={(e) => handleChange("productId", e.target.value)}
            placeholder="Enter product ID"
          />
        </div>

        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Product Name
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter product name"
          />
        </div>

        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Description
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Product description"
          />
        </div>

        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Brand
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.brand}
            onChange={(e) => handleChange("brand", e.target.value)}
            placeholder="Product brand"
          />
        </div>

        {/* Category Selection from Database */}
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center gap-3 min-w-[120px]">
            <label className="label-add-product text-[0.8rem] font-bold">
              Category
            </label>
            <Button
              icon="pi pi-plus-circle"
              rounded
              severity="secondary"
              onClick={handleAddCategory}
              className="w-6! h-6!"
              tooltip="Add Category"
              tooltipOptions={{ position: "top" }}
            />
          </div>

          <Dropdown
            className="w-full"
            value={productForm.category}
            options={categories}
            onChange={(e) => handleChange("category", e.value)}
            optionLabel="label"
            optionValue="value"
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
        <label className="label-add-product text-[1rem] font-bold">
          Pricing Details
        </label>
        <div className="flex flex-col items-center w-full justify-between mt-3">
          <div className="flex items-center flex-wrap md:flex-row gap-2 w-full">
            <label className="label-add-product text-[0.8rem] min-w-[100px] font-bold">
              Price
            </label>
            <InputText
              className="p-inputtext-sm w-full flex-1 p-[5px]!"
              value={productForm.price}
              placeholder="0.00"
              onChange={(e) => handleChange("price", e.target.value)}
            />
          </div>
          <div className="flex items-center flex-wrap md:flex-row gap-2 w-full mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[100px] font-bold">
              Unit Value
            </label>
            <InputText
              className="p-inputtext-sm w-full flex-1 p-[5px]!"
              value={productForm.unitValue}
              placeholder="00"
              onChange={(e) => handleChange("unitValue", e.target.value)}
            />
          </div>
          <div className="flex items-center flex-wrap md:flex-row gap-2 w-full mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[100px] font-bold">
              Unit
            </label>
            <Dropdown
              className="flex-1 flex-wrap w-full"
              value={productForm.unit}
              options={units}
              optionLabel="label"
              optionValue="symbol"
              optionGroupLabel="category"
              optionGroupChildren="items"
              onChange={(e) => handleChange("unit", e.value)}
              placeholder="Select Unit"
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
              onChange={(e) => handleChange("cgst", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stock & Dates */}
      <div className="flex items-center w-full justify-between mt-3">
        <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
          Opening Stock
        </label>
        <InputText
          className="p-inputtext-sm w-full p-[5px]!"
          value={productForm.openingStock}
          onChange={(e) => handleChange("openingStock", e.target.value)}
          placeholder="Enter opening stock"
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
                      editable
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
                      placeholder="Select or type label value"
                      className="w-full!"
                      filter
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
    </>
  );
}
