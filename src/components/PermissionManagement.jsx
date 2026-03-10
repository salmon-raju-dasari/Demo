import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import api from "../services/api/axios";
import "./PermissionManagement.css";

const PermissionManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const toast = useRef(null);

  // ── Fetch ──────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get("/roles/");
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch roles error:", err);
      notify("Failed to fetch roles", "error");
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await api.get("/permissions/");
      setPermissions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch permissions error:", err);
      notify("Failed to fetch permissions", "error");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRoles(), fetchPermissions()]).finally(() =>
      setLoading(false),
    );
  }, [fetchRoles, fetchPermissions]);

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

  // ── Permission Modal ────────────────────────────────────
  const openPermissionModal = async (role) => {
    setSelectedRole(role);
    try {
      const res = await api.get(`/permissions/role/${role.id}`);
      const roleData = res.data;
      setSelectedPermissions(
        roleData.permissions ? roleData.permissions.map((p) => p.id) : [],
      );
    } catch (err) {
      console.error("Fetch role permissions error:", err);
      notify("Failed to fetch role permissions", "error");
      setSelectedPermissions([]);
    }
    setShowPermissionModal(true);
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId],
    );
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    try {
      await api.post(
        `/permissions/role/${selectedRole.id}/assign-permissions`,
        {
          permission_ids: selectedPermissions,
        },
      );
      notify("Permissions assigned successfully");
      setShowPermissionModal(false);
      fetchRoles();
      fetchPermissions();
    } catch (err) {
      notify(
        err.response?.data?.detail || "Failed to assign permissions",
        "error",
      );
    }
  };

  // ── Searches & Filters ──────────────────────────────────
  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(roleFilter.toLowerCase()),
  );

  return (
    <div className="pm-container">
      <Toast ref={toast} />

      {/* ═══════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════ */}
      <div className="pm-header">
        <h1>Role Permissions</h1>
      </div>

      {/* ═══════════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════════ */}
      <div className="pm-content">
        {/* ═══════════════════════════════════════════════
            SECTION 1 — ROLES
        ═══════════════════════════════════════════════ */}
        <section className="pm-card">
          <div className="pm-card-head">
            <h2>Roles</h2>
          </div>

          <div className="pm-card-search">
            <span className="p-input-icon-left pm-search-wrap">
              <i className="pi pi-search" />
              <InputText
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                placeholder="Search roles…"
                className="pm-search"
              />
            </span>
          </div>

          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Role Name</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="pm-center">
                      Loading…
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="pm-center pm-muted">
                      No roles found
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role, idx) => (
                    <tr
                      key={role.id}
                      className={
                        selectedRole?.id === role.id ? "pm-selected" : ""
                      }
                      onClick={() => setSelectedRole(role)}
                    >
                      <td className="pm-muted">{idx + 1}</td>
                      <td className="pm-capitalize">{role.role_name}</td>
                      <td>
                        <Button
                          icon="pi pi-lock"
                          rounded
                          text
                          className="p-button-sm"
                          tooltip="Configure permissions"
                          tooltipOptions={{ position: "left" }}
                          onClick={() => openPermissionModal(role)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            SECTION 2 — ROLE DETAILS
        ═══════════════════════════════════════════════ */}
        <section className="pm-card">
          <div className="pm-card-head">
            <h2>
              {selectedRole
                ? `${selectedRole.role_name} - Permissions`
                : "Select a role"}
            </h2>
          </div>

          {selectedRole ? (
            <div className="pm-details">
              <div className="pm-permissions-list">
                {permissions.length === 0 ? (
                  <p className="pm-muted">No permissions available</p>
                ) : (
                  permissions.map((perm) => (
                    <div key={perm.id} className="pm-permission-item">
                      <input
                        type="checkbox"
                        id={`perm-${perm.id}`}
                        checked={selectedRole.permissions?.some(
                          (p) => p.id === perm.id,
                        )}
                        onChange={() => {
                          // Update selectedRole's permissions for display
                          setSelectedRole((prev) => ({
                            ...prev,
                            permissions: prev.permissions?.some(
                              (p) => p.id === perm.id,
                            )
                              ? prev.permissions.filter((p) => p.id !== perm.id)
                              : [...(prev.permissions || []), perm],
                          }));
                        }}
                        disabled
                      />
                      <label htmlFor={`perm-${perm.id}`}>
                        <span className="pm-perm-name">
                          {perm.permission_name}
                        </span>
                        {perm.description && (
                          <span className="pm-perm-desc">
                            {perm.description}
                          </span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <div className="pm-details-actions">
                <Button
                  label="Configure Permissions"
                  icon="pi pi-pencil"
                  onClick={() => openPermissionModal(selectedRole)}
                  className="p-button-sm"
                />
              </div>
            </div>
          ) : (
            <div className="pm-empty-state">
              <p className="pm-muted">
                Select a role to view and manage its permissions
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ═══════════════════════════════════════════════
          PERMISSION MODAL
      ═══════════════════════════════════════════════ */}
      <Dialog
        visible={showPermissionModal}
        onHide={() => setShowPermissionModal(false)}
        header={`Permissions for ${selectedRole?.role_name || ""}`}
        modal
        className="pm-modal"
        contentStyle={{ maxHeight: "85vh", overflow: "hidden" }}
      >
        <div className="pm-modal-content">
          <div className="pm-modal-body">
            {permissions.map((perm) => (
              <div key={perm.id} className="pm-checkbox-item">
                <input
                  type="checkbox"
                  id={`modal-perm-${perm.id}`}
                  checked={selectedPermissions.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                />
                <label htmlFor={`modal-perm-${perm.id}`}>
                  <span className="pm-perm-name">{perm.permission_name}</span>
                  {perm.description && (
                    <span className="pm-perm-desc">{perm.description}</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="pm-modal-footer">
          <Button
            label="Cancel"
            icon="pi pi-times"
            onClick={() => setShowPermissionModal(false)}
            className="p-button-text"
          />
          <Button
            label="Save"
            icon="pi pi-check"
            onClick={savePermissions}
            className="p-button-success"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PermissionManagement;
