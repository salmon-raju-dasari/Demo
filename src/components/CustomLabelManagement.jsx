import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { TabMenu } from "primereact/tabmenu";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import api from "../services/api/axios";
import "./CustomLabelManagement.css";

/**
 * Custom Label Management Component
 * Manage custom labels for Products and Employees
 * Two separate tabs for better organization
 */
export default function CustomLabelManagement() {
  const [activeTab, setActiveTab] = useState(0);

  const tabItems = [
    { label: "Product Labels", icon: "pi pi-box" },
    { label: "Employee Labels", icon: "pi pi-users" },
  ];

  // Product Labels State
  const [productLabels, setProductLabels] = useState([]);
  const [selectedProductLabelName, setSelectedProductLabelName] =
    useState(null);
  const [selectedProductLabelData, setSelectedProductLabelData] =
    useState(null);
  const [productLabelValues, setProductLabelValues] = useState([]);
  const [isEditingProductName, setIsEditingProductName] = useState(false);
  const [editedProductLabelName, setEditedProductLabelName] = useState("");
  const [isCreatingNewProductLabel, setIsCreatingNewProductLabel] =
    useState(false);
  const [newProductLabelName, setNewProductLabelName] = useState("");

  // Employee Labels State
  const [employeeLabels, setEmployeeLabels] = useState([]);
  const [selectedEmployeeLabelName, setSelectedEmployeeLabelName] =
    useState(null);
  const [selectedEmployeeLabelData, setSelectedEmployeeLabelData] =
    useState(null);
  const [employeeLabelValues, setEmployeeLabelValues] = useState([]);
  const [isEditingEmployeeName, setIsEditingEmployeeName] = useState(false);
  const [editedEmployeeLabelName, setEditedEmployeeLabelName] = useState("");
  const [isCreatingNewEmployeeLabel, setIsCreatingNewEmployeeLabel] =
    useState(false);
  const [newEmployeeLabelName, setNewEmployeeLabelName] = useState("");

  const [saveLoading, setSaveLoading] = useState(false);
  const toast = useRef(null);

  // Fetch all custom labels
  const fetchCustomLabels = useCallback(async () => {
    try {
      const response = await api.get("/custom-labels");
      const labels = response.data || [];

      // Separate by label_type
      setProductLabels(labels.filter((l) => l.label_type === "product"));
      setEmployeeLabels(labels.filter((l) => l.label_type === "employee"));
    } catch (error) {
      console.error("Error fetching custom labels:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load custom labels",
        life: 4000,
      });
    }
  }, []);

  useEffect(() => {
    fetchCustomLabels();
  }, [fetchCustomLabels]);

  // PRODUCT LABEL HANDLERS
  const handleProductLabelSelect = (labelName) => {
    if (!labelName) {
      setSelectedProductLabelName(null);
      setSelectedProductLabelData(null);
      setProductLabelValues([]);
      setEditedProductLabelName("");
      setIsEditingProductName(false);
      return;
    }

    const labelData = productLabels.find((l) => l.label_name === labelName);
    if (labelData) {
      setSelectedProductLabelName(labelName);
      setSelectedProductLabelData(labelData);
      setProductLabelValues(labelData.label_values || []);
      setEditedProductLabelName(labelData.label_name);
      setIsEditingProductName(false);
      setIsCreatingNewProductLabel(false);
      setNewProductLabelName("");
    }
  };

  const handleCreateNewProductLabel = () => {
    setIsCreatingNewProductLabel(true);
    setSelectedProductLabelName(null);
    setSelectedProductLabelData(null);
    setProductLabelValues([""]);
    setNewProductLabelName("");
    setIsEditingProductName(false);
    setEditedProductLabelName("");
  };

  const handleAddProductValue = () => {
    setProductLabelValues((prev) => [...prev, ""]);
  };

  const handleProductValueChange = (index, value) => {
    setProductLabelValues((prev) =>
      prev.map((v, i) => (i === index ? value : v))
    );
  };

  // EMPLOYEE LABEL HANDLERS
  const handleEmployeeLabelSelect = (labelName) => {
    if (!labelName) {
      setSelectedEmployeeLabelName(null);
      setSelectedEmployeeLabelData(null);
      setEmployeeLabelValues([]);
      setEditedEmployeeLabelName("");
      setIsEditingEmployeeName(false);
      return;
    }

    const labelData = employeeLabels.find((l) => l.label_name === labelName);
    if (labelData) {
      setSelectedEmployeeLabelName(labelName);
      setSelectedEmployeeLabelData(labelData);
      setEmployeeLabelValues(labelData.label_values || []);
      setEditedEmployeeLabelName(labelData.label_name);
      setIsEditingEmployeeName(false);
      setIsCreatingNewEmployeeLabel(false);
      setNewEmployeeLabelName("");
    }
  };

  const handleCreateNewEmployeeLabel = () => {
    setIsCreatingNewEmployeeLabel(true);
    setSelectedEmployeeLabelName(null);
    setSelectedEmployeeLabelData(null);
    setEmployeeLabelValues([""]);
    setNewEmployeeLabelName("");
    setIsEditingEmployeeName(false);
    setEditedEmployeeLabelName("");
  };

  const handleAddEmployeeValue = () => {
    setEmployeeLabelValues((prev) => [...prev, ""]);
  };

  const handleEmployeeValueChange = (index, value) => {
    setEmployeeLabelValues((prev) =>
      prev.map((v, i) => (i === index ? value : v))
    );
  };

  const handleRemoveProductValue = (index) => {
    if (productLabelValues.length === 1) {
      toast.current?.show({
        severity: "warn",
        summary: "Cannot Remove",
        detail: "At least one value is required.",
        life: 3000,
      });
      return;
    }
    setProductLabelValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveEmployeeValue = (index) => {
    if (employeeLabelValues.length === 1) {
      toast.current?.show({
        severity: "warn",
        summary: "Cannot Remove",
        detail: "At least one value is required.",
        life: 3000,
      });
      return;
    }
    setEmployeeLabelValues((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Product Label
  const handleSaveProductLabel = async () => {
    const labelNameToSave = isCreatingNewProductLabel
      ? newProductLabelName.trim()
      : isEditingProductName
      ? editedProductLabelName.trim()
      : selectedProductLabelData?.label_name;
    const validValues = productLabelValues
      .filter((v) => v.trim())
      .map((v) => v.trim());

    if (!labelNameToSave) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Input",
        detail: "Please enter a label name.",
        life: 3000,
      });
      return;
    }

    if (validValues.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Input",
        detail: "Please add at least one label value.",
        life: 3000,
      });
      return;
    }

    try {
      setSaveLoading(true);

      const labelData = {
        label_name: labelNameToSave,
        label_values: validValues,
        label_type: "product",
      };

      if (isCreatingNewProductLabel) {
        await api.post("/custom-labels", labelData);
        toast.current?.show({
          severity: "success",
          summary: "Label Created",
          detail: `Product label "${labelNameToSave}" has been created successfully`,
          life: 3000,
        });
      } else {
        await api.put(
          `/custom-labels/${selectedProductLabelData.id}`,
          labelData
        );
        toast.current?.show({
          severity: "success",
          summary: "Label Updated",
          detail: `Product label "${labelNameToSave}" has been updated successfully`,
          life: 3000,
        });
      }

      await fetchCustomLabels();

      if (!isCreatingNewProductLabel) {
        setTimeout(async () => {
          const response = await api.get("/custom-labels");
          const updatedLabel = response.data.find(
            (l) => l.id === selectedProductLabelData.id
          );
          if (updatedLabel) {
            setSelectedProductLabelName(updatedLabel.label_name);
            setSelectedProductLabelData(updatedLabel);
            setProductLabelValues(updatedLabel.label_values || []);
            setEditedProductLabelName(updatedLabel.label_name);
            setIsEditingProductName(false);
          }
        }, 300);
      } else {
        setIsCreatingNewProductLabel(false);
        setNewProductLabelName("");
        setProductLabelValues([]);
        setSelectedProductLabelName(null);
        setSelectedProductLabelData(null);
      }
    } catch (error) {
      console.error("Error saving product label:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.detail || "Failed to save product label",
        life: 4000,
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Save Employee Label
  const handleSaveEmployeeLabel = async () => {
    const labelNameToSave = isCreatingNewEmployeeLabel
      ? newEmployeeLabelName.trim()
      : isEditingEmployeeName
      ? editedEmployeeLabelName.trim()
      : selectedEmployeeLabelData?.label_name;
    const validValues = employeeLabelValues
      .filter((v) => v.trim())
      .map((v) => v.trim());

    if (!labelNameToSave) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Input",
        detail: "Please enter a label name.",
        life: 3000,
      });
      return;
    }

    if (validValues.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Input",
        detail: "Please add at least one label value.",
        life: 3000,
      });
      return;
    }

    try {
      setSaveLoading(true);

      const labelData = {
        label_name: labelNameToSave,
        label_values: validValues,
        label_type: "employee",
      };

      if (isCreatingNewEmployeeLabel) {
        await api.post("/custom-labels", labelData);
        toast.current?.show({
          severity: "success",
          summary: "Label Created",
          detail: `Employee label "${labelNameToSave}" has been created successfully`,
          life: 3000,
        });
      } else {
        await api.put(
          `/custom-labels/${selectedEmployeeLabelData.id}`,
          labelData
        );
        toast.current?.show({
          severity: "success",
          summary: "Label Updated",
          detail: `Employee label "${labelNameToSave}" has been updated successfully`,
          life: 3000,
        });
      }

      await fetchCustomLabels();

      if (!isCreatingNewEmployeeLabel) {
        setTimeout(async () => {
          const response = await api.get("/custom-labels");
          const updatedLabel = response.data.find(
            (l) => l.id === selectedEmployeeLabelData.id
          );
          if (updatedLabel) {
            setSelectedEmployeeLabelName(updatedLabel.label_name);
            setSelectedEmployeeLabelData(updatedLabel);
            setEmployeeLabelValues(updatedLabel.label_values || []);
            setEditedEmployeeLabelName(updatedLabel.label_name);
            setIsEditingEmployeeName(false);
          }
        }, 300);
      } else {
        setIsCreatingNewEmployeeLabel(false);
        setNewEmployeeLabelName("");
        setEmployeeLabelValues([]);
        setSelectedEmployeeLabelName(null);
        setSelectedEmployeeLabelData(null);
      }
    } catch (error) {
      console.error("Error saving employee label:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.detail || "Failed to save employee label",
        life: 4000,
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Product Label
  const handleDeleteProductLabel = () => {
    if (!selectedProductLabelData) return;

    confirmDialog({
      message: `Are you sure you want to delete the product label "${selectedProductLabelData.label_name}"? This action cannot be undone.`,
      header: "Confirm Deletion",
      icon: "pi pi-exclamation-triangle",
      contentStyle: { width: "95vw", maxWidth: "600px" },
      accept: async () => {
        try {
          await api.delete(`/custom-labels/${selectedProductLabelData.id}`);
          toast.current?.show({
            severity: "success",
            summary: "Label Deleted",
            detail: `Product label "${selectedProductLabelData.label_name}" has been deleted successfully`,
            life: 3000,
          });

          setSelectedProductLabelName(null);
          setSelectedProductLabelData(null);
          setProductLabelValues([]);
          await fetchCustomLabels();
        } catch (error) {
          console.error("Error deleting product label:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.detail || "Failed to delete product label",
            life: 4000,
          });
        }
      },
    });
  };

  // Delete Employee Label
  const handleDeleteEmployeeLabel = () => {
    if (!selectedEmployeeLabelData) return;

    confirmDialog({
      message: `Are you sure you want to delete the employee label "${selectedEmployeeLabelData.label_name}"? This action cannot be undone.`,
      header: "Confirm Deletion",
      icon: "pi pi-exclamation-triangle",
      contentStyle: { width: "95vw", maxWidth: "600px" },
      accept: async () => {
        try {
          await api.delete(`/custom-labels/${selectedEmployeeLabelData.id}`);
          toast.current?.show({
            severity: "success",
            summary: "Label Deleted",
            detail: `Employee label "${selectedEmployeeLabelData.label_name}" has been deleted successfully`,
            life: 3000,
          });

          setSelectedEmployeeLabelName(null);
          setSelectedEmployeeLabelData(null);
          setEmployeeLabelValues([]);
          await fetchCustomLabels();
        } catch (error) {
          console.error("Error deleting employee label:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.detail || "Failed to delete employee label",
            life: 4000,
          });
        }
      },
    });
  };

  // Cancel Product Label Creation
  const handleCancelNewProductLabel = () => {
    setIsCreatingNewProductLabel(false);
    setNewProductLabelName("");
    setProductLabelValues([]);
    setSelectedProductLabelName(null);
    setSelectedProductLabelData(null);
    setIsEditingProductName(false);
    setEditedProductLabelName("");
  };

  // Cancel Employee Label Creation
  const handleCancelNewEmployeeLabel = () => {
    setIsCreatingNewEmployeeLabel(false);
    setNewEmployeeLabelName("");
    setEmployeeLabelValues([]);
    setSelectedEmployeeLabelName(null);
    setSelectedEmployeeLabelData(null);
    setIsEditingEmployeeName(false);
    setEditedEmployeeLabelName("");
  };

  // Get label options for dropdown
  const productLabelOptions = productLabels.map((label) => ({
    label: label.label_name,
    value: label.label_name,
  }));

  const employeeLabelOptions = employeeLabels.map((label) => ({
    label: label.label_name,
    value: label.label_name,
  }));

  // Render function for label management UI (reusable for both tabs)
  const renderLabelManagementUI = (
    labelType,
    labels,
    selectedLabelName,
    selectedLabelData,
    labelValues,
    isCreatingNewLabel,
    newLabelName,
    isEditingName,
    editedLabelName,
    labelOptions,
    handleLabelSelect,
    handleCreateNewLabel,
    handleCancelNewLabel,
    setNewLabelName,
    setEditedLabelName,
    handleSaveLabel,
    handleDeleteLabel,
    setIsEditingName,
    handleValueChange,
    handleRemoveValue,
    handleAddValue
  ) => {
    const isProduct = labelType === "product";
    const typeLabel = isProduct ? "Product" : "Employee";

    return (
      <>
        {/* Label Selector Section */}
        <Card className="mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2">
                  Select {typeLabel} Label to Manage
                </label>
                <Dropdown
                  value={selectedLabelName}
                  options={labelOptions}
                  onChange={(e) => handleLabelSelect(e.value)}
                  placeholder={`Choose a ${labelType} label`}
                  filter
                  showClear
                  className="w-full"
                  disabled={isCreatingNewLabel}
                />
              </div>
              <Button
                label="Create New Label"
                icon="pi pi-plus"
                severity="success"
                onClick={handleCreateNewLabel}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </Card>

        {/* New Label Creation Section */}
        {isCreatingNewLabel && (
          <Card className="mb-4 bg-blue-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  Create New {typeLabel} Label
                </h3>
                <Button
                  icon="pi pi-times"
                  rounded
                  text
                  severity="secondary"
                  onClick={handleCancelNewLabel}
                  tooltip="Cancel"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">
                  Label Name <span className="text-red-500">*</span>
                </label>
                <InputText
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder={
                    isProduct
                      ? "e.g., Size, Color, Material"
                      : "e.g., Blood Group, Department"
                  }
                  className="w-full"
                />
                <small className="text-gray-600">
                  This will appear as an option when managing {labelType}s
                </small>
              </div>
            </div>
          </Card>
        )}

        {/* Label Values Management Section */}
        {(selectedLabelData || isCreatingNewLabel) && (
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex-1">
                  {isCreatingNewLabel ? (
                    <h3 className="text-lg font-bold text-gray-800">
                      Create New {typeLabel} Label
                    </h3>
                  ) : isEditingName ? (
                    <div className="custom-label-edit-name flex gap-2 items-center flex-wrap">
                      <InputText
                        value={editedLabelName}
                        onChange={(e) => setEditedLabelName(e.target.value)}
                        className="flex-1 min-w-[150px]"
                        placeholder="Label Name"
                      />
                      <div className="custom-label-button-group flex gap-2">
                        <Button
                          icon="pi pi-check"
                          rounded
                          severity="success"
                          size="small"
                          tooltip="Save Name"
                          tooltipOptions={{ position: "top" }}
                          onClick={handleSaveLabel}
                          loading={saveLoading}
                          disabled={saveLoading}
                        />
                        <Button
                          icon="pi pi-times"
                          rounded
                          severity="secondary"
                          size="small"
                          tooltip="Cancel"
                          tooltipOptions={{ position: "top" }}
                          onClick={() => {
                            setEditedLabelName(selectedLabelData?.label_name);
                            setIsEditingName(false);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        Manage \"{selectedLabelData?.label_name}\" Values
                      </h3>
                      <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        size="small"
                        severity="info"
                        tooltip="Edit Label Name"
                        onClick={() => setIsEditingName(true)}
                      />
                    </div>
                  )}
                </div>
                <div className="custom-label-actions flex gap-2 flex-wrap">
                  {!isCreatingNewLabel && (
                    <Button
                      label="Delete"
                      icon="pi pi-trash"
                      severity="danger"
                      outlined
                      onClick={handleDeleteLabel}
                      size="small"
                      className="flex-1 sm:flex-initial"
                    />
                  )}
                  <Button
                    label={isCreatingNewLabel ? "Create" : "Save"}
                    icon="pi pi-save"
                    severity="success"
                    onClick={handleSaveLabel}
                    loading={saveLoading}
                    disabled={saveLoading}
                    size="small"
                    className="flex-1 sm:flex-initial"
                  />
                </div>
              </div>
              <div className="custom-label-values flex flex-col gap-3">
                <label className="text-sm font-semibold">
                  Predefined Values <span className="text-red-500">*</span>
                </label>

                {labelValues.map((value, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <InputText
                        value={value}
                        onChange={(e) =>
                          handleValueChange(index, e.target.value)
                        }
                        placeholder={`Value ${index + 1}`}
                        className="w-full"
                      />
                    </div>
                    <div className="custom-label-button-group flex gap-1">
                      <Button
                        icon="pi pi-trash"
                        rounded
                        severity="danger"
                        outlined
                        onClick={() => handleRemoveValue(index)}
                        tooltip="Remove"
                        tooltipOptions={{ position: "top" }}
                        disabled={labelValues.length === 1}
                      />
                      {index === labelValues.length - 1 && (
                        <Button
                          icon="pi pi-plus"
                          rounded
                          severity="success"
                          onClick={handleAddValue}
                          tooltip="Add Value"
                          tooltipOptions={{ position: "top" }}
                        />
                      )}
                    </div>
                  </div>
                ))}

                <small className="text-gray-600">
                  These values will be available in dropdowns
                </small>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!selectedLabelData && !isCreatingNewLabel && labels.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <i className="pi pi-tags text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No {typeLabel} Labels Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first {labelType} label to get started
              </p>
              <Button
                label="Create Label"
                icon="pi pi-plus"
                severity="success"
                onClick={handleCreateNewLabel}
              />
            </div>
          </Card>
        )}

        {/* Info State */}
        {!selectedLabelData && !isCreatingNewLabel && labels.length > 0 && (
          <Card>
            <div className="text-center py-8">
              <i className="pi pi-info-circle text-6xl text-blue-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a {typeLabel} Label to Manage
              </h3>
              <p className="text-gray-500">
                Choose a {labelType} label from above to view and edit its
                values
              </p>
            </div>
          </Card>
        )}
      </>
    );
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      {/* Main Screen */}
      <div className="custom-label-main-container">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Custom Label Management
          </h2>
          <p className="text-gray-600 text-sm">
            Manage custom labels for products and employees
          </p>
        </div>

        {/* Tabbed Interface */}
        <TabMenu
          model={tabItems}
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
          className="custom-label-tabs"
        />

        {/* Tab Content */}
        <div className="tab-panels">
          {activeTab === 0 && (
            <div className="tab-panel">
              {renderLabelManagementUI(
                "product",
                productLabels,
                selectedProductLabelName,
                selectedProductLabelData,
                productLabelValues,
                isCreatingNewProductLabel,
                newProductLabelName,
                isEditingProductName,
                editedProductLabelName,
                productLabelOptions,
                handleProductLabelSelect,
                handleCreateNewProductLabel,
                handleCancelNewProductLabel,
                setNewProductLabelName,
                setEditedProductLabelName,
                handleSaveProductLabel,
                handleDeleteProductLabel,
                setIsEditingProductName,
                handleProductValueChange,
                handleRemoveProductValue,
                handleAddProductValue
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div className="tab-panel">
              {renderLabelManagementUI(
                "employee",
                employeeLabels,
                selectedEmployeeLabelName,
                selectedEmployeeLabelData,
                employeeLabelValues,
                isCreatingNewEmployeeLabel,
                newEmployeeLabelName,
                isEditingEmployeeName,
                editedEmployeeLabelName,
                employeeLabelOptions,
                handleEmployeeLabelSelect,
                handleCreateNewEmployeeLabel,
                handleCancelNewEmployeeLabel,
                setNewEmployeeLabelName,
                setEditedEmployeeLabelName,
                handleSaveEmployeeLabel,
                handleDeleteEmployeeLabel,
                setIsEditingEmployeeName,
                handleEmployeeValueChange,
                handleRemoveEmployeeValue,
                handleAddEmployeeValue
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
