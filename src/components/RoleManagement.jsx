import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import api from "../services/api/axios";
import "./RoleManagement.css";

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRowEmployee, setSelectedRowEmployee] = useState(null);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [newRolePermissions, setNewRolePermissions] = useState([]);
  const [permissionFilter, setPermissionFilter] = useState("");
  const toast = useRef(null);

  // ── Fetch ──────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get("/roles/");
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch roles error:", err);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get("/employees/?limit=500");
      const data = res.data?.items ?? (Array.isArray(res.data) ? res.data : []);
      setEmployees(data);
    } catch (err) {
      console.error("Fetch employees error:", err);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await api.get("/permissions/");
      setPermissions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch permissions error:", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRoles(), fetchEmployees(), fetchPermissions()]).finally(
      () => setLoading(false),
    );
  }, [fetchRoles, fetchEmployees, fetchPermissions]);

  // ── Helpers ────────────────────────────────────────────
  const notify = (detail, severity = "success") => {
    toast.current?.show({
      severity,
      summary:
        severity === "error"
          ? "Error"
          : severity === "warn"
            ? "Warning"
            : "Success",
      detail,
      life: 3000,
    });
  };

  // ── Role CRUD ──────────────────────────────────────────
  const createRole = async () => {
    const name = newRoleName.trim();
    if (!name) return notify("Enter a role name", "warn");
    try {
      const res = await api.post("/roles/", { role_name: name });
      const newRole = res.data;

      // Assign permissions if any are selected
      if (newRolePermissions.length > 0) {
        await api.post(`/permissions/role/${newRole.id}/assign-permissions`, {
          permission_ids: newRolePermissions,
        });
      }

      setNewRoleName("");
      setNewRolePermissions([]);
      setShowCreateRoleModal(false);
      notify("Role created successfully");
      fetchRoles();
    } catch (err) {
      notify(err.response?.data?.detail || "Failed to create role", "error");
    }
  };

  const toggleNewRolePermission = (permissionId) => {
    setNewRolePermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId],
    );
  };

  const deleteRole = async (id, name) => {
    if (name.toLowerCase() === "owner")
      return notify("Owner role cannot be deleted", "warn");
    if (!window.confirm(`Delete the "${name}" role?`)) return;
    try {
      await api.delete(`/roles/${id}`);
      notify("Role deleted");
      fetchRoles();
      fetchEmployees();
    } catch (err) {
      notify(err.response?.data?.detail || "Failed to delete role", "error");
    }
  };

  // ── Assign / Unassign ─────────────────────────────────
  const toggleRole = (roleName) => {
    setAssignedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName],
    );
  };

  const saveRoleAssignments = async () => {
    if (!selectedEmployee) return;
    try {
      // Get role IDs for the selected roles
      const roleMap = {};
      roles.forEach((role) => {
        roleMap[role.role_name] = role.id;
      });

      const roleIds = assignedRoles
        .map((roleName) => roleMap[roleName])
        .filter((id) => id !== undefined);

      // Call the batch endpoint to assign all roles at once
      await api.post(`/roles/${selectedEmployee.emp_id}/assign-roles`, {
        role_ids: roleIds,
      });

      notify("Roles updated successfully");
      fetchEmployees();
      setShowAssignModal(false);
      setAssignedRoles([]);
    } catch (err) {
      notify(err.response?.data?.detail || "Failed to update roles", "error");
    }
  };

  const openAssignModal = (emp) => {
    setSelectedEmployee(emp);
    // Parse current roles (handle both array and comma-separated string formats)
    let currentRoles = [];
    if (Array.isArray(emp.role_names)) {
      currentRoles = emp.role_names;
    } else if (emp.role_names && typeof emp.role_names === "string") {
      currentRoles = emp.role_names.split(",").map((r) => r.trim());
    }
    setAssignedRoles(currentRoles);
    setShowAssignModal(true);
  };

  // ── Edit Role ─────────────────────────────────────────
  const openEditRoleModal = async (role) => {
    if (role.role_name.toLowerCase() === "owner") {
      notify("Owner role cannot be edited", "warn");
      return;
    }
    setEditingRole(role);
    setEditRoleName(role.role_name);

    // Fetch role permissions
    try {
      const res = await api.get(`/permissions/role/${role.id}`);
      setSelectedPermissions(
        res.data.permissions ? res.data.permissions.map((p) => p.id) : [],
      );
    } catch (err) {
      notify("Failed to fetch permissions", "error");
      setSelectedPermissions([]);
    }

    setShowEditRoleModal(true);
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId],
    );
  };

  const saveRoleChanges = async () => {
    if (!editingRole) return;
    if (editingRole.role_name.toLowerCase() === "owner") {
      notify("Owner role cannot be edited", "warn");
      return;
    }
    const roleName = editRoleName.trim();
    if (!roleName) {
      notify("Enter a role name", "warn");
      return;
    }

    try {
      // Update role name
      await api.put(`/roles/${editingRole.id}`, { role_name: roleName });

      // Update permissions
      if (permissions.length > 0) {
        await api.post(
          `/permissions/role/${editingRole.id}/assign-permissions`,
          {
            permission_ids: selectedPermissions,
          },
        );
      }

      notify("Role updated successfully");
      setShowEditRoleModal(false);
      fetchRoles();
    } catch (err) {
      notify(err.response?.data?.detail || "Failed to update role", "error");
    }
  };

  // ── Filters ────────────────────────────────────────────
  const filteredRoles = roles.filter((r) =>
    r.role_name.toLowerCase().includes(roleFilter.toLowerCase()),
  );

  const filteredEmployees = (Array.isArray(employees) ? employees : []).filter(
    (emp) => {
      if (!employeeFilter.trim()) return true;
      const term = employeeFilter.toLowerCase();
      const empName = (
        emp.name || `${emp.first_name || ""} ${emp.last_name || ""}`
      ).toLowerCase();

      // Handle both single role_name and multiple role_names
      let roleSearchText = "";
      if (Array.isArray(emp.role_names)) {
        roleSearchText = emp.role_names.join(" ").toLowerCase();
      } else if (emp.role_names && typeof emp.role_names === "string") {
        roleSearchText = emp.role_names.toLowerCase();
      } else if (emp.role_name) {
        roleSearchText = emp.role_name.toLowerCase();
      }

      return (
        empName.includes(term) ||
        (emp.email && emp.email.toLowerCase().includes(term)) ||
        roleSearchText.includes(term)
      );
    },
  );

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="rm-container">
      <Toast ref={toast} />

      {/* ── Page Header ───────────────────────────────── */}
      <header className="rm-header">
        <h1>Role Management</h1>
      </header>

      <div className="rm-content">
        {/* ═══════════════════════════════════════════════
            SECTION 1 — ROLES
        ═══════════════════════════════════════════════ */}
        <section className="rm-card">
          <div className="rm-card-head">
            <h2>Roles</h2>
            <div className="rm-card-actions">
              <Button
                icon="pi pi-plus"
                rounded
                className="p-button-sm p-button-success"
                tooltip="Add Role"
                tooltipOptions={{ position: "left" }}
                onClick={() => setShowCreateRoleModal(true)}
              />
            </div>
          </div>

          <div className="rm-card-search">
            <span className="p-input-icon-left rm-search-wrap">
              <i className="pi pi-search" />
              <InputText
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                placeholder="Search roles…"
                className="rm-search"
              />
            </span>
          </div>

          <div className="rm-table-wrap">
            <table className="rm-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Role Name</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="rm-center">
                      Loading…
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="rm-center rm-muted">
                      No roles found
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role, idx) => (
                    <tr
                      key={role.id}
                      className={
                        selectedRole?.id === role.id ? "rm-selected" : ""
                      }
                      onClick={() => setSelectedRole(role)}
                    >
                      <td className="rm-muted">{idx + 1}</td>
                      <td className="rm-capitalize">{role.role_name}</td>
                      <td>
                        {role.role_name.toLowerCase() !== "owner" && (
                          <>
                            <Button
                              icon="pi pi-pencil"
                              rounded
                              text
                              className="p-button-sm"
                              tooltip="Edit"
                              tooltipOptions={{ position: "left" }}
                              onClick={() => openEditRoleModal(role)}
                            />
                            <Button
                              icon="pi pi-trash"
                              rounded
                              text
                              severity="danger"
                              className="p-button-sm"
                              tooltip="Delete"
                              tooltipOptions={{ position: "left" }}
                              onClick={() =>
                                deleteRole(role.id, role.role_name)
                              }
                            />
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            SECTION 2 — EMPLOYEES
        ═══════════════════════════════════════════════ */}
        <section className="rm-card">
          <div className="rm-card-head">
            <h2>Employees &amp; Roles</h2>
          </div>

          <div className="rm-card-search">
            <span className="p-input-icon-left rm-search-wrap">
              <i className="pi pi-search" />
              <InputText
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                placeholder="Search employees…"
                className="rm-search"
              />
            </span>
          </div>

          <div className="rm-table-wrap">
            <table className="rm-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="rm-center">
                      Loading…
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="rm-center rm-muted">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, idx) => {
                    const empName =
                      emp.name ||
                      `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
                      "N/A";
                    // Handle both single role_name and multiple role_names
                    let roleNames = [];
                    if (Array.isArray(emp.role_names)) {
                      roleNames = emp.role_names;
                    } else if (
                      emp.role_names &&
                      typeof emp.role_names === "string"
                    ) {
                      roleNames = emp.role_names
                        .split(",")
                        .map((r) => r.trim());
                    } else if (emp.role_name && emp.role_name !== "—") {
                      roleNames = [emp.role_name];
                    }

                    return (
                      <tr
                        key={emp.emp_id}
                        className={
                          selectedRowEmployee?.emp_id === emp.emp_id
                            ? "rm-selected"
                            : ""
                        }
                        onClick={() => setSelectedRowEmployee(emp)}
                      >
                        <td className="rm-muted">{idx + 1}</td>
                        <td>{empName}</td>
                        <td className="rm-muted">{emp.email || "N/A"}</td>
                        <td>
                          {roleNames.length > 0 ? (
                            <div className="rm-role-badges">
                              {roleNames.map((role) => (
                                <span
                                  key={role}
                                  className={`rm-badge rm-badge--${role.toLowerCase().replace(/\s+/g, "_")}`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="rm-muted">No role</span>
                          )}
                        </td>
                        <td>
                          <Button
                            icon="pi pi-pencil"
                            rounded
                            text
                            severity="info"
                            className="p-button-sm"
                            tooltip="Manage Roles"
                            tooltipOptions={{ position: "left" }}
                            onClick={() => openAssignModal(emp)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL — Create Role
      ═══════════════════════════════════════════════════ */}
      {showCreateRoleModal && (
        <div
          className="rm-overlay"
          onClick={() => setShowCreateRoleModal(false)}
        >
          <div
            className="rm-modal rm-modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rm-modal-head">
              <h3>Create Role</h3>
              <button
                className="rm-close"
                onClick={() => setShowCreateRoleModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="rm-modal-body">
              <div style={{ marginBottom: "20px" }}>
                <label className="rm-label">Role Name</label>
                <InputText
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createRole()}
                  placeholder="e.g. Manager"
                  autoFocus
                  className="rm-input"
                />
              </div>
              <div>
                <label className="rm-label">Assign Permissions</label>
                {permissions.length === 0 ? (
                  <p className="rm-muted">No permissions available</p>
                ) : (
                  <ul className="rm-role-list">
                    {permissions.map((perm) => {
                      const isSelected = newRolePermissions.includes(perm.id);
                      return (
                        <li
                          key={perm.id}
                          className={`rm-role-item ${isSelected ? "rm-role-item--active" : ""}`}
                        >
                          <div className="rm-role-item-left">
                            <input
                              type="checkbox"
                              className="rm-checkbox"
                              checked={isSelected}
                              onChange={() => toggleNewRolePermission(perm.id)}
                              id={`create-perm-${perm.id}`}
                            />
                            <label
                              className="rm-role-item-name"
                              htmlFor={`create-perm-${perm.id}`}
                              style={{ marginBottom: 0 }}
                            >
                              {perm.permission_name}
                              {perm.description && (
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#a0aec0",
                                    marginTop: "4px",
                                  }}
                                >
                                  {perm.description}
                                </div>
                              )}
                            </label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div className="rm-modal-foot">
              <Button
                label="Cancel"
                className="p-button-text p-button-secondary p-button-sm"
                onClick={() => {
                  setShowCreateRoleModal(false);
                  setNewRoleName("");
                  setNewRolePermissions([]);
                }}
              />
              <Button
                label="Create"
                icon="pi pi-check"
                className="p-button-sm p-button-success"
                onClick={createRole}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL — Assign / Remove Role
      ═══════════════════════════════════════════════════ */}
      {showAssignModal && selectedEmployee && (
        <div className="rm-overlay" onClick={() => setShowAssignModal(false)}>
          <div
            className="rm-modal rm-modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rm-modal-head">
              <h3>
                Manage Role &mdash;{" "}
                <span className="rm-modal-empname">
                  {selectedEmployee.name ||
                    `${selectedEmployee.first_name || ""} ${selectedEmployee.last_name || ""}`.trim()}
                </span>
              </h3>
              <button
                className="rm-close"
                onClick={() => setShowAssignModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="rm-modal-body">
              <div className="rm-emp-info">
                <span>
                  <strong>Email:</strong> {selectedEmployee.email || "N/A"}
                </span>
              </div>

              <label className="rm-label" style={{ marginTop: 16 }}>
                Assigned Roles
              </label>
              <ul className="rm-role-list">
                {roles.map((role) => {
                  const isAssigned = assignedRoles.includes(role.role_name);
                  return (
                    <li
                      key={role.id}
                      className={`rm-role-item ${isAssigned ? "rm-role-item--active" : ""}`}
                    >
                      <div className="rm-role-item-left">
                        <input
                          type="checkbox"
                          id={`role-${role.id}`}
                          checked={isAssigned}
                          onChange={() => toggleRole(role.role_name)}
                          className="rm-checkbox"
                        />
                        <label
                          htmlFor={`role-${role.id}`}
                          className="rm-role-item-name"
                        >
                          {role.role_name}
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rm-modal-foot">
              <Button
                label="Cancel"
                className="p-button-text p-button-secondary p-button-sm"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignedRoles([]);
                }}
              />
              <Button
                label="Save Roles"
                icon="pi pi-check"
                className="p-button-sm p-button-success"
                onClick={saveRoleAssignments}
              />
            </div>
          </div>
        </div>
      )}

      {showEditRoleModal && editingRole && (
        <div
          className="rm-overlay"
          onClick={() => {
            setShowEditRoleModal(false);
            setPermissionFilter("");
          }}
        >
          <div
            className="rm-modal rm-modal--wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rm-modal-head">
              <h3>Edit Role - {editingRole.role_name}</h3>
              <button
                className="rm-close"
                onClick={() => {
                  setShowEditRoleModal(false);
                  setPermissionFilter("");
                }}
              >
                ×
              </button>
            </div>
            <div className="rm-modal-body">
              <div style={{ marginBottom: "20px" }}>
                <label className="rm-label">Role Name</label>
                <InputText
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className="rm-input"
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="rm-label">Permissions</label>
                <span
                  className="p-input-icon-left rm-search-wrap"
                  style={{ marginBottom: "10px", display: "block" }}
                >
                  <i className="pi pi-search" />
                  <InputText
                    value={permissionFilter}
                    onChange={(e) => setPermissionFilter(e.target.value)}
                    placeholder="Search permissions…"
                    className="rm-search"
                  />
                </span>
                {permissions.length === 0 ? (
                  <p className="rm-muted">No permissions available</p>
                ) : (
                  <ul className="rm-role-list">
                    {permissions
                      .filter((p) =>
                        p.permission_name
                          .toLowerCase()
                          .includes(permissionFilter.toLowerCase()),
                      )
                      .map((perm) => {
                        const isSelected = selectedPermissions.includes(
                          perm.id,
                        );
                        return (
                          <li
                            key={perm.id}
                            className={`rm-role-item ${isSelected ? "rm-role-item--active" : ""}`}
                          >
                            <div className="rm-role-item-left">
                              <input
                                type="checkbox"
                                className="rm-checkbox"
                                checked={isSelected}
                                onChange={() => togglePermission(perm.id)}
                                id={`perm-${perm.id}`}
                              />
                              <label
                                className="rm-role-item-name"
                                htmlFor={`perm-${perm.id}`}
                                style={{ marginBottom: 0 }}
                              >
                                {perm.permission_name}
                                {perm.description && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#a0aec0",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {perm.description}
                                  </div>
                                )}
                              </label>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                )}
              </div>
            </div>
            <div className="rm-modal-foot">
              <Button
                label="Cancel"
                className="p-button-text p-button-secondary p-button-sm"
                onClick={() => {
                  setShowEditRoleModal(false);
                  setPermissionFilter("");
                }}
              />
              <Button
                label="Save Changes"
                icon="pi pi-check"
                className="p-button-sm p-button-success"
                onClick={saveRoleChanges}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
