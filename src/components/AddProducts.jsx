import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { useState, useRef, useEffect, useMemo } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Checkbox } from "primereact/checkbox";
import "../styles/add-product.css";
import { Calendar } from "primereact/calendar";

// New imports for refactored features
import LoadingSpinner from "./LoadingSpinner";
import QRCodeScanner from "./QRCodeScanner";
import {
  fetchCategories,
  createCategory as apiCreateCategory,
} from "../services/api/categoryService";
import { useDependentDataLoader } from "../hooks/useDependentDataLoader";

/**
 * AddProducts Component
 * Industry-standard product form with:
 * - Dynamic categories fetched from backend database
 * - QR/Barcode scanner with html5-qrcode (100% accuracy)
 * - Loading spinner for dependent API calls
 * - Proper error handling and user feedback
 * - Scalable and reusable architecture
 */
export default function AddProducts() {
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
    quantity: "",
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
  });

  // UI state
  const [variants, setVariants] = useState([]);
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [galleriaVisible, setGalleriaVisible] = useState(false);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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

  // Form field change handler
  const handleChange = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  // Variant management
  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { id: Date.now(), name: "", value: "", saved: false, editing: true },
    ]);
  };

  const handleSaveVariant = (id) => {
    const variant = variants.find((v) => v.id === id);
    if (variant && variant.name.trim() && variant.value.trim()) {
      setVariants((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, saved: true, editing: false } : v
        )
      );
      toast.current?.show({
        severity: "success",
        summary: "Label Saved",
        detail: `${variant.name}: ${variant.value}`,
        life: 2000,
      });
    } else {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Input",
        detail: "Please fill in both label name and value.",
        life: 3000,
      });
    }
  };

  const handleEditVariant = (id) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, editing: true } : v))
    );
  };

  const handleCommitVariant = (id) => {
    handleSaveVariant(id);
  };

  const handleCancelEditVariant = (id) => {
    const target = variants.find((v) => v.id === id);
    if (
      target &&
      !target.saved &&
      !target.name.trim() &&
      !target.value.trim()
    ) {
      // If both fields are empty and not saved, remove from list
      setVariants((prev) => prev.filter((v) => v.id !== id));
      return;
    }
    // Otherwise, just exit editing mode
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, editing: false } : v))
    );
  };

  const handleVariantChange = (id, field, value) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const handleRemoveVariant = (id) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

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

  const handleCameraCapture = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = files.map((file) => ({
        id: Date.now() + Math.random(),
        file: file,
        url: URL.createObjectURL(file),
        name: file.name,
      }));

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

  // QR Scanner handler
  const handleQRScanComplete = (scannedValue) => {
    handleChange("barcode", scannedValue);
    setScannerVisible(false);
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
                        alt={img.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
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
          <div className="flex items-center w-full justify-between mt-3">
            <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
              Barcode
            </label>
            <InputText
              className="p-inputtext-sm w-full p-[5px]!"
              value={productForm.barcode}
              onChange={(e) => handleChange("barcode", e.target.value)}
              placeholder="Scan or enter barcode"
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
              value={productForm.quantity}
              placeholder="00"
              onChange={(e) => handleChange("quantity", e.target.value)}
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
          value={productForm.quantity}
          onChange={(e) => handleChange("quantity", e.target.value)}
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
      <div className="mt-3">
        <div className="bg-white shadow-sm p-3">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[0.8rem] font-bold">Custom Labels</span>
            <Button
              icon="pi pi-plus-circle"
              rounded
              severity="secondary"
              onClick={handleAddVariant}
              className="w-6! h-6!"
              tooltip="Add Label"
              tooltipOptions={{ position: "top" }}
              disabled={variants.some((v) => !v.saved)}
            />
          </div>
          <div className="space-y-2">
            {variants.length === 0 && (
              <p className="text-[0.65rem] text-gray-500 italic">
                No labels added.
              </p>
            )}
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="flex flex-col md:flex-row gap-2 md:items-center p-3 rounded border border-gray-200 bg-gray-50"
              >
                {variant.editing ? (
                  <div className="flex flex-col md:flex-row gap-2 flex-1">
                    <InputText
                      className="p-[5px]! flex-1"
                      value={variant.name}
                      onChange={(e) =>
                        handleVariantChange(variant.id, "name", e.target.value)
                      }
                      placeholder="Label Name"
                    />
                    <InputText
                      className="p-[5px]! flex-1"
                      value={variant.value}
                      onChange={(e) =>
                        handleVariantChange(variant.id, "value", e.target.value)
                      }
                      placeholder="Label Value"
                    />
                    <div className="flex gap-2">
                      <Button
                        icon="pi pi-check"
                        rounded
                        severity="success"
                        onClick={() => handleCommitVariant(variant.id)}
                        className="w-6! h-6!"
                        tooltip="Save"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-times"
                        rounded
                        severity="secondary"
                        onClick={() => handleCancelEditVariant(variant.id)}
                        className="w-6! h-6!"
                        tooltip="Cancel"
                        tooltipOptions={{ position: "top" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-2">
                    <div className="flex-1 text-[0.95rem] md:text-[1.05rem]">
                      <span className="text-gray-900 font-black">
                        {variant.name}
                      </span>
                      <span className="mx-1 text-gray-500">:</span>
                      <span className="text-gray-900 font-medium">
                        {variant.value}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        icon="pi pi-pencil"
                        rounded
                        severity="info"
                        onClick={() => handleEditVariant(variant.id)}
                        className="w-6! h-6!"
                        tooltip="Edit"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-trash"
                        rounded
                        severity="danger"
                        onClick={() => handleRemoveVariant(variant.id)}
                        className="w-6! h-6!"
                        tooltip="Delete"
                        tooltipOptions={{ position: "top" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                  alt={img.name}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
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
    </>
  );
}
