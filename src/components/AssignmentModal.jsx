import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import { Message } from "primereact/message";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "./AssignmentModal.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function AssignmentModal({ product, onClose, onSuccess }) {
  // Store and Assignment State
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [assignQuantity, setAssignQuantity] = useState(null);
  const [minStockQty, setMinStockQty] = useState(10);

  // Existing Assignments State

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [quantityError, setQuantityError] = useState("");

  const token = localStorage.getItem("access_token");

  // Initialize with selected product
  useEffect(() => {
    if (product) {
      // Reset form when product changes
      setAssignQuantity(null);
      setSelectedStore(null);
      setQuantityError("");
      setError("");
    }
  }, [product]);

  // Fetch stores on component mount
  useEffect(() => {
    fetchStores();
  }, [product]);

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If transferring from a store, exclude the source store
      let availableStores = response.data || [];
      if (product?.isFromStore && product?.sourceStoreId) {
        availableStores = availableStores.filter(
          (store) => store.id !== product.sourceStoreId,
        );
      }

      setStores(availableStores);
    } catch (err) {
      console.error("Error fetching stores:", err);
      setError("Failed to load stores");
    }
  };

  const handleClose = () => {
    // Clear form state before closing
    setAssignQuantity(null);
    setSelectedStore(null);
    setQuantityError("");
    setError("");
    setSuccess("");
    onClose();
  };

  const handleAssign = async () => {
    // Validation
    if (!product) {
      setError("Please select a product");
      return;
    }
    if (!selectedStore) {
      setError("Please select a store");
      return;
    }
    if (!assignQuantity || assignQuantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    const maxAvailable = parseFloat(product.quantity || 0);
    if (assignQuantity > maxAvailable) {
      setError(
        `Cannot ${product.isFromStore ? "transfer" : "assign"} ${assignQuantity} ${product.unit || "units"}. Only ${maxAvailable} ${product.unit || "units"} available${product.isFromStore ? " in store" : " in central inventory"}`,
      );
      setQuantityError(
        `Cannot assign more than ${maxAvailable} ${product.unit || "units"}. Only ${maxAvailable} available.`,
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const requestData = {
        product_id: product.id,
        store_id: selectedStore,
        assigned_quantity: assignQuantity,
        min_stock_qty: minStockQty,
      };

      // Add source_store_id if transferring from a store
      if (product.isFromStore && product.sourceStoreId) {
        requestData.source_store_id = product.sourceStoreId;
      }

      console.log("=== Assignment Request Data ===");
      console.log("Product:", product);
      console.log("Request:", requestData);
      console.log("Is from store:", product.isFromStore);
      console.log("Source Store ID:", product.sourceStoreId);

      const response = await axios.post(
        `${API_BASE_URL}/inventory/assign-product-to-store`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("=== API Response ===");
      console.log("Response data:", response.data);
      console.log("Response status:", response.status);

      // Find the store name for the success message
      const selectedStoreObj = stores.find((s) => s.id === selectedStore);
      const storeName = selectedStoreObj?.store_name || "Store";

      const actionType = product.isFromStore ? "transferred" : "assigned";
      setSuccess(
        `Successfully ${actionType} ${assignQuantity} ${product.unit || "units"} to ${storeName}!`,
      );

      // Reset form
      setAssignQuantity(null);
      setSelectedStore(null);
      setError("");

      // Refresh existing assignments

      // Call onSuccess callback after a short delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Error assigning product:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to assign product. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header={
        product?.isFromStore
          ? `Transfer "${product?.productname}" to Another Store`
          : `Assign "${product?.productname}" to Store`
      }
      visible={true}
      onHide={handleClose}
      modal
      style={{ width: "90vw", maxWidth: "600px" }}
      className="assignment-modal"
    >
      <div className="assignment-modal-content">
        {/* Selected Product Info */}
        <div className="selected-product-section">
          <h4>Product Details</h4>
          <div className="selected-product-card">
            <div className="product-detail-row">
              <span className="label">Product Name:</span>
              <span className="value">{product?.productname}</span>
            </div>
            <div className="product-detail-row">
              <span className="label">Product ID:</span>
              <span className="value">{product?.productid}</span>
            </div>
            <div className="product-detail-row">
              <span className="label">SKU:</span>
              <span className="value">{product?.sku}</span>
            </div>
            {product?.isFromStore && (
              <div className="product-detail-row">
                <span className="label">Source Store:</span>
                <span className="value highlight">
                  {product?.sourceStoreName}
                </span>
              </div>
            )}
            <div className="product-detail-row">
              <span className="label">
                {product?.isFromStore
                  ? "Store Stock Available:"
                  : "Central Stock Available:"}
              </span>
              <span className="value highlight">
                {parseFloat(product?.quantity || 0).toFixed(2)}{" "}
                {product?.unit || "units"}
              </span>
            </div>
            <div className="product-detail-row">
              <span className="label">Price:</span>
              <span className="value">
                ₹{parseFloat(product?.price || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Assignment Section */}
        <div className="assignment-section">
          <h3>
            {product?.isFromStore ? "Transfer to Store" : "Assign to Store"}
          </h3>

          <div className="form-group">
            <label>
              {product?.isFromStore ? "Destination Store *" : "Select Store *"}
            </label>
            <Dropdown
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.value);
                setError("");
              }}
              options={stores}
              optionLabel="store_name"
              optionValue="id"
              placeholder={
                product?.isFromStore
                  ? "Choose destination store"
                  : "Choose a store"
              }
              className="store-dropdown"
            />
            {product?.isFromStore && (
              <small
                style={{ color: "#1976d2", marginTop: "4px", display: "block" }}
              >
                Note: Transferring from {product?.sourceStoreName} to another
                store
              </small>
            )}
          </div>

          <div className="form-group">
            <label>
              {product?.isFromStore
                ? "Quantity to Transfer *"
                : "Quantity to Assign *"}
            </label>
            <InputNumber
              value={assignQuantity}
              onValueChange={(e) => {
                const value = e.value;
                setAssignQuantity(value);
                setError("");

                // Check if quantity exceeds available
                const maxAvailable = parseFloat(product?.quantity || 0);
                if (value && value > maxAvailable) {
                  setQuantityError(
                    `Cannot assign more than ${maxAvailable} ${product?.unit || "units"}. Only ${maxAvailable} available.`,
                  );
                } else {
                  setQuantityError("");
                }
              }}
              min={0}
              step={0.01}
              placeholder="Enter quantity"
              useGrouping={true}
              decimalSeparator="."
              thousandSeparator=","
            />
            {quantityError && (
              <small
                style={{
                  color: "#d32f2f",
                  marginTop: "4px",
                  display: "block",
                  fontWeight: "500",
                }}
              >
                {quantityError}
              </small>
            )}
            {!quantityError && (
              <small style={{ color: "#666", marginTop: "4px" }}>
                Max available: {parseFloat(product?.quantity || 0).toFixed(2)}{" "}
                {product?.unit || "units"}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Minimum Stock Threshold</label>
            <InputNumber
              value={minStockQty}
              onValueChange={(e) => setMinStockQty(e.value)}
              min={0}
              step={1}
              placeholder="Alert threshold"
            />
          </div>
        </div>

        {/* Messages */}
        {error && <Message severity="error" text={error} className="my-3" />}
        {success && (
          <Message severity="success" text={success} className="my-3" />
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          <Button
            label="Assign"
            icon="pi pi-check"
            onClick={handleAssign}
            loading={loading}
            disabled={
              !selectedStore || !assignQuantity || loading || quantityError
            }
            className="p-button-success"
          />
          <Button
            label="Cancel"
            icon="pi pi-times"
            onClick={handleClose}
            className="p-button-secondary"
          />
        </div>
      </div>
    </Dialog>
  );
}
