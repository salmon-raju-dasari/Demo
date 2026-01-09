import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Chip } from "primereact/chip";
import { Paginator } from "primereact/paginator";
import { ProgressSpinner } from "primereact/progressspinner";
import { getAllProducts, deleteProduct } from "../services/api/productService";
import PrintSlip from "./PrintSlip";
import "../styles/all-products.css";

export default function AllProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterField, setFilterField] = useState(null);
  const [filterValue, setFilterValue] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);
  const [printSlipVisible, setPrintSlipVisible] = useState(false);
  const [slipProduct, setSlipProduct] = useState(null);
  const toast = useRef(null);
  const navigate = useNavigate();

  // Helper function to handle base64 images
  const getImageSrc = (url) => {
    if (!url) return null;
    // If already a data URL, use as is
    if (url.startsWith("data:image")) return url;
    // Otherwise assume it's a regular URL
    return url;
  };

  // Filter options
  const filterOptions = [
    { label: "Product Name", value: "productname" },
    { label: "Product ID", value: "productid" },
    { label: "Barcode", value: "barcode" },
    { label: "SKU", value: "sku" },
    { label: "Category", value: "category" },
    { label: "Brand", value: "brand" },
    { label: "Description", value: "description" },
  ];

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, [currentPage, rowsPerPage]);

  // Filter products based on active filters
  useEffect(() => {
    let filtered = [...products];

    // Apply all active filters (conjunction)
    if (activeFilters.length > 0) {
      filtered = filtered.filter((product) => {
        return activeFilters.every((filter) => {
          const fieldValue = product[filter.field];
          if (fieldValue === null || fieldValue === undefined) return false;

          const productValue = String(fieldValue).toLowerCase();
          const filterVal = filter.value.toLowerCase();

          return productValue.includes(filterVal);
        });
      });
    }

    setFilteredProducts(filtered);
  }, [activeFilters, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const skip = currentPage * rowsPerPage;
      const result = await getAllProducts(skip, rowsPerPage);
      if (result.success) {
        const data = result.data.items || result.data;
        setProducts(data);
        setFilteredProducts(data);
        setTotalRecords(result.data.total || data.length);
      } else {
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: result.error?.message || "Failed to load products",
          life: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "An unexpected error occurred while loading products",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    // Navigate to add products page with product data for editing
    navigate("/products/add", { state: { product, isEdit: true } });
  };

  const handleView = (product) => {
    setViewingProduct(product);
    setViewDialogVisible(true);
  };

  const handleDelete = (product) => {
    confirmDialog({
      message: `Are you sure you want to delete "${product.productname}"?`,
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const result = await deleteProduct(product.id);
          if (result.success) {
            toast.current?.show({
              severity: "success",
              summary: "Success",
              detail: "Product deleted successfully",
              life: 3000,
            });
            // Refresh products list
            fetchProducts();
          } else {
            toast.current?.show({
              severity: "error",
              summary: "Error",
              detail: result.error?.message || "Failed to delete product",
              life: 4000,
            });
          }
        } catch (error) {
          console.error("Error deleting product:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: "An unexpected error occurred while deleting product",
            life: 4000,
          });
        }
      },
    });
  };

  const handleSearch = () => {
    if (!filterField || !filterValue.trim()) return;

    const filterLabel =
      filterOptions.find((opt) => opt.value === filterField)?.label ||
      filterField;

    // Check if filter already exists
    const exists = activeFilters.some(
      (f) => f.field === filterField && f.value === filterValue.trim()
    );

    if (exists) {
      toast.current?.show({
        severity: "info",
        summary: "Filter Already Active",
        detail: "This filter is already applied",
        life: 3000,
      });
      return;
    }

    // Add new filter
    setActiveFilters((prev) => [
      ...prev,
      {
        field: filterField,
        value: filterValue.trim(),
        label: filterLabel,
      },
    ]);

    // Clear input fields
    setFilterField(null);
    setFilterValue("");
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters((prev) =>
      prev.filter(
        (f) =>
          !(
            f.field === filterToRemove.field && f.value === filterToRemove.value
          )
      )
    );
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
    setFilterField(null);
    setFilterValue("");
  };

  const handlePrintSlip = (product) => {
    setSlipProduct(product);
    setPrintSlipVisible(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getStockSeverity = (stock) => {
    if (stock === 0) return "danger";
    if (stock < 10) return "warning";
    return "success";
  };

  const header = (product) => {
    const hasImage =
      product.productimages &&
      Array.isArray(product.productimages) &&
      product.productimages.length > 0 &&
      product.productimages[0];
    const imageUrl = hasImage ? getImageSrc(product.productimages[0]) : null;

    return (
      <div className="product-image-container">
        {imageUrl ? (
          <img
            alt={product.productname}
            src={imageUrl}
            className="product-image"
            onError={(e) => {
              // Hide the broken image and show placeholder
              e.target.style.display = "none";
              e.target.nextSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`product-image-placeholder ${imageUrl ? "hidden" : ""}`}
        >
          <i
            className="pi pi-image"
            style={{ fontSize: "3rem", color: "#ccc" }}
          />
          <span>No Image</span>
        </div>
        {product.discount > 0 && (
          <div className="discount-badge">
            <Tag value={`${product.discount}% OFF`} severity="danger" />
          </div>
        )}
        <Button
          icon="pi pi-eye"
          className="view-details-btn"
          rounded
          outlined
          severity="info"
          onClick={(e) => {
            e.stopPropagation();
            handleView(product);
          }}
          tooltip="View Details"
          tooltipOptions={{ position: "left" }}
        />
      </div>
    );
  };

  const footer = (product) => (
    <div className="product-footer">
      <Button
        icon="pi pi-print"
        label="Print"
        className="p-button-sm"
        outlined
        severity="success"
        onClick={() => handlePrintSlip(product)}
      />
      <Button
        icon="pi pi-pencil"
        label="Edit"
        className="p-button-sm"
        outlined
        onClick={() => handleEdit(product)}
      />
      <Button
        icon="pi pi-trash"
        label="Delete"
        className="p-button-sm"
        outlined
        severity="danger"
        onClick={() => handleDelete(product)}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <ProgressSpinner />
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <div className="all-products-container">
        {/* Header */}
        <div className="products-header">
          <h1 className="page-title">All Products</h1>
          <Button
            label="Add Product"
            icon="pi pi-plus"
            onClick={() => navigate("/products/add")}
            className="add-product-btn"
          />
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-controls filter-column-layout">
            <Dropdown
              value={filterField}
              options={filterOptions}
              onChange={(e) => setFilterField(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Select field to filter"
              className="filter-dropdown"
              filter
            />
            <InputText
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={
                filterField
                  ? `Search by ${
                      filterOptions.find((opt) => opt.value === filterField)
                        ?.label || ""
                    }`
                  : "Select a field first"
              }
              className="filter-input"
              disabled={!filterField}
              onKeyPress={(e) => {
                if (e.key === "Enter" && filterField && filterValue.trim()) {
                  handleSearch();
                }
              }}
            />
            <div className="filter-btn-row">
              <Button
                icon="pi pi-search"
                label="Search"
                className="p-button-primary search-btn"
                onClick={handleSearch}
                disabled={!filterField || !filterValue.trim()}
              />
              <Button
                icon="pi pi-times"
                label="Clear"
                className="p-button-outlined p-button-secondary clear-filter-btn"
                onClick={handleClearFilters}
                disabled={
                  activeFilters.length === 0 && !filterField && !filterValue
                }
              />
            </div>
          </div>

          {/* Active Filters Chips */}
          {activeFilters.length > 0 && (
            <div className="active-filters-chips">
              {activeFilters.map((filter, index) => (
                <Chip
                  key={`${filter.field}-${index}`}
                  label={`${filter.label}: ${filter.value}`}
                  removable
                  onRemove={() => removeFilter(filter)}
                  className="filter-chip"
                />
              ))}
            </div>
          )}

          <div className="filter-results">
            <span className="results-count">
              {loading
                ? "Loading..."
                : filteredProducts.length === 0
                ? "No products found"
                : `Showing ${filteredProducts.length} of ${products.length} product(s)`}
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <i
              className="pi pi-inbox"
              style={{ fontSize: "4rem", color: "#ccc" }}
            />
            <h3>No Products Found</h3>
            <p>
              {products.length === 0
                ? "Get started by adding your first product"
                : "Try adjusting your filters"}
            </p>
            {products.length === 0 && (
              <Button
                label="Add Your First Product"
                icon="pi pi-plus"
                onClick={() => navigate("/products/add")}
                className="mt-3"
              />
            )}
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                title={product.productname}
                subTitle={
                  <div className="product-subtitle">
                    <span>{product.productid}</span>
                    {product.barcode && (
                      <span className="barcode-badge">
                        <i className="pi pi-qrcode" /> {product.barcode}
                      </span>
                    )}
                  </div>
                }
                header={header(product)}
                footer={footer(product)}
                className="product-card"
              >
                <div className="product-details">
                  {/* Price & Stock Row */}
                  <div className="price-stock-row">
                    <div className="price-section">
                      <span className="price-value">
                        {formatPrice(product.price)}
                      </span>
                      {product.discount > 0 && (
                        <span className="discount-text">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <Tag
                      value={`${product.quantity || 0} ${
                        product.unit || "units"
                      }`}
                      severity={getStockSeverity(product.quantity || 0)}
                      className="stock-tag"
                    />
                  </div>

                  {/* Brand & Category Tags */}
                  <div className="product-tags">
                    {product.brand && (
                      <Chip
                        label={product.brand}
                        icon="pi pi-tag"
                        className="compact-chip"
                      />
                    )}
                    {product.category && (
                      <Chip
                        label={product.category}
                        icon="pi pi-folder"
                        className="compact-chip"
                      />
                    )}
                  </div>

                  {/* Compact Info Grid */}
                  <div className="compact-info-grid">
                    {product.sku && (
                      <div className="info-item">
                        <i className="pi pi-box" />
                        <span>{product.sku}</span>
                      </div>
                    )}
                    {product.gst > 0 && (
                      <div className="info-item">
                        <i className="pi pi-percentage" />
                        <span>GST {product.gst}%</span>
                      </div>
                    )}
                    {product.suppliername && (
                      <div className="info-item">
                        <i className="pi pi-user" />
                        <span>{product.suppliername}</span>
                      </div>
                    )}
                    {product.expirydate && (
                      <div className="info-item">
                        <i className="pi pi-calendar" />
                        <span>
                          Exp:{" "}
                          {new Date(product.expirydate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description - Single Line */}
                  {product.description && (
                    <p className="product-description-compact">
                      {product.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredProducts.length > 0 && (
          <div className="pagination-container">
            <Paginator
              first={currentPage * rowsPerPage}
              rows={rowsPerPage}
              totalRecords={totalRecords}
              rowsPerPageOptions={[12, 24, 36, 48]}
              onPageChange={(e) => {
                setCurrentPage(e.page);
                setRowsPerPage(e.rows);
              }}
            />
          </div>
        )}
      </div>

      {/* View Product Details Dialog */}
      <Dialog
        header="Product Details"
        visible={viewDialogVisible}
        style={{ width: "90vw", maxWidth: "700px" }}
        onHide={() => setViewDialogVisible(false)}
        modal
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              label="Print Slip"
              icon="pi pi-print"
              severity="success"
              onClick={() => {
                handlePrintSlip(viewingProduct);
                setViewDialogVisible(false);
              }}
            />
            <Button
              label="Close"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setViewDialogVisible(false)}
            />
          </div>
        }
      >
        {viewingProduct && (
          <div className="product-view-dialog">
            {/* Product Images */}
            {viewingProduct.productimages &&
              viewingProduct.productimages.length > 0 && (
                <div className="dialog-section">
                  <h3>Product Images</h3>
                  <div className="product-images-grid">
                    {viewingProduct.productimages.map((img, index) => (
                      <img
                        key={index}
                        src={getImageSrc(img)}
                        alt={`${viewingProduct.productname} ${index + 1}`}
                        className="dialog-product-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* Basic Information */}
            <div className="dialog-section">
              <h3>Basic Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Product ID:</label>
                  <span>{viewingProduct.productid}</span>
                </div>
                <div className="detail-item">
                  <label>Product Name:</label>
                  <span>{viewingProduct.productname}</span>
                </div>
                <div className="detail-item">
                  <label>Barcode:</label>
                  <span>{viewingProduct.barcode}</span>
                </div>
                {viewingProduct.sku && (
                  <div className="detail-item">
                    <label>SKU:</label>
                    <span>{viewingProduct.sku}</span>
                  </div>
                )}
                {viewingProduct.brand && (
                  <div className="detail-item">
                    <label>Brand:</label>
                    <span>{viewingProduct.brand}</span>
                  </div>
                )}
                {viewingProduct.category && (
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{viewingProduct.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {viewingProduct.description && (
              <div className="dialog-section">
                <h3>Description</h3>
                <p className="description-text">{viewingProduct.description}</p>
              </div>
            )}

            {/* Pricing & Stock */}
            <div className="dialog-section">
              <h3>Pricing & Stock</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Price:</label>
                  <span className="highlight-value">
                    {formatPrice(viewingProduct.price)}
                  </span>
                </div>
                {viewingProduct.discount > 0 && (
                  <div className="detail-item">
                    <label>Discount:</label>
                    <span className="discount-value">
                      {viewingProduct.discount}%
                    </span>
                  </div>
                )}
                <div className="detail-item">
                  <label>Stock Quantity:</label>
                  <span>{viewingProduct.quantity || 0}</span>
                </div>
                {viewingProduct.unit && (
                  <div className="detail-item">
                    <label>Unit:</label>
                    <span>{viewingProduct.unit}</span>
                  </div>
                )}
                {viewingProduct.unitvalue && (
                  <div className="detail-item">
                    <label>Unit Value:</label>
                    <span>{viewingProduct.unitvalue}</span>
                  </div>
                )}
                {viewingProduct.gst > 0 && (
                  <div className="detail-item">
                    <label>GST:</label>
                    <span>{viewingProduct.gst}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            {(viewingProduct.mfgdate || viewingProduct.expirydate) && (
              <div className="dialog-section">
                <h3>Important Dates</h3>
                <div className="detail-grid">
                  {viewingProduct.mfgdate && (
                    <div className="detail-item">
                      <label>Manufacturing Date:</label>
                      <span>
                        {new Date(viewingProduct.mfgdate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {viewingProduct.expirydate && (
                    <div className="detail-item">
                      <label>Expiry Date:</label>
                      <span>
                        {new Date(
                          viewingProduct.expirydate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Supplier Information */}
            {(viewingProduct.suppliername ||
              viewingProduct.suppliercontact) && (
              <div className="dialog-section">
                <h3>Supplier Information</h3>
                <div className="detail-grid">
                  {viewingProduct.suppliername && (
                    <div className="detail-item">
                      <label>Supplier Name:</label>
                      <span>{viewingProduct.suppliername}</span>
                    </div>
                  )}
                  {viewingProduct.suppliercontact && (
                    <div className="detail-item">
                      <label>Supplier Contact:</label>
                      <span>{viewingProduct.suppliercontact}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {viewingProduct.customfields &&
              viewingProduct.customfields.length > 0 && (
                <div className="dialog-section">
                  <h3>Custom Fields</h3>
                  <div className="detail-grid">
                    {viewingProduct.customfields.map((field, index) => (
                      <div key={index} className="detail-item">
                        <label>{field.fieldname}:</label>
                        <span>{field.fieldvalue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
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
