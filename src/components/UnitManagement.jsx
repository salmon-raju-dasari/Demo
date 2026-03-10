import React, { useState, useRef, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Checkbox } from "primereact/checkbox";
import "./UnitManagement.css";
import api from "../services/api/axios";

const UnitManagement = () => {
  const [baseUnits, setBaseUnits] = useState([]);
  const [subUnits, setSubUnits] = useState([]);
  const [isEditingId, setIsEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNewBaseUnit, setShowNewBaseUnit] = useState(false);
  const [newBaseUnitData, setNewBaseUnitData] = useState({
    name: "",
    code: "",
    unitTitle: "",
  });

  // State for editing base unit
  const [editingBaseUnitId, setEditingBaseUnitId] = useState(null);
  const [editBaseUnitData, setEditBaseUnitData] = useState({
    name: "",
    code: "",
    unitTitle: "",
  });

  const [formData, setFormData] = useState({
    unitTitle: "",
    baseUnitId: null,
    baseUnit: "",
    baseUnitCode: "",
    subUnitName: "",
    subUnitCode: "",
    conversionValue: "",
  });

  const toast = useRef(null);

  // Load base units from API on mount
  useEffect(() => {
    fetchBaseUnits();
    fetchSubUnits();
  }, []);

  const fetchBaseUnits = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.warn("No access token found");
        showNotification("Please login first", "warning");
        return;
      }

      const response = await fetch(api.defaults.baseURL + "/units/base-units", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Base units fetched:", data);
        setBaseUnits(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        console.error("Unauthorized - Token may be expired");
        showNotification("Session expired. Please login again", "error");
      } else {
        console.error("Failed to fetch base units:", response.status);
        showNotification("Failed to load units", "error");
      }
    } catch (error) {
      console.error("Error fetching base units:", error);
      showNotification("Error loading units: " + error.message, "error");
    }
  };

  const fetchSubUnits = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.warn("No access token found");
        return;
      }

      const response = await fetch(api.defaults.baseURL + "/units/sub-units", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Sub units fetched:", data);
        setSubUnits(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        console.error("Unauthorized - Token may be expired");
      } else {
        console.error("Failed to fetch sub units:", response.status);
      }
    } catch (error) {
      console.error("Error fetching sub units:", error);
    }
  };

  const showNotification = (message, type = "success") => {
    toast.current.show({
      severity: type === "warning" ? "warn" : type,
      summary:
        type === "success"
          ? "Success"
          : type === "warning"
            ? "Warning"
            : "Error",
      detail: message,
      life: 3000,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // For conversionValue, only allow numbers
    if (name === "conversionValue") {
      if (value === "" || /^\d+(\.\d*)?$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleBaseUnitSelect = (e) => {
    const selected = e.value;
    console.log("Base unit selected:", selected);

    if (!selected) {
      // Clear button clicked
      console.log("Clearing dropdown");
      setFormData({
        ...formData,
        baseUnitId: null,
        baseUnit: "",
        baseUnitCode: "",
        unitTitle: "",
        subUnitName: "",
        subUnitCode: "",
        conversionValue: "",
      });
      setShowNewBaseUnit(false);
      setNewBaseUnitData({ name: "", code: "", unitTitle: "" });
      setIsEditingId(null);
    } else {
      // Select existing base unit - auto-populate unit title
      console.log("Selected base unit:", selected);
      console.log("Unit title from selected:", selected.unit_title);
      setFormData({
        ...formData,
        baseUnitId: selected.id,
        baseUnit: selected.base_unit_name,
        baseUnitCode: selected.code,
        unitTitle: selected.unit_title || selected.base_unit_name || "",
      });
      setShowNewBaseUnit(false);
    }
  };

  const handleNewBaseUnitInput = (e) => {
    const { name, value } = e.target;
    setNewBaseUnitData({
      ...newBaseUnitData,
      [name]: value,
    });
  };

  const handleAddNewBaseUnit = async () => {
    if (
      !newBaseUnitData.name.trim() ||
      !newBaseUnitData.code.trim() ||
      !newBaseUnitData.unitTitle.trim()
    ) {
      showNotification(
        "Base unit name, code, and unit title are required",
        "warning",
      );
      return;
    }

    // Check if code already exists
    if (
      baseUnits.some(
        (unit) =>
          unit.code.toLowerCase() === newBaseUnitData.code.toLowerCase(),
      )
    ) {
      showNotification("This base unit code already exists", "warning");
      return;
    }

    // Check if unit title already exists
    if (
      baseUnits.some(
        (unit) =>
          unit.unit_title.toLowerCase() ===
          newBaseUnitData.unitTitle.toLowerCase(),
      )
    ) {
      showNotification(
        "This unit title already exists. Unit titles must be unique",
        "warning",
      );
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(api.defaults.baseURL + "/units/base-units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          base_unit_name: newBaseUnitData.name,
          code: newBaseUnitData.code,
          unit_title: newBaseUnitData.unitTitle,
          sub_units: [],
        }),
      });

      if (response.ok) {
        const newBaseUnit = await response.json();
        setBaseUnits([...baseUnits, newBaseUnit]);
        setFormData({
          ...formData,
          baseUnitId: newBaseUnit.id,
          baseUnit: newBaseUnit.base_unit_name,
          baseUnitCode: newBaseUnit.code,
          unitTitle: newBaseUnit.unit_title,
        });
        setNewBaseUnitData({ name: "", code: "", unitTitle: "" });
        setShowNewBaseUnit(false);
        showNotification("Base unit created successfully", "success");
      } else {
        const error = await response.json();
        showNotification(error.detail || "Failed to create base unit", "error");
      }
    } catch (error) {
      console.error("Error creating base unit:", error);
      showNotification("Error creating base unit", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete base unit (and all its sub units)
  const handleDeleteBaseUnit = async (baseUnitId, baseUnitName) => {
    confirmDialog({
      message: `Are you sure you want to delete "${baseUnitName}" and all its sub units? This action cannot be undone.`,
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("access_token");
          const response = await fetch(
            `${api.defaults.baseURL}/units/base-units/${baseUnitId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            // Remove base unit from state
            setBaseUnits(baseUnits.filter((unit) => unit.id !== baseUnitId));
            // Remove all sub units associated with this base unit
            setSubUnits(
              subUnits.filter((unit) => unit.base_unit_id !== baseUnitId),
            );

            // Clear form if deleted base unit was selected
            if (formData.baseUnitId === baseUnitId) {
              setFormData({
                unitTitle: "",
                baseUnitId: null,
                baseUnit: "",
                baseUnitCode: "",
                subUnitName: "",
                subUnitCode: "",
                conversionValue: "",
              });
            }

            showNotification(
              "Base unit and all sub units deleted successfully",
              "success",
            );
          } else {
            const error = await response.json();
            showNotification(
              error.detail || "Failed to delete base unit",
              "error",
            );
          }
        } catch (error) {
          console.error("Error deleting base unit:", error);
          showNotification("Error deleting base unit", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Start editing a base unit
  const handleEditBaseUnit = (baseUnit) => {
    setEditingBaseUnitId(baseUnit.id);
    setEditBaseUnitData({
      name: baseUnit.base_unit_name,
      code: baseUnit.code,
      unitTitle: baseUnit.unit_title,
    });
  };

  // Cancel editing base unit
  const handleCancelEditBaseUnit = () => {
    setEditingBaseUnitId(null);
    setEditBaseUnitData({
      name: "",
      code: "",
      unitTitle: "",
    });
  };

  // Save edited base unit
  const handleSaveBaseUnit = async () => {
    if (
      !editBaseUnitData.name.trim() ||
      !editBaseUnitData.code.trim() ||
      !editBaseUnitData.unitTitle.trim()
    ) {
      showNotification("All fields are required", "warning");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${api.defaults.baseURL}/units/base-units/${editingBaseUnitId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            base_unit_name: editBaseUnitData.name,
            code: editBaseUnitData.code,
            unit_title: editBaseUnitData.unitTitle,
          }),
        },
      );

      if (response.ok) {
        const updatedBaseUnit = await response.json();
        setBaseUnits(
          baseUnits.map((unit) =>
            unit.id === editingBaseUnitId ? updatedBaseUnit : unit,
          ),
        );

        // Update form data if this base unit is currently selected
        if (formData.baseUnitId === editingBaseUnitId) {
          setFormData({
            ...formData,
            baseUnit: updatedBaseUnit.base_unit_name,
            baseUnitCode: updatedBaseUnit.code,
            unitTitle: updatedBaseUnit.unit_title,
          });
        }

        setEditingBaseUnitId(null);
        setEditBaseUnitData({ name: "", code: "", unitTitle: "" });
        showNotification("Base unit updated successfully", "success");
      } else {
        const error = await response.json();
        showNotification(error.detail || "Failed to update base unit", "error");
      }
    } catch (error) {
      console.error("Error updating base unit:", error);
      showNotification("Error updating base unit", "error");
    } finally {
      setLoading(false);
    }
  };

  // Custom item template for dropdown with edit/delete icons
  const baseUnitOptionTemplate = (option) => {
    if (!option) return null;

    return (
      <div className="base-unit-option-item">
        <span className="base-unit-option-label">
          {option.base_unit_name} ({option.code}) - {option.unit_title}
        </span>
        <div className="base-unit-option-actions">
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm p-button-info"
            onClick={(e) => {
              e.stopPropagation();
              handleEditBaseUnit(option);
            }}
            tooltip="Edit"
            tooltipOptions={{ position: "top" }}
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-sm p-button-danger"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteBaseUnit(option.id, option.base_unit_name);
            }}
            tooltip="Delete"
            tooltipOptions={{ position: "top" }}
          />
        </div>
      </div>
    );
  };

  const validateForm = () => {
    if (!formData.unitTitle.trim()) {
      showNotification("Unit title is required", "warning");
      return false;
    }
    if (!formData.baseUnitCode) {
      showNotification("Base unit is required", "warning");
      return false;
    }
    if (!formData.subUnitName.trim()) {
      showNotification("Sub unit name is required", "warning");
      return false;
    }
    if (!formData.subUnitCode.trim()) {
      showNotification("Sub unit code is required", "warning");
      return false;
    }
    if (!formData.conversionValue.trim()) {
      showNotification("Conversion value is required", "warning");
      return false;
    }
    if (parseFloat(formData.conversionValue) <= 0) {
      showNotification("Conversion value must be greater than 0", "warning");
      return false;
    }
    return true;
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");

      if (isEditingId) {
        // Update existing unit
        const response = await fetch(
          `${api.defaults.baseURL}/units/sub-units/${isEditingId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sub_unit_name: formData.subUnitName,
              code: formData.subUnitCode,
              conversion_value: parseFloat(formData.conversionValue),
            }),
          },
        );

        if (response.ok) {
          const updatedUnit = await response.json();
          const updatedSubUnits = subUnits.map((unit) =>
            unit.id === isEditingId ? updatedUnit : unit,
          );
          setSubUnits(updatedSubUnits);
          showNotification("Sub unit updated successfully", "success");

          // Reset form but keep base unit and unit title selected
          setFormData({
            ...formData,
            subUnitName: "",
            subUnitCode: "",
            conversionValue: "",
          });
          setIsEditingId(null);
        } else {
          const error = await response.json();
          showNotification(
            error.detail || "Failed to update sub unit",
            "error",
          );
        }
      } else {
        // Create new unit
        const response = await fetch(
          `${api.defaults.baseURL}/units/base-units/${formData.baseUnitId}/sub-units`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sub_unit_name: formData.subUnitName,
              code: formData.subUnitCode,
              conversion_value: parseFloat(formData.conversionValue),
            }),
          },
        );

        if (response.ok) {
          const newSubUnit = await response.json();
          setSubUnits([...subUnits, newSubUnit]);
          showNotification("Sub unit created successfully", "success");

          // Reset form but keep base unit and unit title selected
          setFormData({
            ...formData,
            subUnitName: "",
            subUnitCode: "",
            conversionValue: "",
          });
          setIsEditingId(null);
        } else {
          const error = await response.json();
          showNotification(
            error.detail || "Failed to create sub unit",
            "error",
          );
        }
      }
    } catch (error) {
      console.error("Error processing sub unit:", error);
      showNotification("Error processing sub unit", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUnit = (unit) => {
    setFormData({
      unitTitle: formData.unitTitle || unit.unitTitle || "",
      baseUnitId: unit.base_unit_id || formData.baseUnitId,
      baseUnit: formData.baseUnit || "",
      baseUnitCode: formData.baseUnitCode || "",
      subUnitName: unit.sub_unit_name,
      subUnitCode: unit.code,
      conversionValue: unit.conversion_value.toString(),
    });
    setIsEditingId(unit.id);
  };

  const handleDeleteUnit = async (id) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(
          `${api.defaults.baseURL}/units/sub-units/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.ok) {
          const updatedSubUnits = subUnits.filter((unit) => unit.id !== id);
          setSubUnits(updatedSubUnits);
          showNotification("Sub unit deleted successfully", "success");
        } else {
          showNotification("Failed to delete sub unit", "error");
        }
      } catch (error) {
        console.error("Error deleting sub unit:", error);
        showNotification("Error deleting sub unit", "error");
      }
    }
  };

  const handleClearForm = () => {
    setFormData({
      unitTitle: "",
      baseUnitId: null,
      baseUnit: "",
      baseUnitCode: "",
      subUnitName: "",
      subUnitCode: "",
      conversionValue: "",
    });
    setIsEditingId(null);
  };

  const conversionLabel =
    formData.baseUnitCode && formData.subUnitCode && formData.conversionValue
      ? `1 ${formData.baseUnitCode} = ${formData.conversionValue} ${formData.subUnitCode}`
      : "1 base unit = ? sub units";

  // Group sub units by base unit title
  const groupedUnits = baseUnits.map((baseUnit) => ({
    title: baseUnit.unit_title,
    baseUnitName: baseUnit.base_unit_name,
    baseUnitCode: baseUnit.code,
    units: subUnits.filter((subUnit) => subUnit.base_unit_id === baseUnit.id),
    baseUnitId: baseUnit.id,
  }));

  // For the selected unit, create a flat array with unit title for grouping
  const selectedUnitData = formData.baseUnitId
    ? subUnits
        .filter((u) => u.base_unit_id === formData.baseUnitId)
        .map((unit) => ({
          ...unit,
          unitTitle: formData.unitTitle,
        }))
    : [];

  return (
    <div className="unit-management-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="unit-content">
        {/* Form Section */}
        <div className="unit-form-section">
          <h2>{isEditingId ? "Edit Unit" : "Create New Unit"}</h2>

          {/* Editing Status Badge */}
          {isEditingId && (
            <div className="editing-status-badge">
              <span className="badge-label">Currently Editing:</span>
              <span className="badge-value">
                {formData.subUnitName} ({formData.subUnitCode})
              </span>
            </div>
          )}

          <form onSubmit={handleAddUnit} className="unit-form">
            {/* Base Unit Section */}
            <div className="form-section-title">Base Unit</div>
            <div className="form-group full-width">
              <label htmlFor="baseUnitSelect">Select Base Unit *</label>
              <Dropdown
                id="baseUnitSelect"
                value={
                  formData.baseUnitId
                    ? baseUnits.find((unit) => unit.id === formData.baseUnitId)
                    : null
                }
                onChange={handleBaseUnitSelect}
                options={baseUnits}
                optionLabel={(option) =>
                  `${option.base_unit_name} (${option.code})`
                }
                itemTemplate={baseUnitOptionTemplate}
                placeholder="-- Choose a base unit --"
                filter
                filterPlaceholder="Search units..."
                className="w-full"
                showClear
              />
              <small className="form-hint">Select an existing base unit</small>

              {/* Edit Base Unit Form (Conditional) */}
              {editingBaseUnitId && (
                <div className="edit-base-unit-form">
                  <div className="edit-base-unit-header">
                    <span>Edit Base Unit</span>
                    <Button
                      icon="pi pi-times"
                      className="p-button-rounded p-button-text p-button-sm"
                      onClick={handleCancelEditBaseUnit}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Unit Name *</label>
                      <InputText
                        value={editBaseUnitData.name}
                        onChange={(e) =>
                          setEditBaseUnitData({
                            ...editBaseUnitData,
                            name: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="form-group">
                      <label>Code *</label>
                      <InputText
                        value={editBaseUnitData.code}
                        onChange={(e) =>
                          setEditBaseUnitData({
                            ...editBaseUnitData,
                            code: e.target.value,
                          })
                        }
                        maxLength={10}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Unit Title *</label>
                      <InputText
                        value={editBaseUnitData.unitTitle}
                        onChange={(e) =>
                          setEditBaseUnitData({
                            ...editBaseUnitData,
                            unitTitle: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="form-actions-inline">
                    <Button
                      type="button"
                      label="Save"
                      icon="pi pi-check"
                      onClick={handleSaveBaseUnit}
                      className="p-button-sm p-button-success"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      label="Cancel"
                      icon="pi pi-times"
                      onClick={handleCancelEditBaseUnit}
                      className="p-button-sm p-button-secondary"
                    />
                  </div>
                </div>
              )}

              <Button
                type="button"
                label="+ Add New Base Unit"
                icon="pi pi-plus"
                className="p-button-outlined p-button-sm w-full"
                onClick={() => {
                  setShowNewBaseUnit(true);
                  setIsEditingId(null);
                  setEditingBaseUnitId(null);
                  setFormData({
                    unitTitle: "",
                    baseUnitId: null,
                    baseUnit: "",
                    baseUnitCode: "",
                    subUnitName: "",
                    subUnitCode: "",
                    conversionValue: "",
                  });
                }}
                style={{ marginTop: "8px" }}
              />
            </div>

            {/* New Base Unit Form (Conditional) */}
            {showNewBaseUnit && (
              <div className="new-base-unit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newBaseUnitName">Unit Name *</label>
                    <InputText
                      id="newBaseUnitName"
                      name="name"
                      placeholder="e.g., Kilogram"
                      value={newBaseUnitData.name}
                      onChange={handleNewBaseUnitInput}
                      className="w-full"
                    />
                    <small className="form-hint">
                      The specific unit name (e.g., Kilogram, Liter)
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="newBaseUnitCode">Code *</label>
                    <InputText
                      id="newBaseUnitCode"
                      name="code"
                      placeholder="e.g., kg"
                      value={newBaseUnitData.code}
                      onChange={handleNewBaseUnitInput}
                      maxLength={10}
                      className="w-full"
                    />
                    <small className="form-hint">Unit code abbreviation</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newBaseUnitTitle">
                      Unit Title/Category *
                    </label>
                    <InputText
                      id="newBaseUnitTitle"
                      name="unitTitle"
                      placeholder="e.g., Weight, Volume, Length"
                      value={newBaseUnitData.unitTitle}
                      onChange={handleNewBaseUnitInput}
                      className="w-full"
                    />
                    <small className="form-hint">
                      The category of this unit (e.g., Weight, Volume, Length)
                    </small>
                  </div>
                </div>
                <div className="form-actions-inline">
                  <Button
                    type="button"
                    label="Add Base Unit"
                    onClick={handleAddNewBaseUnit}
                    className="p-button-sm"
                  />
                  <Button
                    type="button"
                    label="Cancel"
                    onClick={() => {
                      setShowNewBaseUnit(false);
                      setNewBaseUnitData({ name: "", code: "", unitTitle: "" });
                    }}
                    className="p-button-sm p-button-secondary"
                  />
                </div>
              </div>
            )}

            {/* Unit Value Section */}
            <div className="form-section-title">Conversion Value</div>
            <div className="form-group full-width">
              <label htmlFor="conversionValue">
                Conversion Value (Numeric Only) *
              </label>
              <InputText
                id="conversionValue"
                name="conversionValue"
                placeholder="e.g., 1000"
                value={formData.conversionValue}
                onChange={handleInputChange}
                keyfilter="num"
                className="w-full"
              />
              <small className="form-hint">
                Number representing how many sub units equal one base unit
              </small>
            </div>

            {/* Sub Unit Section */}
            <div className="form-section-title">Sub Unit</div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subUnitName">Unit Name *</label>
                <InputText
                  id="subUnitName"
                  name="subUnitName"
                  placeholder="e.g., Milligram"
                  value={formData.subUnitName}
                  onChange={handleInputChange}
                  className="w-full"
                />
                <small className="form-hint">Full name of the sub unit</small>
              </div>
              <div className="form-group">
                <label htmlFor="subUnitCode">Code *</label>
                <InputText
                  id="subUnitCode"
                  name="subUnitCode"
                  placeholder="e.g., mg"
                  value={formData.subUnitCode}
                  onChange={handleInputChange}
                  maxLength={10}
                  className="w-full"
                />
                <small className="form-hint">Short code/abbreviation</small>
              </div>
            </div>

            {/* Conversion Preview */}
            <div className="conversion-preview">
              <span className="conversion-label">Conversion:</span>
              <span className="conversion-value">{conversionLabel}</span>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <Button
                type="submit"
                label={
                  loading
                    ? "Processing..."
                    : isEditingId
                      ? "Update Unit"
                      : "Create Unit"
                }
                disabled={loading}
                className="p-button-primary flex-1"
              />
              <Button
                type="button"
                label="Clear"
                onClick={handleClearForm}
                disabled={loading}
                className="p-button-secondary"
              />
            </div>
          </form>
        </div>

        {/* Units List Section */}
        <div className="units-list-section">
          {formData.baseUnitId ? (
            <>
              <h2>Sub Units for {formData.unitTitle}</h2>
              {console.log("Current baseUnitId:", formData.baseUnitId)}
              {console.log("All sub units:", subUnits)}
              {console.log(
                "Filtered sub units:",
                subUnits.filter((u) => u.base_unit_id === formData.baseUnitId),
              )}

              {subUnits.filter((u) => u.base_unit_id === formData.baseUnitId)
                .length === 0 ? (
                <div className="empty-state">
                  <p>No sub units created yet for this unit</p>
                  <small>Create your first sub unit above to get started</small>
                </div>
              ) : (
                <div className="units-table-custom">
                  {selectedUnitData.length > 0 ? (
                    <div className="unit-group-container">
                      <div className="unit-group-header-custom">
                        <strong>{formData.unitTitle}</strong>
                        <span className="base-unit-info">
                          Base: {formData.baseUnit} ({formData.baseUnitCode})
                        </span>
                      </div>
                      <div className="table-scroll-wrapper">
                        <table className="unit-rows-table">
                          <thead>
                            <tr>
                              <th>Sub Unit Name</th>
                              <th>Code</th>
                              <th>Conversion Value</th>
                              <th>Conversion</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUnitData.map((rowData) => (
                              <tr key={rowData.id} className="table-unit-row">
                                <td>{rowData.sub_unit_name}</td>
                                <td>{rowData.code}</td>
                                <td>{rowData.conversion_value}</td>
                                <td>
                                  <div className="conversion-display-inline">
                                    1 <strong>{formData.baseUnitCode}</strong> ={" "}
                                    {rowData.conversion_value}{" "}
                                    <strong>{rowData.code}</strong>
                                  </div>
                                </td>
                                <td>
                                  <div className="table-actions">
                                    <Button
                                      icon="pi pi-pencil"
                                      onClick={() => handleEditUnit(rowData)}
                                      className="p-button-rounded p-button-text p-button-sm"
                                      tooltip="Edit"
                                    />
                                    <Button
                                      icon="pi pi-trash"
                                      onClick={() =>
                                        handleDeleteUnit(rowData.id)
                                      }
                                      className="p-button-rounded p-button-text p-button-danger p-button-sm"
                                      tooltip="Delete"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No sub units found</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Select a base unit to view sub units</p>
              <small>Choose from the Base Unit dropdown above</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitManagement;
