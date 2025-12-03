import { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import api from "../services/api/axios";
import "../styles/storemanagement.css";

export default function StoreManagement() {
  const toast = useRef(null);
  const hasFetchedRef = useRef(false);

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    store_name: "",
    store_address: "",
    store_city: "",
    store_state: "",
    store_country: "",
    store_pincode: "",
  });

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchStores();
    }
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await api.get("/stores");
      setStores(response.data);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.detail || "Failed to load stores",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const openDialog = (store = null) => {
    if (store) {
      setIsEditMode(true);
      setCurrentStore(store);
      setFormData({
        store_name: store.store_name,
        store_address: store.store_address || "",
        store_city: store.store_city || "",
        store_state: store.store_state || "",
        store_country: store.store_country || "",
        store_pincode: store.store_pincode || "",
      });
    } else {
      setIsEditMode(false);
      setCurrentStore(null);
      setFormData({
        store_name: "",
        store_address: "",
        store_city: "",
        store_state: "",
        store_country: "",
        store_pincode: "",
      });
    }
    setErrors({});
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setFormData({
      store_name: "",
      store_address: "",
      store_city: "",
      store_state: "",
      store_country: "",
      store_pincode: "",
    });
    setErrors({});
    setCurrentStore(null);
    setIsEditMode(false);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      const newErrors = {};
      if (!formData.store_name || !formData.store_name.trim()) {
        newErrors.store_name = "Store name is required";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.current?.show({
          severity: "warn",
          summary: "Validation Error",
          detail: "Please fill in all required fields",
          life: 4000,
        });
        return;
      }

      setErrors({});
      setLoading(true);

      let response;
      if (isEditMode) {
        response = await api.put(`/stores/${currentStore.store_id}`, formData);

        if (response.status === 422) {
          throw { response };
        }

        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Store updated successfully",
          life: 3000,
        });
      } else {
        response = await api.post("/stores", formData);

        if (response.status === 422) {
          throw { response };
        }

        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Store created successfully",
          life: 3000,
        });
      }

      closeDialog();
      fetchStores();
    } catch (error) {
      console.error("Error saving store:", error);

      let errorMessage = "Failed to save store. Please try again.";
      let severity = "error";
      let summary = "Save Failed";

      if (error.response?.status === 422) {
        severity = "warn";
        summary = "Invalid Input";
        if (error.response?.data?.detail) {
          errorMessage =
            typeof error.response.data.detail === "string"
              ? error.response.data.detail
              : "Please check your input";
        }
      } else if (error.response?.status === 400) {
        severity = "warn";
        summary = "Validation Error";
        errorMessage = error.response?.data?.detail || errorMessage;
      } else if (error.response?.status === 404) {
        severity = "warn";
        summary = "Not Found";
        errorMessage = error.response?.data?.detail || errorMessage;
      } else if (error.response?.status === 409) {
        severity = "warn";
        summary = "Conflict";
        errorMessage = error.response?.data?.detail || errorMessage;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      toast.current?.show({
        severity: severity,
        summary: summary,
        detail: errorMessage,
        life: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (store) => {
    confirmDialog({
      message: `Are you sure you want to delete "${store.store_name}"?`,
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => deleteStore(store.store_id),
      reject: () => {},
    });
  };

  const deleteStore = async (storeId) => {
    try {
      setLoading(true);
      await api.delete(`/stores/${storeId}`);
      toast.current?.show({
        severity: "success",
        summary: "Deleted",
        detail: "Store deleted successfully",
        life: 3000,
      });
      fetchStores();
    } catch (error) {
      console.error("Error deleting store:", error);
      toast.current?.show({
        severity: "error",
        summary: "Delete Failed",
        detail: error.response?.data?.detail || "Failed to delete store",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="info"
          onClick={() => openDialog(rowData)}
          tooltip="Edit"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Delete"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancel"
        icon="pi pi-times"
        onClick={closeDialog}
        className="p-button-text"
        disabled={loading}
      />
      <Button
        label={isEditMode ? "Update" : "Create"}
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
        disabled={loading}
      />
    </div>
  );

  return (
    <div className="store-management-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="store-header">
        <div>
          <h2>
            <i className="pi pi-building"></i> Store Management
          </h2>
          <p>Manage your business store locations</p>
        </div>
        <Button
          label="Add Store"
          icon="pi pi-plus"
          onClick={() => openDialog()}
          className="add-store-btn"
        />
      </div>

      <DataTable
        value={stores}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No stores found. Click 'Add Store' to create one."
        className="stores-table"
      >
        <Column field="store_name" header="Store Name" sortable />
        <Column field="store_address" header="Address" />
        <Column field="store_city" header="City" sortable />
        <Column field="store_state" header="State" sortable />
        <Column field="store_country" header="Country" sortable />
        <Column field="store_pincode" header="Pincode" />
        <Column
          body={actionBodyTemplate}
          header="Actions"
          style={{ width: "120px" }}
        />
      </DataTable>

      <Dialog
        header={isEditMode ? "Edit Store" : "Add New Store"}
        visible={dialogVisible}
        style={{ width: "600px" }}
        onHide={closeDialog}
        footer={dialogFooter}
        modal
      >
        <div className="store-form">
          <div className="form-field">
            <label htmlFor="store_name">
              Store Name <span className="required">*</span>
            </label>
            <InputText
              id="store_name"
              value={formData.store_name}
              onChange={(e) => handleChange("store_name", e.target.value)}
              placeholder="Enter store name"
              className={errors.store_name ? "p-invalid" : ""}
            />
            {errors.store_name && (
              <small className="p-error">{errors.store_name}</small>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="store_address">Store Address</label>
            <InputText
              id="store_address"
              value={formData.store_address}
              onChange={(e) => handleChange("store_address", e.target.value)}
              placeholder="Enter store address"
            />
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="store_city">City</label>
              <InputText
                id="store_city"
                value={formData.store_city}
                onChange={(e) => handleChange("store_city", e.target.value)}
                placeholder="Enter city"
              />
            </div>

            <div className="form-field">
              <label htmlFor="store_state">State</label>
              <InputText
                id="store_state"
                value={formData.store_state}
                onChange={(e) => handleChange("store_state", e.target.value)}
                placeholder="Enter state"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="store_country">Country</label>
              <InputText
                id="store_country"
                value={formData.store_country}
                onChange={(e) => handleChange("store_country", e.target.value)}
                placeholder="Enter country"
              />
            </div>

            <div className="form-field">
              <label htmlFor="store_pincode">Pincode</label>
              <InputText
                id="store_pincode"
                value={formData.store_pincode}
                onChange={(e) => handleChange("store_pincode", e.target.value)}
                placeholder="Enter pincode"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
