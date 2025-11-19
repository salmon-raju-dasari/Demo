import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { useState, useRef } from "react";
import { Toast } from "primereact/toast";
import api from "../services/api/axios";
import "../styles/add-product.css";
import { categoryOptions } from "../data/categoryOptions";
import { Calendar } from "primereact/calendar";

export default function AddProducts() {
  const units = [
    {
      category: "Weight",
      items: [
        { name: "Milligram", symbol: "mg", label: "Milligram (mg)" },
        { name: "Gram", symbol: "g", label: "Gram (g)" },
        { name: "Kilogram", symbol: "kg", label: "Kilogram (kg)" },
      ],
    },
    {
      category: "Volume",
      items: [
        { name: "Milliliter", symbol: "ml", label: "Milliliter (ml)" },
        { name: "Centiliter", symbol: "cl", label: "Centiliter (cl)" },
        { name: "Liter", symbol: "L", label: "Liter (L)" },
        { name: "Cubic meter", symbol: "m³", label: "Cubic meter (m³)" },
      ],
    },
    {
      category: "Size",
      items: [
        { name: "Millimeter", symbol: "mm", label: "Millimeter (mm)" },
        { name: "Centimeter", symbol: "cm", label: "Centimeter (cm)" },
        { name: "Meter", symbol: "m", label: "Meter (m)" },
      ],
    },
    {
      category: "Area",
      items: [
        { name: "Square meter", symbol: "m²", label: "Square meter (m²)" },
      ],
    },
    {
      category: "Per item",
      items: [{ name: "Item", symbol: "item", label: "Item (item)" }],
    },
  ];

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    skuSuffix: "",
    category: null,
    unit: null,
    expiryDate: "",
    mfgDate: "",
  });
  const [variants, setVariants] = useState([]);
  const [addProductLoad, setAddProductLoad] = useState(false);
  const toast = useRef(null);

  const handleChange = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, { id: Date.now(), name: "", value: "" }]);
  };

  const handleVariantChange = (id, field, value) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const handleRemoveVariant = (id) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const handleAddProduct = async () => {
    setAddProductLoad(true);
    const productData = {
      ...productForm,
      sku: `PROD-${productForm.skuSuffix}`,
    };
    delete productData.skuSuffix;
    try {
      const response = await api.post("/products/addProducts", [productData]);
      setAddProductLoad(false);
      if (response.status === 200 || response.status === 201) {
        toast.current.show({
          severity: "success",
          summary: "Product Added",
          detail: "Product added successfully!",
          life: 3000,
        });
        // Optionally reset form fields here
      } else {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to add product.",
          life: 3000,
        });
      }
    } catch {
      setAddProductLoad(false);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to add product.",
        life: 3000,
      });
    }
  };

  return (
    <>
      <Toast ref={toast} />
      {/* <div className="w-full sm:w-[30%]! grid! grid-cols-2 gap-3 sm:flex! sm:flex-col sm:gap-3 sm:justify-between">
          <Button
            loading={addProductLoad}
            label="Add Product"
            className="w-full text-[0.8rem]!"
            onClick={handleAddProduct}
          />
          <Button
            loading={addProductLoad}
            label="Add Bulk Products"
            className="w-full text-[0.8rem]!"
            onClick={handleAddProduct}
          />
          <Button
            loading={addProductLoad}
            label="Update Products"
            className="w-full text-[0.8rem]!"
            onClick={handleAddProduct}
          />
          <Button
            loading={addProductLoad}
            label="Delete Products"
            className="w-full text-[0.8rem]!"
            onClick={handleAddProduct}
          />
        </div> */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center w-full justify-between ">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Product Name
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Description
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Quantity
          </label>
          <InputText
            className="p-inputtext-sm w-full p-[5px]!"
            value={productForm.quantity}
            onChange={(e) => handleChange("quantity", e.target.value)}
          />
        </div>
        <div className="flex items-center w-full justify-between">
          <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
            Category
          </label>
          <Dropdown
            className="w-full"
            value={productForm.category}
            options={categoryOptions}
            onChange={(e) => handleChange("category", e.value)}
            placeholder="Select a Category"
            filter
          />
        </div>
      </div>
      <div className="flex items-center w-full justify-between mt-3">
        <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
          Price
        </label>
        <div className="flex flex-wrap flex-col md:flex-row gap-2 w-full">
          <InputText
            className="p-inputtext-sm w-full flex-1 p-[5px]!"
            value={productForm.price}
            placeholder="0.00"
            onChange={(e) => handleChange("price", e.target.value)}
          />
          <Dropdown
            className="flex-1 flex-wrap w-full"
            value={productForm.unit}
            options={units}
            optionLabel="label"
            optionValue="symbol"
            optionGroupLabel="category"
            optionGroupChildren="items"
            onChange={(e) => handleChange("unit", e.value)}
            placeholder="Select Unit"
            filter
          />
        </div>
      </div>
      <div className="flex items-center w-full mt-3">
        <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
          MFG Date
        </label>
        <Calendar
          value={productForm.mfgDate}
          onChange={(e) => handleChange("mfgDate", e.value)}
          className="w-full!"
          touchUI
        />
      </div>
      <div className="flex items-center w-full justify-between mt-3">
        <label className="label-add-product text-[0.8rem] min-w-[120px] font-bold">
          Expiry Date
        </label>
        <Calendar
          value={productForm.expiryDate}
          onChange={(e) => handleChange("expiryDate", e.value)}
          className="w-full!"
          touchUI
        />
      </div>
      <div className="mt-3">
        <div className="bg-white shadow-sm p-3">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[0.8rem] font-bold">Custom Labels</span>
            <Button
              icon="pi pi-plus-circle"
              rounded
              severity="secondary"
              onClick={handleAddVariant}
              className="w-6! h-6!"
              tooltip="Add Label"
              tooltipOptions={{ position: "top" }}
            />
          </div>
          <div className="space-y-2">
            {variants.length === 0 && (
              <p className="text-[0.65rem] text-gray-500 italic">
                No variants added.
              </p>
            )}
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="grid! grid-cols-[1fr_auto] items-center gap-2 mt-3 md:grid-cols-[1fr_1fr_auto] p-3 rounded bg-blue-100"
              >
                <InputText
                  className="p-[5px]! col-start-1 md:col-start-1 w-full"
                  value={variant.name}
                  onChange={(e) =>
                    handleVariantChange(variant.id, "name", e.target.value)
                  }
                  placeholder="Label Name"
                />
                <InputText
                  className="p-[5px]! col-start-1 md:col-start-2 w-full"
                  value={variant.value}
                  onChange={(e) =>
                    handleVariantChange(variant.id, "value", e.target.value)
                  }
                  placeholder="Label Value"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  severity="danger"
                  onClick={() => handleRemoveVariant(variant.id)}
                  className="w-6! h-6! col-start-2 row-start-1 row-span-2 self-center justify-self-end md:col-start-3 xs:col-start-2 md:row-start-1 md:row-span-1"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
