import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import api from "../services/api/axios";
import "./CustomLabelManagement.css";

/**
 * Custom Label Management Component
 * Manage custom labels and their predefined values
 * Optimized for all screen sizes with dropdown-based interface
 */
export default function CustomLabelManagement() {
  const [customLabels, setCustomLabels] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);

  // Selected label state
  const [selectedLabelName, setSelectedLabelName] = useState(null);
  const [selectedLabelData, setSelectedLabelData] = useState(null);

  // Label values state (for editing)
  const [labelValues, setLabelValues] = useState([]);

  // Label name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedLabelName, setEditedLabelName] = useState("");

  // New label creation state
  const [isCreatingNewLabel, setIsCreatingNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  const toast = useRef(null);

  // Fetch all custom labels
  const fetchCustomLabels = useCallback(async () => {
    try {
      const response = await api.get("/custom-labels");
      setCustomLabels(response.data || []);
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

  // Handle label selection from dropdown
  const handleLabelSelect = (labelName) => {
    if (!labelName) {
      // Clear selection
      setSelectedLabelName(null);
      setSelectedLabelData(null);
      setLabelValues([]);
      setEditedLabelName("");
      setIsEditingName(false);
      return;
    }

    const labelData = customLabels.find((l) => l.label_name === labelName);
    if (labelData) {
      setSelectedLabelName(labelName);
      setSelectedLabelData(labelData);
      setLabelValues(labelData.label_values || []);
      setEditedLabelName(labelData.label_name);
      setIsEditingName(false);
      setIsCreatingNewLabel(false);
      setNewLabelName("");
    }
  };

  // Handle creating a new label
  const handleCreateNewLabel = () => {
    setIsCreatingNewLabel(true);
    setSelectedLabelName(null);
    setSelectedLabelData(null);
    setLabelValues([""]);
    setNewLabelName("");
    setIsEditingName(false);
    setEditedLabelName("");
  };

  // Add new value field
  const handleAddValue = () => {
    setLabelValues((prev) => [...prev, ""]);
  };

  // Update value at index
  const handleValueChange = (index, value) => {
    setLabelValues((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  // Remove value at index
  const handleRemoveValue = (index) => {
    if (labelValues.length === 1) {
      toast.current?.show({
        severity: "warn",
        summary: "Cannot Remove",
        detail: "At least one value is required.",
        life: 3000,
      });
      return;
    }
    setLabelValues((prev) => prev.filter((_, i) => i !== index));
  };

  // Save label (create or update)
  const handleSaveLabel = async () => {
    const labelNameToSave = isCreatingNewLabel
      ? newLabelName.trim()
      : isEditingName
      ? editedLabelName.trim()
      : selectedLabelData?.label_name;
    const validValues = labelValues
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
      };

      if (isCreatingNewLabel) {
        // Create new label
        await api.post("/custom-labels", labelData);

        toast.current?.show({
          severity: "success",
          summary: "Label Created",
          detail: `Label "${labelNameToSave}" has been created successfully`,
          life: 3000,
        });
      } else {
        // Update existing label
        await api.put(`/custom-labels/${selectedLabelData.id}`, labelData);

        toast.current?.show({
          severity: "success",
          summary: "Label Updated",
          detail: `Label "${labelNameToSave}" has been updated successfully`,
          life: 3000,
        });
      }

      await fetchCustomLabels();

      // Refresh the selected label data
      if (!isCreatingNewLabel) {
        // After update, re-fetch to get the updated label
        setTimeout(async () => {
          const response = await api.get("/custom-labels");
          const updatedLabel = response.data.find(
            (l) => l.id === selectedLabelData.id
          );
          if (updatedLabel) {
            setSelectedLabelName(updatedLabel.label_name);
            setSelectedLabelData(updatedLabel);
            setLabelValues(updatedLabel.label_values || []);
            setEditedLabelName(updatedLabel.label_name);
            setIsEditingName(false);
          }
        }, 300);
      } else {
        // After creation, reset to selection screen
        setIsCreatingNewLabel(false);
        setNewLabelName("");
        setLabelValues([]);
        setSelectedLabelName(null);
        setSelectedLabelData(null);
      }
    } catch (error) {
      console.error("Error saving label:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to save label";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 4000,
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete current label
  const handleDeleteLabel = () => {
    if (!selectedLabelData) return;

    confirmDialog({
      message: `Are you sure you want to delete the label "${selectedLabelData.label_name}"? This action cannot be undone.`,
      header: "Confirm Deletion",
      icon: "pi pi-exclamation-triangle",
      contentStyle: { width: "95vw", maxWidth: "600px" },
      accept: async () => {
        try {
          await api.delete(`/custom-labels/${selectedLabelData.id}`);

          toast.current?.show({
            severity: "success",
            summary: "Label Deleted",
            detail: `Label "${selectedLabelData.label_name}" has been deleted successfully`,
            life: 3000,
          });

          // Reset selection
          setSelectedLabelName(null);
          setSelectedLabelData(null);
          setLabelValues([]);

          await fetchCustomLabels();
        } catch (error) {
          console.error("Error deleting label:", error);
          const errorMessage =
            error.response?.data?.detail || "Failed to delete label";
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: errorMessage,
            life: 4000,
          });
        }
      },
    });
  };

  // Cancel new label creation
  const handleCancelNewLabel = () => {
    setIsCreatingNewLabel(false);
    setNewLabelName("");
    setLabelValues([]);
    setSelectedLabelName(null);
    setSelectedLabelData(null);
    setIsEditingName(false);
    setEditedLabelName("");
  };

  // Get label options for dropdown
  const labelOptions = customLabels.map((label) => ({
    label: label.label_name,
    value: label.label_name,
  }));

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
            Define custom labels and their predefined values for employee
            records
          </p>
        </div>

        {/* Label Selector Section */}
        <Card className="mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2">
                  Select Label to Manage
                </label>
                <Dropdown
                  value={selectedLabelName}
                  options={labelOptions}
                  onChange={(e) => handleLabelSelect(e.value)}
                  placeholder="Choose a custom label"
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
                  Create New Label
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
                  placeholder="e.g., Shirt Size, Blood Group, Department"
                  className="w-full"
                />
                <small className="text-gray-600">
                  This will appear as a dropdown option when adding employee
                  custom fields
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
                      Create New Label
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
                        Manage "{selectedLabelData?.label_name}" Values
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
                  These values will be available in the dropdown when this label
                  is selected
                </small>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!selectedLabelData &&
          !isCreatingNewLabel &&
          customLabels.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <i className="pi pi-tags text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Custom Labels Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first custom label to get started
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
        {!selectedLabelData &&
          !isCreatingNewLabel &&
          customLabels.length > 0 && (
            <Card>
              <div className="text-center py-8">
                <i className="pi pi-info-circle text-6xl text-blue-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Select a Label to Manage
                </h3>
                <p className="text-gray-500">
                  Choose a label from the dropdown above to view and edit its
                  values
                </p>
              </div>
            </Card>
          )}
      </div>
    </>
  );
}
