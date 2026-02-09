import { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/api/categoryService";
import "../styles/category-management.css";

export default function CategoryManagement({ onCategoryAdded }) {
  // Form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // Categories state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  // UI state
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const toast = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    if (!hasLoaded) {
      loadCategories();
      setHasLoaded(true);
    }
  }, [hasLoaded]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetchCategories();
      // Convert from service format to display format
      const formattedCategories = response.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || "",
      }));
      setCategories(formattedCategories);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Failed to Load Categories",
        detail: error.message || "Could not fetch categories",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    // Validation
    if (!categoryName.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Category name is required",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const newCategory = await createCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim(),
      });

      setCategories([
        ...categories,
        {
          id: newCategory.id,
          name: newCategory.name,
          description: newCategory.description || "",
        },
      ]);

      // Reset form
      setCategoryName("");
      setCategoryDescription("");

      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: `Category "${newCategory.name}" created successfully`,
        life: 3000,
      });

      // Call callback if provided (for popup mode)
      if (onCategoryAdded) {
        onCategoryAdded(newCategory);
      }
    } catch (error) {
      const errorMessage =
        error.details?.message || error.message || "Failed to create category";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingDescription(category.description);
    // Don't show toast when just clicking edit
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const handleEditSave = async (categoryId) => {
    if (!editingName.trim()) {
      toast.current?.show({
        severity: "warn",
        summary: "Validation Error",
        detail: "Category name is required",
        life: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const updated = await updateCategory(categoryId, {
        name: editingName.trim(),
        description: editingDescription.trim(),
      });

      setCategories(
        categories.map((cat) =>
          cat.id === categoryId
            ? {
                ...cat,
                name: updated.name,
                description: updated.description || "",
              }
            : cat,
        ),
      );

      setEditingId(null);
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: `Category updated successfully`,
        life: 3000,
      });
    } catch (error) {
      const errorMessage =
        error.details?.message || error.message || "Failed to update category";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = (category) => {
    confirmDialog({
      message: `Are you sure you want to delete "${category.name}"?`,
      header: "Confirm Delete",
      icon: "pi pi-exclamation-triangle",
      accept: () => handleDeleteCategory(category.id),
      reject: () => {},
      acceptClassName: "p-button-danger",
    });
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setLoading(true);
      await deleteCategory(categoryId);

      setCategories(categories.filter((cat) => cat.id !== categoryId));

      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Category deleted successfully",
        life: 3000,
      });
    } catch (error) {
      const errorMessage =
        error.details?.message || error.message || "Failed to delete category";
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: errorMessage,
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="category-management-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="category-page-header">
        <h2>Category Management</h2>
        <p className="subtitle">Manage your product categories</p>
      </div>

      {/* Add Category Section */}
      <div className="category-form-section">
        <h3>Add New Category</h3>
        <form onSubmit={handleAddCategory} className="category-form">
          <div className="form-group">
            <label htmlFor="categoryName">Category Name *</label>
            <InputText
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="categoryDesc">Description (Optional)</label>
            <InputText
              id="categoryDesc"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              placeholder="Enter category description"
              disabled={loading}
              className="form-input"
            />
          </div>

          <Button
            type="submit"
            label="Add Category"
            icon="pi pi-plus"
            loading={loading}
            disabled={loading}
            className="btn-add-category"
          />
        </form>
      </div>

      {/* Categories Grid Section */}
      <div className="category-grid-section">
        <div className="grid-section-header">
          <h3>Categories List</h3>
          {categories.length > 0 && (
            <div className="search-container">
              <i className="pi pi-search search-icon"></i>
              <InputText
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search categories..."
                className="search-input"
              />
            </div>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="empty-state">
            <p>No categories yet. Add your first category!</p>
          </div>
        ) : (
          <div className="category-grid">
            <div className="grid-header">
              <div className="grid-col-name">Category Name</div>
              <div className="grid-col-actions">Actions</div>
            </div>

            <div className="grid-body">
              {categories
                .filter((cat) =>
                  cat.name.toLowerCase().includes(searchFilter.toLowerCase()),
                )
                .map((category) => (
                  <div key={category.id} className="grid-row">
                    <div className="grid-col-name">
                      {editingId === category.id ? (
                        <div className="edit-field">
                          <InputText
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            placeholder="Category name"
                            className="edit-input"
                          />
                        </div>
                      ) : (
                        <span className="category-name">{category.name}</span>
                      )}
                    </div>

                    <div className="grid-col-actions">
                      {editingId === category.id ? (
                        <div className="action-buttons">
                          <Button
                            icon="pi pi-check"
                            rounded
                            text
                            severity="success"
                            onClick={() => handleEditSave(category.id)}
                            tooltip="Save"
                            disabled={loading}
                            className="btn-action btn-save"
                          />
                          <Button
                            icon="pi pi-times"
                            rounded
                            text
                            severity="secondary"
                            onClick={handleEditCancel}
                            tooltip="Cancel"
                            disabled={loading}
                            className="btn-action btn-cancel"
                          />
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <Button
                            icon="pi pi-pencil"
                            rounded
                            text
                            severity="info"
                            onClick={() => handleEditStart(category)}
                            tooltip="Edit"
                            disabled={loading}
                            className="btn-action btn-edit"
                          />
                          <Button
                            icon="pi pi-trash"
                            rounded
                            text
                            severity="danger"
                            onClick={() => handleDeleteConfirm(category)}
                            tooltip="Delete"
                            disabled={loading}
                            className="btn-action btn-delete"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {categories.filter((cat) =>
                cat.name.toLowerCase().includes(searchFilter.toLowerCase()),
              ).length === 0 &&
                searchFilter && (
                  <div className="no-results">
                    <p>No categories match "{searchFilter}"</p>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
