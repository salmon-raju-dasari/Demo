import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { RadioButton } from "primereact/radiobutton";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import "./InventoryManagement.css";
import AssignmentModal from "./AssignmentModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function InventoryManagement() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStock: 0,
    lowStock: 0,
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "out_of_stock", or "low_stock"
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Product Search Filter
  const [searchType, setSearchType] = useState("productid");
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Store Selection
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storesLoading, setStoresLoading] = useState(false);

  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    fetchStores();
    fetchInventoryStats();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, activeFilter, selectedStore]);

  // ── Pagination helpers ─────────────────────────────────────────
  const invTotalPages = () => Math.ceil(totalRecords / rowsPerPage) || 1;

  const invPageNumbers = () => {
    const totalPages = invTotalPages();
    const maxVisible = 3;
    const displayPage = currentPage + 1;
    let start = Math.max(1, displayPage - 1);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const fetchInventoryStats = async () => {
    try {
      const token = localStorage.getItem("access_token");

      // If a specific store is selected, get store inventory
      if (selectedStore?.id) {
        const response = await axios.get(
          `${API_BASE_URL}/inventory/store/${selectedStore.id}/inventory`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const storeProducts = response.data || [];
        const totalProducts = storeProducts.length;
        const outOfStock = storeProducts.filter(
          (p) => parseFloat(p.current_quantity || 0) === 0,
        ).length;
        const lowStock = storeProducts.filter((p) => {
          const qty = parseFloat(p.current_quantity || 0);
          const minQty = parseFloat(p.min_stock_qty || 10);
          return qty > 0 && qty <= minQty;
        }).length;

        setStats({
          totalProducts,
          outOfStock,
          lowStock,
        });
      } else {
        // Central inventory stats
        const response = await axios.get(
          `${API_BASE_URL}/products/inventory-stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setStats({
          totalProducts: response.data.totalProducts || 0,
          outOfStock: response.data.outOfStock || 0,
          lowStock: response.data.lowStock || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
    }
  };

  const fetchStores = async () => {
    try {
      setStoresLoading(true);
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/inventory/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ensure response data is an array
      const storesData = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      // Add "Central" option at the beginning
      const storesWithCentral = [
        { id: null, store_name: "Central Inventory" },
        ...storesData,
      ];

      setStores(storesWithCentral);

      // Set Central as default if no store is selected
      if (!selectedStore) {
        setSelectedStore(storesWithCentral[0]);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      setStores([{ id: null, store_name: "Central Inventory" }]);
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      let response;

      if (selectedStore?.id) {
        // Fetch store-specific inventory
        response = await axios.get(
          `${API_BASE_URL}/inventory/store/${selectedStore.id}/inventory`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const storeProducts = response.data || [];

        // Process store inventory data
        let filteredProducts = storeProducts;
        let filteredTotal = storeProducts.length;

        // Apply filters based on activeFilter
        if (activeFilter === "out_of_stock") {
          filteredProducts = storeProducts.filter((p) => {
            const qty = parseFloat(p.current_quantity || 0);
            return qty === 0 || isNaN(qty);
          });
          filteredTotal = filteredProducts.length;
        } else if (activeFilter === "low_stock") {
          filteredProducts = storeProducts.filter((p) => {
            const qty = parseFloat(p.current_quantity || 0);
            const minQty = parseFloat(p.min_stock_qty || 10);
            return !isNaN(minQty) && minQty > 0 && qty > 0 && qty <= minQty;
          });
          filteredTotal = filteredProducts.length;
        }

        setProducts(filteredProducts);
        setTotalRecords(filteredTotal);
      } else {
        // Fetch central inventory
        const params = {
          skip: currentPage * rowsPerPage,
          limit: rowsPerPage,
        };

        if (activeFilter === "out_of_stock" || activeFilter === "low_stock") {
          params.limit = 1000;
        }

        response = await axios.get(`${API_BASE_URL}/products/getProducts`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        let filteredProducts = response.data.items || [];
        let filteredTotal = response.data.total || 0;

        if (activeFilter === "out_of_stock") {
          filteredProducts = filteredProducts.filter((p) => {
            const qty = parseFloat(p.quantity);
            return qty === 0 || isNaN(qty) || p.quantity === null;
          });
          filteredTotal = filteredProducts.length;

          const startIndex = currentPage * rowsPerPage;
          filteredProducts = filteredProducts.slice(
            startIndex,
            startIndex + rowsPerPage,
          );
        }

        if (activeFilter === "low_stock") {
          filteredProducts = filteredProducts.filter((p) => {
            const qty = parseFloat(p.quantity);
            const alertQty = parseFloat(p.stock_alert_quantity);
            return (
              !isNaN(alertQty) && alertQty > 0 && qty > 0 && qty <= alertQty
            );
          });
          filteredTotal = filteredProducts.length;

          const startIndex = currentPage * rowsPerPage;
          filteredProducts = filteredProducts.slice(
            startIndex,
            startIndex + rowsPerPage,
          );
        }

        setProducts(filteredProducts);
        setTotalRecords(filteredTotal);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (filterType) => {
    setActiveFilter(filterType);
    setCurrentPage(0); // Reset to first page when filter changes
  };

  const handleEdit = (product) => {
    navigate("/products/add", { state: { product, isEdit: true } });
  };

  const handleAssignProduct = (product) => {
    // Check if this is a store inventory item (has current_quantity) or central inventory
    const isStoreInventory = product.current_quantity !== undefined;

    // Normalize product data structure for both central and store inventory
    const normalizedProduct = {
      id: product.product_id || product.id,
      productname: product.product_name || product.productname,
      productid: product.productid,
      sku: product.product_sku || product.sku,
      barcode: product.product_barcode || product.barcode,
      quantity: isStoreInventory ? product.current_quantity : product.quantity,
      price: product.price || 0,
      category: product.category,
      unit: product.unit,
      isFromStore: isStoreInventory,
      sourceStoreId: isStoreInventory ? product.store_id : null,
      sourceStoreName: isStoreInventory ? selectedStore?.store_name : null,
    };

    setSelectedProduct(normalizedProduct);
    setShowAssignmentModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignmentModal(false);
    setSearchValue("");
    // Refresh the products list and stats to reflect any quantity changes
    fetchProducts();
    fetchInventoryStats();
  };

  const searchProducts = async () => {
    if (!searchValue.trim()) {
      // If search is empty, show all products
      await fetchProducts();
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      // If a store is selected, filter within that store's inventory
      if (selectedStore?.id) {
        const response = await axios.get(
          `${API_BASE_URL}/inventory/store/${selectedStore.id}/inventory`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const storeProducts = response.data || [];

        // Client-side filtering based on search type
        const filteredProducts = storeProducts.filter((product) => {
          const searchVal = searchValue.toLowerCase();

          if (searchType === "barcode") {
            return product.product_barcode?.toLowerCase().includes(searchVal);
          } else if (searchType === "productid") {
            return product.productid?.toLowerCase().includes(searchVal);
          } else if (searchType === "sku") {
            return product.product_sku?.toLowerCase().includes(searchVal);
          }
          return false;
        });

        setProducts(filteredProducts);
        setTotalRecords(filteredProducts.length);
        setCurrentPage(0);
      } else {
        // Search in central inventory
        const response = await axios.get(
          `${API_BASE_URL}/inventory/search-products`,
          {
            params: {
              search_type: searchType,
              search_value: searchValue,
            },
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setProducts(response.data || []);
        setTotalRecords(response.data?.length || 0);
        setCurrentPage(0);
      }
    } catch (err) {
      console.error("Error searching products:", err);
      setProducts([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = async () => {
    await searchProducts();
    setShowFilterModal(false);
  };

  const handleClearFilter = () => {
    setSearchValue("");
    setSearchType("productid");
    setShowFilterModal(false);
    fetchProducts();
  };

  const getStockSeverity = (quantity) => {
    if (quantity === 0 || quantity === null) return "danger";
    if (quantity < 10) return "warning";
    return "success";
  };

  const productNameTemplate = (rowData) => {
    // Handle both central inventory (productname) and store inventory (product_name)
    return rowData.product_name || rowData.productname || "N/A";
  };

  const quantityBodyTemplate = (rowData) => {
    // Handle both central inventory (quantity) and store inventory (current_quantity)
    const qty = rowData.current_quantity ?? rowData.quantity ?? 0;
    const unit = rowData.unit || "";
    return (
      <Tag
        value={`${Number(qty).toFixed(2)} ${unit}`}
        severity={getStockSeverity(qty)}
      />
    );
  };

  const actionsBodyTemplate = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
        <Button
          icon="pi pi-share-alt"
          className="p-button-rounded p-button-text p-button-sm p-button-info"
          onClick={() => handleAssignProduct(rowData)}
          tooltip="Assign to Stores"
          tooltipOptions={{ position: "top" }}
        />
        {selectedStore?.id === null && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm"
            onClick={() => handleEdit(rowData)}
            tooltip="Edit Product"
            tooltipOptions={{ position: "top" }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Inventory Overview</h1>
        <Button
          icon="pi pi-filter"
          className="filter-icon-btn"
          onClick={() => setShowFilterModal(true)}
          tooltip="Search Filter"
          tooltipOptions={{ position: "bottom" }}
        />
      </div>

      <div className="store-filter-section">
        <Dropdown
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.value)}
          options={Array.isArray(stores) ? stores : []}
          optionLabel="store_name"
          placeholder="Select Store"
          loading={storesLoading}
          filter
          filterBy="store_name"
          showFilterClear
          className="store-filter-dropdown"
          itemTemplate={(option) => (
            <div className="store-dropdown-item">
              <span>{option.store_name}</span>
              {option.id && (
                <span className="store-location">{option.store_city}</span>
              )}
            </div>
          )}
          valueTemplate={(value) => {
            if (!value) return "Select Store";
            return <span>{value.store_name}</span>;
          }}
        />
      </div>

      <div className="stats-grid">
        <div
          className={`stat-card ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => handleCardClick("all")}
        >
          <div className="stat-icon total">
            <i className="pi pi-box"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Products</div>
            <div className="stat-value">
              {loading ? "..." : (stats.totalProducts || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div
          className={`stat-card ${activeFilter === "out_of_stock" ? "active" : ""}`}
          onClick={() => handleCardClick("out_of_stock")}
        >
          <div className="stat-icon out-of-stock">
            <i className="pi pi-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Out of Stock</div>
            <div className="stat-value">
              {loading ? "..." : (stats.outOfStock || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div
          className={`stat-card ${activeFilter === "low_stock" ? "active" : ""}`}
          onClick={() => handleCardClick("low_stock")}
        >
          <div className="stat-icon low-stock">
            <i className="pi pi-exclamation-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-label">Low Stock</div>
            <div className="stat-value">
              {loading ? "..." : (stats.lowStock || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <Dialog
        header="Search Products"
        visible={showFilterModal}
        onHide={() => setShowFilterModal(false)}
        modal
        style={{ width: "90vw", maxWidth: "420px" }}
        className="filter-modal"
      >
        <div className="filter-modal-content">
          <div className="search-type-selector">
            <div className="radio-group">
              <div className="radio-option">
                <RadioButton
                  inputId="barcode"
                  name="searchType"
                  value="barcode"
                  onChange={(e) => setSearchType(e.value)}
                  checked={searchType === "barcode"}
                />
                <label htmlFor="barcode">Barcode</label>
              </div>
              <div className="radio-option">
                <RadioButton
                  inputId="productid"
                  name="searchType"
                  value="productid"
                  onChange={(e) => setSearchType(e.value)}
                  checked={searchType === "productid"}
                />
                <label htmlFor="productid">Product ID</label>
              </div>
              <div className="radio-option">
                <RadioButton
                  inputId="sku"
                  name="searchType"
                  value="sku"
                  onChange={(e) => setSearchType(e.value)}
                  checked={searchType === "sku"}
                />
                <label htmlFor="sku">SKU</label>
              </div>
            </div>
          </div>

          <div className="search-input-field">
            <InputText
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`Enter ${searchType}...`}
              onKeyPress={(e) => e.key === "Enter" && handleApplyFilter()}
            />
          </div>

          <div className="filter-modal-actions">
            <Button
              label="Apply"
              icon="pi pi-check"
              onClick={handleApplyFilter}
              loading={searchLoading}
              className="p-button-primary"
            />
            <Button
              label="Clear"
              icon="pi pi-times-circle"
              onClick={handleClearFilter}
              className="p-button-secondary"
            />
          </div>
        </div>
      </Dialog>

      <div className="inventory-table-container">
        <DataTable
          value={products}
          loading={loading}
          emptyMessage="No products found"
          stripedRows
          showGridlines
          selectionMode="single"
          selection={selectedProduct}
          onSelectionChange={(e) => setSelectedProduct(e.value)}
          dataKey="id"
          className="inventory-table"
        >
          <Column
            header="Product Name"
            body={productNameTemplate}
            sortable
            style={{ minWidth: "200px" }}
          />
          <Column
            header="Quantity"
            body={quantityBodyTemplate}
            sortable
            style={{ width: "150px" }}
          />
          <Column
            header="Actions"
            body={actionsBodyTemplate}
            style={{ width: "120px", textAlign: "center" }}
          />
        </DataTable>
      </div>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div className="inv-pagination-section">
          <div className="inv-pagination-controls">
            <button
              className="inv-pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              ← Previous
            </button>

            <div className="inv-page-numbers">
              {invPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`inv-page-number ${currentPage + 1 === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page - 1)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="inv-pagination-btn"
              onClick={() =>
                setCurrentPage((p) => Math.min(invTotalPages() - 1, p + 1))
              }
              disabled={currentPage + 1 >= invTotalPages()}
            >
              Next →
            </button>

            <div className="inv-page-size-selector">
              <label>Records per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="inv-page-size-dropdown"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="inv-pagination-info">
              Page {currentPage + 1} of {invTotalPages()} (Total: {totalRecords}
              )
            </div>
          </div>
        </div>
      )}

      {showAssignmentModal && (
        <AssignmentModal
          product={selectedProduct}
          onClose={() => setShowAssignmentModal(false)}
          onSuccess={handleAssignmentComplete}
        />
      )}
    </div>
  );
}
