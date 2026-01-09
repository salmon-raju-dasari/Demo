import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { Paginator } from "primereact/paginator";
import { Dropdown } from "primereact/dropdown";
import { Chip } from "primereact/chip";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import api from "../services/api/axios";
import "../styles/storemanagement.css";

/**
 * StoreManagement Component
 * Enterprise-grade store management with:
 * - Card-based UI like Employees
 * - Complete store CRUD operations
 * - Filtering and search functionality
 * - Primary key (store_id) used for all operations
 */
export default function StoreManagement() {
  // Country list
  const countries = [
    { name: "India", code: "IN" },
    { name: "United States", code: "US" },
    { name: "United Kingdom", code: "GB" },
    { name: "Canada", code: "CA" },
    { name: "Australia", code: "AU" },
    { name: "Germany", code: "DE" },
    { name: "France", code: "FR" },
    { name: "Japan", code: "JP" },
    { name: "China", code: "CN" },
    { name: "Brazil", code: "BR" },
    { name: "Mexico", code: "MX" },
    { name: "Singapore", code: "SG" },
    { name: "United Arab Emirates", code: "AE" },
    { name: "Saudi Arabia", code: "SA" },
    { name: "South Africa", code: "ZA" },
  ];

  // Store form state
  const [storeForm, setStoreForm] = useState({
    store_name: "",
    store_address: "",
    store_city: "",
    store_state: "",
    store_country: null,
    store_pincode: "",
  });

  // UI state
  const [stores, setStores] = useState([]); // Display data (paginated)
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [viewingStore, setViewingStore] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [filterField, setFilterField] = useState(null);
  const [filterValue, setFilterValue] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const toast = useRef(null);

  // Filter options
  const filterOptions = [
    { label: "Store Name", value: "store_name" },
    { label: "City", value: "store_city" },
    { label: "State", value: "store_state" },
    { label: "Country", value: "store_country" },
    { label: "Pincode", value: "store_pincode" },
  ];

  // Fetch stores from backend with pagination and filtering
  const fetchStores = useCallback(
    async (
      page = currentPage,
      limit = rowsPerPage,
      filters = activeFilters
    ) => {
      try {
        setLoading(true);
        const skip = page * limit;

        // Build URL with query parameters (add trailing slash to avoid 307 redirect)
        let url = `/stores/?skip=${skip}&limit=${limit}`;

        // Use multiple filters if available
        if (filters && filters.length > 0) {
          url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
        }

        const response = await api.get(url);

        // Handle paginated response from backend
        if (response.data.items && Array.isArray(response.data.items)) {
          setStores(response.data.items);
          setTotalRecords(response.data.total || 0);
        } else {
          // Fallback for non-paginated response
          setStores(response.data);
          setTotalRecords(response.data.length);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: error.response?.data?.detail || "Failed to load stores",
          life: 4000,
        });
        setStores([]);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, rowsPerPage, activeFilters]
  );

  // Initial fetch on component mount
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!storeForm.store_name || !storeForm.store_name.trim()) {
      errors.store_name = "Store name is required";
    }

    if (!storeForm.store_address || !storeForm.store_address.trim()) {
      errors.store_address = "Address is required";
    }

    if (!storeForm.store_city || !storeForm.store_city.trim()) {
      errors.store_city = "City is required";
    }

    if (!storeForm.store_state || !storeForm.store_state.trim()) {
      errors.store_state = "State is required";
    }

    if (!storeForm.store_country || !storeForm.store_country) {
      errors.store_country = "Country is required";
    }

    if (!storeForm.store_pincode || !storeForm.store_pincode.trim()) {
      errors.store_pincode = "Pincode is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field change
  const handleChange = (field, value) => {
    setStoreForm((prev) => ({ ...prev, [field]: value }));
    // Remove error for this field as soon as user starts entering value
    if (value !== null && value !== "" && value !== undefined) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Open dialog for adding new store
  const handleAddStore = () => {
    setStoreForm({
      store_name: "",
      store_address: "",
      store_city: "",
      store_state: "",
      store_country: null,
      store_pincode: "",
    });
    setFormErrors({});
    setIsEditing(false);
    setEditingStoreId(null);
    setDialogVisible(true);
  };

  // Open dialog for editing store
  const handleEditStore = (store) => {
    console.log("Editing store:", store);
    // Find the country object by name
    const countryObj =
      countries.find((c) => c.name === store.store_country) || null;

    setStoreForm({
      store_name: store.store_name || "",
      store_address: store.store_address || "",
      store_city: store.store_city || "",
      store_state: store.store_state || "",
      store_country: countryObj,
      store_pincode: store.store_pincode || "",
    });
    setFormErrors({});
    setIsEditing(true);
    setEditingStoreId(store.id); // Use id as primary key
    setDialogVisible(true);
  };

  // Save store (create or update)
  const handleSaveStore = async () => {
    if (!validateForm()) {
      // Scroll dialog content to top to show first error
      // PrimeReact Dialog wraps content in .p-dialog-content which is the scrollable element
      setTimeout(() => {
        const dialogContent = document.querySelector(
          ".store-dialog .p-dialog-content"
        );
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
      }, 100);
      return;
    }

    try {
      setSaveLoading(true);

      // Extract country name from country object
      const storeData = {
        ...storeForm,
        store_country: storeForm.store_country?.name || storeForm.store_country,
      };

      if (isEditing) {
        // Update existing store using store_id
        await api.put(`/stores/${editingStoreId}`, storeData);
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Store updated successfully",
          life: 3000,
        });
      } else {
        // Create new store
        await api.post("/stores", storeData);
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Store created successfully",
          life: 3000,
        });
      }

      setDialogVisible(false);
      fetchStores();
    } catch (error) {
      console.error("Error saving store:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.detail || "Failed to save store",
        life: 3000,
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete store
  const handleDeleteStore = (store) => {
    console.log("Deleting store:", store);
    confirmDialog({
      message: `Are you sure you want to delete "${store.store_name}"?`,
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          // Use id as primary key
          console.log(`Calling DELETE /stores/${store.id}`);
          await api.delete(`/stores/${store.id}`);
          toast.current.show({
            severity: "success",
            summary: "Success",
            detail: "Store deleted successfully",
            life: 3000,
          });

          // Refresh the stores list
          fetchStores();
        } catch (error) {
          console.error("Error deleting store:", error);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.detail || "Failed to delete store",
            life: 3000,
          });
        }
      },
    });
  }; // View store details
  const handleViewStore = (store) => {
    console.log("Viewing store:", store);
    // Use the store data directly from the list
    setViewingStore(store);
    setViewDialogVisible(true);
  };

  // Get label for filter field
  const getFilterFieldLabel = (fieldValue) => {
    const option = filterOptions.find((opt) => opt.value === fieldValue);
    return option ? option.label : fieldValue;
  };

  // Search handler - add filter to active filters
  const handleSearch = () => {
    if (filterField && filterValue.trim()) {
      let processedValue = filterValue.trim();

      // Check if this exact filter already exists
      const filterExists = activeFilters.some(
        (f) => f.field === filterField && f.value === processedValue
      );

      if (!filterExists) {
        const newFilter = {
          field: filterField,
          value: processedValue,
          label: getFilterFieldLabel(filterField),
        };
        const updatedFilters = [...activeFilters, newFilter];
        setActiveFilters(updatedFilters);
        setCurrentPage(0);
        fetchStores(0, rowsPerPage, updatedFilters);
      }

      // Clear input fields for next filter
      setFilterField(null);
      setFilterValue("");
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterField(null);
    setFilterValue("");
    setActiveFilters([]);
    setCurrentPage(0);
    fetchStores(0, rowsPerPage, []);
  };

  // Remove individual filter
  const removeFilter = (filterToRemove) => {
    const updatedFilters = activeFilters.filter(
      (f) =>
        !(f.field === filterToRemove.field && f.value === filterToRemove.value)
    );
    setActiveFilters(updatedFilters);
    setCurrentPage(0);
    fetchStores(0, rowsPerPage, updatedFilters);
  };

  // Pagination change handler is inline in the JSX

  // Dialog footer
  const dialogFooter = (
    <div className="dialog-footer">
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={() => setDialogVisible(false)}
        className="p-button-text"
        disabled={saveLoading}
      />
      <Button
        label={isEditing ? "Update" : "Save"}
        icon="pi pi-check"
        onClick={handleSaveStore}
        loading={saveLoading}
        autoFocus
      />
    </div>
  );

  return (
    <div className="store-management">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="store-header">
        <h2>
          <i className="pi pi-building"></i> Store Management
        </h2>
        <Button
          label="Add New Store"
          icon="pi pi-plus"
          onClick={handleAddStore}
          className="add-store-btn"
        />
      </div>

      {/* Filter Section Card */}
      <div className="filter-section filter-column-layout mb-5!">
        <Dropdown
          value={filterField}
          options={filterOptions}
          onChange={(e) => setFilterField(e.value)}
          placeholder="Select field to filter"
          className="filter-dropdown"
          showClear
          editable
          filter
        />
        <InputText
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          placeholder={
            filterField
              ? `Search by ${getFilterFieldLabel(filterField)}`
              : "Select a field first"
          }
          className="filter-input"
          disabled={!filterField}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <div className="filter-btn-row">
          <Button
            label="Search"
            icon="pi pi-search"
            onClick={handleSearch}
            disabled={!filterField || !filterValue.trim()}
            className="filter-btn search-btn p-button-primary"
          />
          <Button
            label="Clear"
            icon="pi pi-times"
            onClick={handleClearFilters}
            className="p-button-outlined clear-filter-btn p-button-secondary"
            disabled={
              activeFilters.length === 0 && !filterField && !filterValue
            }
          />
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

        <div className="results-info">
          <span className="results-count">
            {loading ? (
              "Loading..."
            ) : totalRecords === 0 ? (
              "No stores found"
            ) : (
              <>
                Showing {currentPage * rowsPerPage + 1}-
                {Math.min((currentPage + 1) * rowsPerPage, totalRecords)} of{" "}
                {totalRecords} store{totalRecords !== 1 ? "s" : ""}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Store Cards Grid */}
      <div className="stores-grid">
        {loading ? (
          <div className="loading-container">
            <i
              className="pi pi-spin pi-spinner"
              style={{ fontSize: "3rem" }}
            ></i>
            <p>Loading stores...</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="no-data-container">
            <i
              className="pi pi-inbox"
              style={{ fontSize: "4rem", color: "#ccc" }}
            ></i>
            <h3>No Stores Found</h3>
            <p>
              {activeFilters.length > 0
                ? "No stores match your filter criteria. Try adjusting your filters."
                : "Get started by adding your first store location."}
            </p>
            {activeFilters.length === 0 && (
              <Button
                label="Add Your First Store"
                icon="pi pi-plus"
                onClick={handleAddStore}
                className="p-button-lg"
              />
            )}
          </div>
        ) : (
          stores.map((store) => (
            <Card key={store.id} className="store-card">
              <div className="store-card-header">
                <div className="store-icon">
                  <i className="pi pi-building"></i>
                </div>
                <div className="store-basic-info">
                  <h3 className="store-name">{store.store_name}</h3>
                  <span className="store-id">Store ID: {store.store_id}</span>
                </div>
                <Button
                  icon="pi pi-eye"
                  className="p-button-rounded p-button-text p-button-sm"
                  onClick={() => handleViewStore(store)}
                  tooltip="View Details"
                  tooltipOptions={{ position: "top" }}
                />
              </div>

              <div className="store-card-body">
                <div className="store-details">
                  {store.store_address && (
                    <div className="store-detail-item">
                      <i className="pi pi-map-marker"></i>
                      <span>{store.store_address}</span>
                    </div>
                  )}
                  {store.store_city && (
                    <div className="store-detail-item">
                      <i className="pi pi-building"></i>
                      <span>
                        {store.store_city}
                        {store.store_state && `, ${store.store_state}`}
                      </span>
                    </div>
                  )}
                  {store.store_country && (
                    <div className="store-detail-item">
                      <i className="pi pi-globe"></i>
                      <span>{store.store_country}</span>
                    </div>
                  )}
                  {store.store_pincode && (
                    <div className="store-detail-item">
                      <i className="pi pi-tag"></i>
                      <span>{store.store_pincode}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="store-card-footer">
                <Button
                  icon="pi pi-pencil"
                  label="Edit"
                  className="p-button-sm p-button-info"
                  onClick={() => handleEditStore(store)}
                />
                <Button
                  icon="pi pi-trash"
                  label="Delete"
                  className="p-button-sm p-button-danger p-button-outlined"
                  onClick={() => handleDeleteStore(store)}
                />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && stores.length > 0 && (
        <div className="mt-4">
          <Paginator
            first={currentPage * rowsPerPage}
            rows={rowsPerPage}
            totalRecords={totalRecords}
            rowsPerPageOptions={[10, 20, 50, 100]}
            onPageChange={(e) => {
              setCurrentPage(e.page);
              setRowsPerPage(e.rows);
            }}
          />
        </div>
      )}

      {/* Add/Edit Store Dialog */}
      <Dialog
        header={isEditing ? "Edit Store" : "Add New Store"}
        visible={dialogVisible}
        style={{ width: "95vw", maxWidth: "700px" }}
        onHide={() => setDialogVisible(false)}
        draggable={false}
        resizable={false}
        blockScroll
        className="store-dialog"
        footer={dialogFooter}
      >
        <div className="store-form">
          {/* Display form errors at top of dialog */}
          {Object.keys(formErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
              <h4 className="text-red-800 font-semibold mb-2 text-sm">
                Please fix the following errors:
              </h4>
              <ul className="text-red-700 text-xs list-disc list-inside space-y-1">
                {Object.entries(formErrors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="store_name" className="required">
              Store Name
            </label>
            <InputText
              id="store_name"
              value={storeForm.store_name}
              onChange={(e) => handleChange("store_name", e.target.value)}
              className={formErrors.store_name ? "p-invalid" : ""}
              placeholder="Enter store name"
            />
            {formErrors.store_name && (
              <small className="p-error">{formErrors.store_name}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="store_address" className="required">
              Address
            </label>
            <InputText
              id="store_address"
              value={storeForm.store_address}
              onChange={(e) => handleChange("store_address", e.target.value)}
              className={formErrors.store_address ? "p-invalid" : ""}
              placeholder="Enter store address"
            />
            {formErrors.store_address && (
              <small className="p-error">{formErrors.store_address}</small>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="store_city" className="required">
                City
              </label>
              <InputText
                id="store_city"
                value={storeForm.store_city}
                onChange={(e) => handleChange("store_city", e.target.value)}
                className={formErrors.store_city ? "p-invalid" : ""}
                placeholder="Enter city"
              />
              {formErrors.store_city && (
                <small className="p-error">{formErrors.store_city}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="store_state" className="required">
                State
              </label>
              <InputText
                id="store_state"
                value={storeForm.store_state}
                onChange={(e) => handleChange("store_state", e.target.value)}
                className={formErrors.store_state ? "p-invalid" : ""}
                placeholder="Enter state"
              />
              {formErrors.store_state && (
                <small className="p-error">{formErrors.store_state}</small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="store_country" className="required">
                Country
              </label>
              <Dropdown
                id="store_country"
                value={storeForm.store_country}
                options={countries}
                onChange={(e) => handleChange("store_country", e.value)}
                optionLabel="name"
                placeholder="Select country"
                className={formErrors.store_country ? "p-invalid" : ""}
                filter
              />
              {formErrors.store_country && (
                <small className="p-error">{formErrors.store_country}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="store_pincode" className="required">
                Pincode
              </label>
              <InputText
                id="store_pincode"
                value={storeForm.store_pincode}
                onChange={(e) => handleChange("store_pincode", e.target.value)}
                className={formErrors.store_pincode ? "p-invalid" : ""}
                placeholder="Enter pincode"
              />
              {formErrors.store_pincode && (
                <small className="p-error">{formErrors.store_pincode}</small>
              )}
            </div>
          </div>
        </div>
      </Dialog>

      {/* View Store Dialog */}
      <Dialog
        header="Store Details"
        visible={viewDialogVisible}
        style={{ width: "95vw", maxWidth: "600px" }}
        onHide={() => setViewDialogVisible(false)}
        draggable={false}
        resizable={false}
      >
        {viewingStore && (
          <div className="store-details-view">
            <div className="detail-row">
              <span className="detail-label">Store ID:</span>
              <span className="detail-value">{viewingStore.store_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Store Name:</span>
              <span className="detail-value">{viewingStore.store_name}</span>
            </div>
            {viewingStore.store_address && (
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">
                  {viewingStore.store_address}
                </span>
              </div>
            )}
            {viewingStore.store_city && (
              <div className="detail-row">
                <span className="detail-label">City:</span>
                <span className="detail-value">{viewingStore.store_city}</span>
              </div>
            )}
            {viewingStore.store_state && (
              <div className="detail-row">
                <span className="detail-label">State:</span>
                <span className="detail-value">{viewingStore.store_state}</span>
              </div>
            )}
            {viewingStore.store_country && (
              <div className="detail-row">
                <span className="detail-label">Country:</span>
                <span className="detail-value">
                  {viewingStore.store_country}
                </span>
              </div>
            )}
            {viewingStore.store_pincode && (
              <div className="detail-row">
                <span className="detail-label">Pincode:</span>
                <span className="detail-value">
                  {viewingStore.store_pincode}
                </span>
              </div>
            )}
            {viewingStore.created_at && (
              <div className="detail-row">
                <span className="detail-label">Created At:</span>
                <span className="detail-value">
                  {new Date(viewingStore.created_at).toLocaleString()}
                </span>
              </div>
            )}
            {viewingStore.updated_at && (
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {new Date(viewingStore.updated_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
