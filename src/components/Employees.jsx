import { useState, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputMask } from "primereact/inputmask";
import { Card } from "primereact/card";
import { Calendar } from "primereact/calendar";
import { AutoComplete } from "primereact/autocomplete";
import "../styles/employees.css";

/**
 * Employees Component
 * Enterprise-grade employee management with:
 * - Complete employee form with all required fields
 * - Country dropdown with all countries
 * - Phone number with country code
 * - PrimeReact DataTable for employee listing
 * - Add/Edit/Delete operations with dialog popup
 */
export default function Employees() {
  // Country list (sample - add more as needed)
  const countries = [
    { name: "India", code: "IN", dialCode: "+91" },
    { name: "United States", code: "US", dialCode: "+1" },
    { name: "United Kingdom", code: "GB", dialCode: "+44" },
    { name: "Canada", code: "CA", dialCode: "+1" },
    { name: "Australia", code: "AU", dialCode: "+61" },
    { name: "Germany", code: "DE", dialCode: "+49" },
    { name: "France", code: "FR", dialCode: "+33" },
    { name: "Japan", code: "JP", dialCode: "+81" },
    { name: "China", code: "CN", dialCode: "+86" },
    { name: "Brazil", code: "BR", dialCode: "+55" },
    { name: "Mexico", code: "MX", dialCode: "+52" },
    { name: "Singapore", code: "SG", dialCode: "+65" },
    { name: "United Arab Emirates", code: "AE", dialCode: "+971" },
    { name: "Saudi Arabia", code: "SA", dialCode: "+966" },
    { name: "South Africa", code: "ZA", dialCode: "+27" },
  ];

  // Employee roles
  const roles = [
    { label: "Admin", value: "admin" },
    { label: "Manager", value: "manager" },
    { label: "Cashier", value: "cashier" },
    { label: "Stock Keeper", value: "stock_keeper" },
    { label: "Sales Representative", value: "sales_rep" },
    { label: "Supervisor", value: "supervisor" },
  ];

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: "",
    employeeName: "",
    employeeEmail: "",
    countryCode: countries[0],
    phoneNumber: "",
    aadharNumber: "",
    address: "",
    city: "",
    state: "",
    country: null,
    role: null,
    joiningDate: null,
  });

  // UI state
  const [employees, setEmployees] = useState([
    {
      id: 1,
      employeeId: "EMP001",
      employeeName: "John Doe",
      employeeEmail: "john.doe@example.com",
      phoneNumber: "+91 9876543210",
      aadharNumber: "1234-5678-9012",
      address: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      role: "Manager",
      joiningDate: "2024-01-15",
    },
    {
      id: 2,
      employeeId: "EMP002",
      employeeName: "Jane Smith",
      employeeEmail: "jane.smith@example.com",
      phoneNumber: "+1 5551234567",
      aadharNumber: "9876-5432-1098",
      address: "456 Oak Avenue",
      city: "New York",
      state: "New York",
      country: "United States",
      role: "Cashier",
      joiningDate: "2024-03-20",
    },
  ]);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterField, setFilterField] = useState(null);
  const [filterValue, setFilterValue] = useState("");
  const toast = useRef(null);

  // Custom Labels state for employee dialog
  const [employeeLabels, setEmployeeLabels] = useState([]);

  // Custom Label Definition Dialog state
  const [customLabelDialogVisible, setCustomLabelDialogVisible] =
    useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelValues, setNewLabelValues] = useState([""]);

  // Deprecated AutoComplete suggestion state (not used with Dropdown)
  // const [labelNameSuggestions, setLabelNameSuggestions] = useState([]);
  // const [labelValueSuggestions, setLabelValueSuggestions] = useState([]);

  // Predefined common label names
  const commonLabelNames = [
    "Emergency Contact",
    "Blood Group",
    "Department",
    "Reporting Manager",
    "Work Location",
    "Employee Type",
    "Skills",
    "Certification",
    "Languages Known",
    "Previous Company",
    "Size",
  ];

  // Predefined values for specific label names (stateful to allow custom additions)
  const [labelValueMappings, setLabelValueMappings] = useState({
    Size: ["XL", "L", "M", "S", "XS"],
    "Blood Group": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "Employee Type": ["Full-Time", "Part-Time", "Contract", "Intern"],
  });

  // Build label name options from predefined + custom defined + existing employee labels
  const labelNameOptions = [
    ...commonLabelNames.map((n) => ({ label: n, value: n })),
    // Add custom defined labels from labelValueMappings that aren't in commonLabelNames
    ...Object.keys(labelValueMappings)
      .filter((key) => !commonLabelNames.includes(key))
      .map((key) => ({ label: key, value: key })),
    // Add labels from existing employees that aren't already included
    ...new Set(
      employees
        .flatMap((e) => (e.customLabels || []).map((cl) => cl.name))
        .filter(Boolean)
        .filter((n) => !commonLabelNames.includes(n) && !labelValueMappings[n])
    ),
  ].map((n) => (typeof n === "string" ? { label: n, value: n } : n));

  // Note: labelValueOptions replaced by getLabelValueOptions() for dynamic mapping

  // Filter options for dropdown
  const filterOptions = [
    { label: "Employee ID", value: "employeeId" },
    { label: "Employee Name", value: "employeeName" },
    { label: "Email", value: "employeeEmail" },
    { label: "Phone Number", value: "phoneNumber" },
    { label: "Aadhar Number", value: "aadharNumber" },
    { label: "City", value: "city" },
    { label: "State", value: "state" },
    { label: "Country", value: "country" },
    { label: "Role", value: "role" },
  ];

  // Form field change handler
  const handleChange = (field, value) => {
    setEmployeeForm((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setEmployeeForm({
      employeeId: "",
      employeeName: "",
      employeeEmail: "",
      countryCode: countries[0],
      phoneNumber: "",
      aadharNumber: "",
      address: "",
      city: "",
      state: "",
      country: null,
      role: null,
      joiningDate: null,
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // Open dialog for adding new employee
  const handleAddEmployee = () => {
    resetForm();
    setEmployeeLabels([]);
    setDialogVisible(true);
  };

  // Open dialog for editing employee
  const handleEditEmployee = (employee) => {
    const countryObj =
      countries.find((c) => c.name === employee.country) || countries[0];
    const phoneWithoutCode = employee.phoneNumber
      .replace(countryObj.dialCode, "")
      .trim();

    setEmployeeForm({
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      employeeEmail: employee.employeeEmail,
      countryCode: countryObj,
      phoneNumber: phoneWithoutCode,
      aadharNumber: employee.aadharNumber,
      address: employee.address,
      city: employee.city,
      state: employee.state,
      country: countries.find((c) => c.name === employee.country),
      role: roles.find((r) => r.label === employee.role),
      joiningDate: employee.joiningDate ? new Date(employee.joiningDate) : null,
    });
    setIsEditing(true);
    setEditingId(employee.id);
    setDialogVisible(true);
    // Load custom labels if present
    if (employee.customLabels && Array.isArray(employee.customLabels)) {
      setEmployeeLabels(
        employee.customLabels.map((cl) => ({
          id: Date.now() + Math.random(),
          name: cl.name || "",
          value: cl.value || "",
          saved: true,
        }))
      );
    } else {
      setEmployeeLabels([]);
    }
  };

  // Delete employee
  const handleDeleteEmployee = (id) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    toast.current?.show({
      severity: "success",
      summary: "Employee Deleted",
      detail: "Employee has been removed successfully",
      life: 3000,
    });
  };

  // Save employee (add or update)
  const handleSaveEmployee = () => {
    // Validation
    if (
      !employeeForm.employeeId.trim() ||
      !employeeForm.employeeName.trim() ||
      !employeeForm.employeeEmail.trim() ||
      !employeeForm.phoneNumber.trim() ||
      !employeeForm.country ||
      !employeeForm.role
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail:
          "Please fill in all required fields (ID, Name, Email, Phone, Country, Role)",
        life: 4000,
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeForm.employeeEmail)) {
      toast.current?.show({
        severity: "warn",
        summary: "Invalid Email",
        detail: "Please enter a valid email address",
        life: 3000,
      });
      return;
    }

    const fullPhone = `${employeeForm.countryCode.dialCode} ${employeeForm.phoneNumber}`;

    if (isEditing) {
      // Update existing employee
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingId
            ? {
                ...emp,
                employeeId: employeeForm.employeeId,
                employeeName: employeeForm.employeeName,
                employeeEmail: employeeForm.employeeEmail,
                phoneNumber: fullPhone,
                aadharNumber: employeeForm.aadharNumber,
                address: employeeForm.address,
                city: employeeForm.city,
                state: employeeForm.state,
                country: employeeForm.country.name,
                role: employeeForm.role.label,
                joiningDate: employeeForm.joiningDate
                  ? employeeForm.joiningDate.toISOString().split("T")[0]
                  : null,
                customLabels: employeeLabels
                  .filter((l) => l.saved && l.name && l.value)
                  .map((l) => ({ name: l.name, value: l.value })),
              }
            : emp
        )
      );
      toast.current?.show({
        severity: "success",
        summary: "Employee Updated",
        detail: `${employeeForm.employeeName} has been updated successfully`,
        life: 3000,
      });
    } else {
      // Add new employee
      const newEmployee = {
        id: Date.now(),
        employeeId: employeeForm.employeeId,
        employeeName: employeeForm.employeeName,
        employeeEmail: employeeForm.employeeEmail,
        phoneNumber: fullPhone,
        aadharNumber: employeeForm.aadharNumber,
        address: employeeForm.address,
        city: employeeForm.city,
        state: employeeForm.state,
        country: employeeForm.country.name,
        role: employeeForm.role.label,
        joiningDate: employeeForm.joiningDate
          ? employeeForm.joiningDate.toISOString().split("T")[0]
          : null,
        customLabels: employeeLabels
          .filter((l) => l.saved && l.name && l.value)
          .map((l) => ({ name: l.name, value: l.value })),
      };
      setEmployees((prev) => [...prev, newEmployee]);
      toast.current?.show({
        severity: "success",
        summary: "Employee Added",
        detail: `${employeeForm.employeeName} has been added successfully`,
        life: 3000,
      });
    }

    setDialogVisible(false);
    resetForm();
  };

  // Cancel dialog
  const handleCancel = () => {
    setDialogVisible(false);
    resetForm();
  };

  // Custom Labels helpers
  const addEmptyEmployeeLabel = () => {
    if (employeeLabels.some((l) => !l.saved)) return;
    setEmployeeLabels((prev) => [
      ...prev,
      { id: Date.now(), name: "", value: "", saved: false },
    ]);
  };

  const saveEmployeeLabel = (id) => {
    const label = employeeLabels.find((l) => l.id === id);
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
    const duplicate = employeeLabels.find(
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

    setEmployeeLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, saved: true } : l))
    );
    toast.current?.show({
      severity: "success",
      summary: "Custom Field Saved",
      detail: `${label.name}: ${label.value}`,
      life: 2000,
    });
  };

  const removeEmployeeLabel = (id) => {
    setEmployeeLabels((prev) => prev.filter((l) => l.id !== id));
  };

  const updateEmployeeLabel = (id, field, value) => {
    setEmployeeLabels((prev) =>
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
          return { ...l, [field]: value };
        }
        return l;
      })
    );
  };

  const cancelEditEmployeeLabel = (id) => {
    setEmployeeLabels((prev) =>
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

    // If predefined mapping exists, use it
    if (labelValueMappings[labelName]) {
      return labelValueMappings[labelName].map((v) => ({ label: v, value: v }));
    }

    // Otherwise, get values from existing employee labels with this name
    const existingValues = [
      ...new Set(
        employees
          .flatMap((e) => e.customLabels || [])
          .filter((cl) => cl.name === labelName)
          .map((cl) => cl.value)
          .filter(Boolean)
      ),
    ];

    return existingValues.map((v) => ({ label: v, value: v }));
  };

  // Custom Label Definition Dialog handlers
  const handleOpenCustomLabelDialog = () => {
    setNewLabelName("");
    setNewLabelValues([""]);
    setCustomLabelDialogVisible(true);
  };

  const handleAddLabelValue = () => {
    setNewLabelValues((prev) => [...prev, ""]);
  };

  const handleRemoveLabelValue = (index) => {
    setNewLabelValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLabelValueChange = (index, value) => {
    setNewLabelValues((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleSaveCustomLabel = () => {
    const trimmedName = newLabelName.trim();
    const validValues = newLabelValues
      .filter((v) => v.trim())
      .map((v) => v.trim());

    if (!trimmedName) {
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

    // Check if label name already exists
    if (labelValueMappings[trimmedName]) {
      toast.current?.show({
        severity: "warn",
        summary: "Label Already Exists",
        detail: `Label "${trimmedName}" already exists. Values will be merged.`,
        life: 3000,
      });
    }

    // Add or update label mapping
    setLabelValueMappings((prev) => ({
      ...prev,
      [trimmedName]: [
        ...new Set([...(prev[trimmedName] || []), ...validValues]),
      ],
    }));

    toast.current?.show({
      severity: "success",
      summary: "Custom Label Added",
      detail: `Label "${trimmedName}" with ${validValues.length} value(s) has been added.`,
      life: 3000,
    });

    setCustomLabelDialogVisible(false);
  };

  const handleCancelCustomLabel = () => {
    setCustomLabelDialogVisible(false);
  };

  // Deprecated AutoComplete search methods (replaced by Dropdown filter)
  // const searchLabelName = (event) => { /* ... */ };
  // const searchLabelValue = (event) => { /* ... */ };

  // Filter employees based on search criteria
  const filteredEmployees = employees.filter((employee) => {
    if (!filterField || !filterValue.trim()) {
      return true;
    }
    const fieldValue = employee[filterField]?.toString().toLowerCase() || "";
    return fieldValue.includes(filterValue.toLowerCase());
  });

  // Clear filters
  const handleClearFilters = () => {
    setFilterField(null);
    setFilterValue("");
  };

  // Render employee card
  const renderEmployeeCard = (employee) => {
    return (
      <Card key={employee.id} className="employee-card">
        <div className="employee-card-header">
          <div className="employee-avatar">
            <i className="pi pi-user"></i>
          </div>
          <div className="employee-basic-info">
            <h3 className="employee-name">{employee.employeeName}</h3>
            <span className="employee-id">ID: {employee.employeeId}</span>
          </div>
        </div>

        <div className="employee-card-body">
          <div className="employee-info-row">
            <i className="pi pi-envelope info-icon"></i>
            <span className="info-text">{employee.employeeEmail}</span>
          </div>
          {employee.role && (
            <div className="employee-info-row">
              <i className="pi pi-briefcase info-icon"></i>
              <span className="info-text role-badge">{employee.role}</span>
            </div>
          )}
          {employee.joiningDate && (
            <div className="employee-info-row">
              <i className="pi pi-calendar info-icon"></i>
              <span className="info-text">Joined: {employee.joiningDate}</span>
            </div>
          )}
          <div className="employee-info-row">
            <i className="pi pi-phone info-icon"></i>
            <span className="info-text">{employee.phoneNumber}</span>
          </div>
          {employee.aadharNumber && (
            <div className="employee-info-row">
              <i className="pi pi-id-card info-icon"></i>
              <span className="info-text">{employee.aadharNumber}</span>
            </div>
          )}
          <div className="employee-info-row">
            <i className="pi pi-map-marker info-icon"></i>
            <span className="info-text">
              {[employee.city, employee.state, employee.country]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
          {employee.address && (
            <div className="employee-info-row">
              <i className="pi pi-home info-icon"></i>
              <span className="info-text">{employee.address}</span>
            </div>
          )}
        </div>

        <div className="employee-card-actions">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            className="p-button-sm p-button-info"
            onClick={() => handleEditEmployee(employee)}
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            className="p-button-sm p-button-danger p-button-outlined"
            onClick={() => handleDeleteEmployee(employee.id)}
          />
        </div>
      </Card>
    );
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />

      {/* Add Employee Dialog */}
      <Dialog
        header={isEditing ? "Edit Employee" : "Add New Employee"}
        visible={dialogVisible}
        style={{ width: "95vw", maxWidth: "700px" }}
        onHide={handleCancel}
        draggable={false}
        resizable={false}
        blockScroll
        className="employee-dialog"
      >
        <div className="employee-dialog-content">
          {/* Employee ID */}
          <div className="flex flex-col gap-2">
            <label htmlFor="emp-id" className="text-[0.85rem] font-semibold">
              Employee ID <span className="text-red-500">*</span>
            </label>
            <InputText
              id="emp-id"
              value={employeeForm.employeeId}
              onChange={(e) => handleChange("employeeId", e.target.value)}
              placeholder="Enter employee ID"
              className="w-full"
            />
          </div>

          {/* Employee Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="emp-name" className="text-[0.85rem] font-semibold">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <InputText
              id="emp-name"
              value={employeeForm.employeeName}
              onChange={(e) => handleChange("employeeName", e.target.value)}
              placeholder="Enter employee name"
              className="w-full"
            />
          </div>

          {/* Employee Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="emp-email" className="text-[0.85rem] font-semibold">
              Employee Email <span className="text-red-500">*</span>
            </label>
            <InputText
              id="emp-email"
              type="email"
              value={employeeForm.employeeEmail}
              onChange={(e) => handleChange("employeeEmail", e.target.value)}
              placeholder="employee@example.com"
              className="w-full"
            />
          </div>

          {/* Phone Number with Country Code */}
          <div className="flex flex-col gap-2">
            <label htmlFor="emp-phone" className="text-[0.85rem] font-semibold">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 phone-input-group">
              <Dropdown
                value={employeeForm.countryCode}
                options={countries}
                onChange={(e) => handleChange("countryCode", e.value)}
                optionLabel="dialCode"
                placeholder="Code"
                className="phone-code-dropdown"
                filter
              />
              <InputText
                id="emp-phone"
                value={employeeForm.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                placeholder="Phone number"
                className="phone-input-field"
              />
            </div>
          </div>

          {/* Aadhar Number */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="emp-aadhar"
              className="text-[0.85rem] font-semibold"
            >
              Aadhar Number
            </label>
            <InputMask
              id="emp-aadhar"
              value={employeeForm.aadharNumber}
              onChange={(e) => handleChange("aadharNumber", e.target.value)}
              mask="9999-9999-9999"
              placeholder="1234-5678-9012"
              className="w-full"
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="emp-address"
              className="text-[0.85rem] font-semibold"
            >
              Address
            </label>
            <InputText
              id="emp-address"
              value={employeeForm.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Street address"
              className="w-full"
            />
          </div>

          {/* City */}
          <div className="flex flex-col gap-2">
            <label htmlFor="emp-city" className="text-[0.85rem] font-semibold">
              City
            </label>
            <InputText
              id="emp-city"
              value={employeeForm.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="City"
              className="w-full"
            />
          </div>

          {/* State */}
          <div className="flex flex-col gap-2">
            <label htmlFor="emp-state" className="text-[0.85rem] font-semibold">
              State
            </label>
            <InputText
              id="emp-state"
              value={employeeForm.state}
              onChange={(e) => handleChange("state", e.target.value)}
              placeholder="State"
              className="w-full"
            />
          </div>

          {/* Country */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="emp-country"
              className="text-[0.85rem] font-semibold"
            >
              Country <span className="text-red-500">*</span>
            </label>
            <Dropdown
              id="emp-country"
              value={employeeForm.country}
              options={countries}
              onChange={(e) => handleChange("country", e.value)}
              optionLabel="name"
              placeholder="Select country"
              className="w-full"
              filter
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <label htmlFor="emp-role" className="text-[0.85rem] font-semibold">
              Role <span className="text-red-500">*</span>
            </label>
            <Dropdown
              id="emp-role"
              value={employeeForm.role}
              options={roles}
              onChange={(e) => handleChange("role", e.value)}
              optionLabel="label"
              placeholder="Select role"
              className="w-full"
              filter
            />
          </div>

          {/* Joining Date */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="emp-joining-date"
              className="text-[0.85rem] font-semibold"
            >
              Joining Date
            </label>
            <Calendar
              id="emp-joining-date"
              value={employeeForm.joiningDate}
              placeholder="Enter joining date"
              onChange={(e) => handleChange("joiningDate", e.value)}
              className="w-full"
              touchUI
            />
          </div>

          {/* Add Custom Label Definition Button (before Custom Fields) */}
          <div className="flex items-center gap-2 mb-2">
            <Button
              icon="pi pi-plus"
              label="Define Custom Label"
              size="small"
              severity="help"
              outlined
              onClick={handleOpenCustomLabelDialog}
              tooltip="Add a new custom label with predefined values"
              tooltipOptions={{ position: "top" }}
            />
          </div>

          {/* Custom Fields (Labels) under Joining Date */}
          <div className="bg-blue-100 p-4 pt-3 rounded">
            <div className="flex items-center justify-between">
              <label className="text-[1rem] font-bold">Custom Fields</label>
              <Button
                icon="pi pi-plus-circle"
                label="Add Field"
                size="small"
                severity="secondary"
                onClick={addEmptyEmployeeLabel}
              />
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {employeeLabels.length === 0 && (
                <p className="text-[0.75rem] text-gray-600">
                  No custom fields added.
                </p>
              )}
              {employeeLabels.map((label) => (
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
                            updateEmployeeLabel(label.id, "saved", false)
                          }
                          tooltip="Edit"
                          tooltipOptions={{ position: "top" }}
                        />
                        <Button
                          icon="pi pi-trash"
                          rounded
                          severity="danger"
                          className="w-6! h-6!"
                          onClick={() => removeEmployeeLabel(label.id)}
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
                            updateEmployeeLabel(label.id, "name", e.value)
                          }
                          placeholder="Select label name"
                          className="w-full!"
                          filter
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
                            updateEmployeeLabel(label.id, "value", e.value)
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
                          onClick={() => saveEmployeeLabel(label.id)}
                          tooltip="Save"
                          tooltipOptions={{ position: "top" }}
                        />
                        <Button
                          icon="pi pi-times"
                          rounded
                          severity="secondary"
                          className="w-6! h-6!"
                          onClick={() => cancelEditEmployeeLabel(label.id)}
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

          {/* Dialog Actions */}
          <div className="dialog-actions">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={handleCancel}
              className="dialog-btn"
            />
            <Button
              label={isEditing ? "Update" : "Add"}
              severity="success"
              onClick={handleSaveEmployee}
              className="dialog-btn"
            />
          </div>
        </div>
      </Dialog>

      {/* Custom Label Definition Dialog */}
      <Dialog
        header="Add Custom Label"
        visible={customLabelDialogVisible}
        style={{ width: "95vw", maxWidth: "550px" }}
        onHide={handleCancelCustomLabel}
        draggable={false}
        resizable={false}
        blockScroll
        className="employee-dialog"
      >
        <div className="employee-dialog-content">
          {/* Label Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] font-semibold">
              Label Name <span className="text-red-500">*</span>
            </label>
            <InputText
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="e.g., Shirt Size, T-Shirt Size"
              className="w-full"
            />
          </div>

          {/* Label Values */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] font-semibold">
              Label Values <span className="text-red-500">*</span>
            </label>
            {newLabelValues.map((value, index) => (
              <div key={index} className="flex gap-2 items-center">
                <InputText
                  value={value}
                  onChange={(e) =>
                    handleLabelValueChange(index, e.target.value)
                  }
                  placeholder={`Value ${index + 1}`}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {newLabelValues.length > 1 && (
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      onClick={() => handleRemoveLabelValue(index)}
                      tooltip="Remove"
                      tooltipOptions={{ position: "top" }}
                      className="w-8! h-8! p-0! flex items-center justify-center hover:bg-red-50"
                      style={{ fontSize: "0.75rem" }}
                    />
                  )}
                  {index === newLabelValues.length - 1 && (
                    <Button
                      icon="pi pi-plus"
                      rounded
                      text
                      severity="success"
                      onClick={handleAddLabelValue}
                      tooltip="Add Value"
                      tooltipOptions={{ position: "top" }}
                      className="w-8! h-8! p-0! flex items-center justify-center hover:bg-green-50"
                      style={{ fontSize: "0.75rem" }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dialog Actions */}
          <div className="dialog-actions">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={handleCancelCustomLabel}
              className="dialog-btn"
            />
            <Button
              label="Add"
              severity="success"
              onClick={handleSaveCustomLabel}
              className="dialog-btn"
            />
          </div>
        </div>
      </Dialog>

      {/* Main Employees Screen */}
      <div className="employees-container">
        <div className="employees-header">
          <h2 className="text-2xl font-bold text-gray-800">
            Employee Management
          </h2>
          <Button
            label="Add Employee"
            icon="pi pi-plus"
            severity="success"
            onClick={handleAddEmployee}
            className="add-employee-btn"
          />
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-controls">
            <Dropdown
              value={filterField}
              options={filterOptions}
              onChange={(e) => setFilterField(e.value)}
              optionLabel="label"
              optionValue="value"
              placeholder="Select field to filter"
              className="filter-dropdown"
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
            />
            <Button
              icon="pi pi-times"
              label="Clear"
              className="p-button-outlined p-button-secondary clear-filter-btn"
              onClick={handleClearFilters}
              disabled={!filterField && !filterValue}
            />
          </div>
          <div className="filter-results">
            <span className="results-count">
              {filteredEmployees.length} of {employees.length} employee(s)
            </span>
          </div>
        </div>

        {/* Employees Grid */}
        <div className="employees-grid-wrapper">
          {filteredEmployees.length === 0 ? (
            <div className="empty-state">
              <i
                className="pi pi-users"
                style={{ fontSize: "3rem", color: "#ccc" }}
              ></i>
              <p>
                {employees.length === 0
                  ? 'No employees found. Click "Add Employee" to get started.'
                  : "No employees match the filter criteria."}
              </p>
            </div>
          ) : (
            <div className="employees-grid">
              {filteredEmployees.map((employee) =>
                renderEmployeeCard(employee)
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
