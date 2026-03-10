import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Dropdown } from "primereact/dropdown";
import { confirmDialog } from "primereact/confirmdialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import "./SalesScreen.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const SalesScreen = () => {
  // Initialize state from localStorage before rendering
  const getInitialCart = () => {
    try {
      const saved = localStorage.getItem("salesCart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading cart:", e);
      return [];
    }
  };

  const getInitialCustomer = () => {
    try {
      const saved = localStorage.getItem("salesCustomer");
      return saved ? JSON.parse(saved) : { name: "", phone: "", email: "" };
    } catch (e) {
      console.error("Error loading customer:", e);
      return { name: "", phone: "", email: "" };
    }
  };

  const getInitialPaymentMethod = () => {
    return localStorage.getItem("salesPaymentMethod") || "cash";
  };

  const getInitialAmountPaid = () => {
    return localStorage.getItem("salesAmountPaid") || "";
  };

  const getInitialStore = () => {
    return null;
  };

  const [searchType, setSearchType] = useState("barcode");
  const [searchValue, setSearchValue] = useState("");
  const [cartItems, setCartItems] = useState(() => getInitialCart());
  const [customer, setCustomer] = useState(() => getInitialCustomer());
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(() =>
    getInitialPaymentMethod(),
  );
  const [amountPaid, setAmountPaid] = useState(() => getInitialAmountPaid());
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(() => getInitialStore());
  const [expandCustomerDetails, setExpandCustomerDetails] = useState(false);

  const searchInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Focus on search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Fetch stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${API_BASE_URL}/stores/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Handle both array and object responses
        const storesList = response.data?.items || response.data || [];
        const storesArray = Array.isArray(storesList) ? storesList : [];

        if (storesArray.length > 0) {
          setStores(storesArray);

          // Restore selected store from localStorage if it exists
          const savedStoreId = localStorage.getItem("salesSelectedStore");
          if (savedStoreId) {
            const foundStore = storesArray.find(
              (store) => store.id.toString() === savedStoreId.toString(),
            );
            if (foundStore) {
              setSelectedStore(foundStore);
            } else {
              // Clear if store no longer exists
              localStorage.removeItem("salesSelectedStore");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        setStores([]);
      }
    };
    fetchStores();
  }, []);

  // Persist cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("salesCart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Persist customer to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("salesCustomer", JSON.stringify(customer));
  }, [customer]);

  // Persist payment method to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("salesPaymentMethod", paymentMethod);
  }, [paymentMethod]);

  // Persist amount paid to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("salesAmountPaid", amountPaid);
  }, [amountPaid]);

  // Persist selected store ID to localStorage whenever it changes
  useEffect(() => {
    if (selectedStore && selectedStore.id) {
      localStorage.setItem("salesSelectedStore", selectedStore.id.toString());
    }
  }, [selectedStore]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  // Fetch sub-units for a base unit
  const fetchSubUnitsForProduct = async (baseUnitCode, token) => {
    try {
      const baseUnitsResponse = await axios.get(
        `${API_BASE_URL}/units/base-units`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Find the base unit that matches this product's unit
      const matchingBaseUnit = baseUnitsResponse.data.find(
        (bu) => bu.code === baseUnitCode,
      );

      if (matchingBaseUnit && matchingBaseUnit.sub_units) {
        return matchingBaseUnit.sub_units;
      }
      return [];
    } catch (err) {
      console.error("Error fetching sub-units:", err);
      return [];
    }
  };

  const handleSearchProduct = async (e) => {
    e?.preventDefault();
    if (!searchValue.trim()) {
      showNotification("Please enter a search value", "error");
      return;
    }

    // Store selection is required to search products
    if (!selectedStore) {
      showNotification("Please select a store first", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const lookup = {};

      if (searchType === "barcode") lookup.barcode = searchValue;
      else if (searchType === "productid") lookup.product_id = searchValue;
      else if (searchType === "sku") lookup.sku = searchValue;

      // Always include store_id from selected store
      lookup.store_id = selectedStore.id;

      console.log("Searching for product:", {
        searchType,
        searchValue,
        storeId: selectedStore.id,
        storeName: selectedStore.store_name,
        lookup,
      });

      const response = await axios.post(
        `${API_BASE_URL}/sales/product-lookup`,
        lookup,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Product found:", response.data);
      const product = response.data;

      // Validate product has stock in selected store
      const storeStock = product.current_quantity || product.quantity || 0;
      if (parseFloat(storeStock) <= 0) {
        showNotification(
          `This product is out of stock in ${selectedStore.store_name}`,
          "error",
        );
        setSearchValue("");
        return;
      }

      // Check if product already in cart
      const itemsToSearch = Array.isArray(cartItems) ? cartItems : [];
      const existingIndex = itemsToSearch.findIndex(
        (item) => item.id === product.id,
      );

      if (existingIndex !== -1) {
        // Increase quantity
        const newCart = [...itemsToSearch];
        const newQty = newCart[existingIndex].quantity + 1;
        const available =
          newCart[existingIndex].available ||
          product.current_quantity ||
          product.quantity;
        const conversionValue =
          newCart[existingIndex].selectedUnitConversionValue || 1;
        const availableInSelectedUnit = available * conversionValue;

        if (newQty <= availableInSelectedUnit) {
          newCart[existingIndex].quantity = newQty;
          setCartItems(newCart);
        } else {
          showNotification(
            `Stock quantity is ${availableInSelectedUnit} ${newCart[existingIndex].selectedUnit} only`,
            "error",
          );
        }
      } else {
        // Add new item
        // Calculate price per full unit if unitvalue exists
        const pricePerFullUnit =
          product.unitvalue && product.unitvalue > 0
            ? parseFloat(product.price) / parseFloat(product.unitvalue)
            : parseFloat(product.price);

        // Fetch sub-units for this product's base unit
        const subUnits = await fetchSubUnitsForProduct(product.unit, token);

        // Create base unit option (conversion_value = 1 for base unit)
        const baseUnitOption = {
          code: product.unit,
          sub_unit_name: product.unit,
          conversion_value: 1,
          isBaseUnit: true,
        };

        const allUnitsOptions = [baseUnitOption, ...subUnits];

        setCartItems([
          ...itemsToSearch,
          {
            id: product.id,
            productid: product.productid,
            barcode: product.barcode,
            sku: product.sku,
            name: product.productname,
            price: pricePerFullUnit, // Store normalized price per full unit
            quantity: 1,
            discount: product.discount || 0,
            tax: product.gst || 0,
            available: product.current_quantity || product.quantity,
            unit: product.unit, // Add unit (kg, liter, bottle, etc.)
            unitvalue: product.unitvalue, // Add unit value (0.5 for "0.5kg")
            subUnits: allUnitsOptions, // All available units (base + sub-units)
            selectedUnit: product.unit, // Currently selected unit (starts with base unit)
            selectedUnitConversionValue: 1, // Conversion ratio for current unit (1 = base unit)
          },
        ]);
      }

      setSearchValue("");
      searchInputRef.current?.focus();
      showNotification("Product added to cart", "success");
    } catch (error) {
      console.error("Product lookup error:", error);
      console.error("Error response:", error.response?.data);
      showNotification(
        error.response?.data?.detail || "Product not found",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index, delta) => {
    const newCart = [...cartItems];
    const newQty = newCart[index].quantity + delta;

    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else {
      const available = newCart[index].available;
      // Convert available stock to the selected unit
      const conversionValue = newCart[index].selectedUnitConversionValue || 1;
      const availableInSelectedUnit = available * conversionValue;

      // Only check availability if we have the data (not from localStorage)
      if (
        available !== undefined &&
        available !== null &&
        newQty > availableInSelectedUnit
      ) {
        showNotification(
          `Stock quantity is ${availableInSelectedUnit} ${newCart[index].selectedUnit} only`,
          "error",
        );
        return;
      }
      newCart[index].quantity = newQty;
    }

    setCartItems(newCart);
  };

  const handleDirectQuantityChange = (index, value) => {
    const newCart = [...cartItems];
    const available = newCart[index].available;
    const conversionValue = newCart[index].selectedUnitConversionValue || 1;
    const availableInSelectedUnit = available * conversionValue;

    // Allow normal decimal input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      // Check if entered value exceeds stock
      if (value !== "" && value !== ".") {
        const numValue = parseFloat(value);
        if (
          !isNaN(numValue) &&
          numValue > 0 &&
          available !== undefined &&
          available !== null &&
          numValue > availableInSelectedUnit
        ) {
          showNotification(
            `Stock quantity is ${availableInSelectedUnit} ${newCart[index].selectedUnit} only`,
            "error",
          );
          return;
        }
      }
      newCart[index].quantity = value;
      setCartItems(newCart);
      return;
    }

    // If we get here and it's a number, parse and validate
    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue <= 0) {
      return;
    }

    // Only check availability if we have the data
    if (
      available !== undefined &&
      available !== null &&
      numValue > availableInSelectedUnit
    ) {
      showNotification(
        `Stock quantity is ${availableInSelectedUnit} ${newCart[index].selectedUnit} only`,
        "error",
      );
      return;
    }

    newCart[index].quantity = numValue;
    setCartItems(newCart);
  };

  const handleUnitChange = (index, newUnitCode) => {
    const newCart = [...cartItems];
    const item = newCart[index];

    // Find the new unit in sub-units
    const newUnit = item.subUnits.find((u) => u.code === newUnitCode);
    if (!newUnit) {
      console.error("Unit not found:", newUnitCode);
      return;
    }

    // Get old conversion value (current selected unit)
    const oldConversionValue = item.selectedUnitConversionValue;

    // Calculate new quantity based on conversion
    // Formula: newQty = oldQty × (newConversionValue / oldConversionValue)
    // This maintains consistency: if 1kg = 1000g, then 5kg = 5000g
    // Example: 5kg (conv=1) → grams (conv=1000)
    // newQty = 5 × 1000 / 1 = 5000 grams ✓
    const newQuantity =
      (item.quantity * newUnit.conversion_value) / oldConversionValue;

    console.log(
      `Converting unit from ${item.selectedUnit} (conv=${oldConversionValue}) to ${newUnitCode} (conv=${newUnit.conversion_value})`,
    );
    console.log(
      `Quantity conversion: ${item.quantity} ${item.selectedUnit} -> ${newQuantity} ${newUnitCode}`,
    );

    newCart[index].selectedUnit = newUnitCode;
    newCart[index].selectedUnitConversionValue = newUnit.conversion_value;
    newCart[index].quantity = newQuantity;

    setCartItems(newCart);
  };

  const handleRemoveItem = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  const handleViewProduct = (item) => {
    setViewingProduct(item);
    setShowProductDetails(true);
  };

  const closeProductDetails = () => {
    setShowProductDetails(false);
    setViewingProduct(null);
  };

  const calculateItemTotal = (item) => {
    // Normalize quantity to base unit for calculation
    // If quantity is in grams (5000g) with conversionValue=1000,
    // quantity in base units = 5000 / 1000 = 5kg
    const conversionValue = item.selectedUnitConversionValue || 1;
    const quantityInBaseUnit = parseFloat(item.quantity) / conversionValue;

    const subtotal = item.price * quantityInBaseUnit;
    const discountAmount = (subtotal * item.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * item.tax) / 100;
    return taxableAmount + taxAmount;
  };

  const calculateTotals = () => {
    // Ensure cartItems is an array
    const items = Array.isArray(cartItems) ? cartItems : [];

    // Helper function to get quantity in base units
    const getBaseUnitQuantity = (item) => {
      const conversionValue = item.selectedUnitConversionValue || 1;
      return parseFloat(item.quantity) / conversionValue;
    };

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * getBaseUnitQuantity(item),
      0,
    );
    const totalDiscount = items.reduce(
      (sum, item) =>
        sum + (item.price * getBaseUnitQuantity(item) * item.discount) / 100,
      0,
    );
    const taxableAmount = subtotal - totalDiscount;
    const totalTax = items.reduce((sum, item) => {
      const baseQty = getBaseUnitQuantity(item);
      const itemSubtotal = item.price * baseQty;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const itemTaxable = itemSubtotal - itemDiscount;
      return sum + (itemTaxable * item.tax) / 100;
    }, 0);
    const total = taxableAmount + totalTax;

    return { subtotal, totalDiscount, totalTax, total };
  };

  const handleSearchCustomer = async () => {
    if (!customer.phone || customer.phone.length < 10) {
      showNotification("Enter valid phone number", "warning");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${API_BASE_URL}/customers/phone/${customer.phone}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const cust = response.data;
      setExistingCustomer(cust);
      setCustomer({
        name: cust.customer_name || "",
        phone: cust.phone_number,
        email: cust.email || "",
      });
      showNotification("Customer found", "success");
    } catch {
      setExistingCustomer(null);
      showNotification("New customer - details will be saved", "info");
    }
  };

  const handleCreateSale = async () => {
    const itemsToSell = Array.isArray(cartItems) ? cartItems : [];
    if (itemsToSell.length === 0) {
      showNotification("Add items to cart first", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const totals = calculateTotals();

      // Create or update customer if phone provided
      let customerId = existingCustomer?.id;

      if (customer.phone && !existingCustomer) {
        const custResponse = await axios.post(
          `${API_BASE_URL}/customers/`,
          {
            customer_name: customer.name || "Walk-in Customer",
            phone_number: customer.phone,
            email: customer.email || null,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        customerId = custResponse.data.id;
      }

      // Create sale
      const saleData = {
        customer_id: customerId,
        customer_name: customer.name || null,
        customer_phone: customer.phone || null,
        customer_email: customer.email || null,
        payment_method: paymentMethod,
        payment_status:
          parseFloat(amountPaid || 0) >= totals.total
            ? "paid"
            : parseFloat(amountPaid || 0) > 0
              ? "partial"
              : "pending",
        amount_paid: parseFloat(amountPaid || 0),
        store_id: selectedStore && selectedStore.id ? selectedStore.id : null,
        items: itemsToSell.map((item) => ({
          product_id: item.id,
          product_code: item.productid,
          barcode: item.barcode,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price / (item.selectedUnitConversionValue || 1),
          discount_percent: item.discount,
          tax_percent: item.tax,
          selected_unit: item.selectedUnit,
          unit_conversion_value: item.selectedUnitConversionValue || 1,
        })),
      };

      const response = await axios.post(`${API_BASE_URL}/sales/`, saleData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification(
        `Sale ${response.data.sale_number} created successfully!`,
        "success",
      );

      // Clear cart, payment details, and customer details after successful sale
      setCartItems([]);
      setAmountPaid("");
      setCustomer({ name: "", phone: "", email: "" });
      setExistingCustomer(null);

      searchInputRef.current?.focus();
    } catch (error) {
      showNotification(
        error.response?.data?.detail || "Failed to create sale",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = () => {
    confirmDialog({
      message: "Clear all items from cart?",
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: () => setCartItems([]),
      reject: () => {},
    });
  };

  const handleClearSale = () => {
    confirmDialog({
      message: "Clear entire sale including customer details and payment info?",
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        // Clear all state
        setCartItems([]);
        setCustomer({ name: "", phone: "", email: "" });
        setExistingCustomer(null);
        setAmountPaid("");
        setPaymentMethod("cash");
        setSearchValue("");
        setSelectedStore(null);

        // Clear localStorage
        localStorage.removeItem("salesCart");
        localStorage.removeItem("salesCustomer");
        localStorage.removeItem("salesPaymentMethod");
        localStorage.removeItem("salesAmountPaid");
        localStorage.removeItem("salesSelectedStore");

        showNotification("Sale cleared", "info");
        searchInputRef.current?.focus();
      },
      reject: () => {},
    });
  };

  const totals = calculateTotals();
  const balance = totals.total - parseFloat(amountPaid || 0);
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  return (
    <div className="sales-screen">
      <ConfirmDialog />
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="sales-header">
        <div className="header-left">
          <h2>New Sale</h2>
          {Array.isArray(stores) && stores.length > 0 && (
            <div className="store-selector">
              <label>Store: </label>
              <Dropdown
                value={selectedStore || null}
                onChange={(e) => setSelectedStore(e.value)}
                options={Array.isArray(stores) ? stores : []}
                optionLabel="store_name"
                optionValue={null}
                className="store-dropdown"
                placeholder="select store"
                disabled={safeCartItems.length > 0}
                showClear={!safeCartItems.length}
              />
              {safeCartItems.length > 0 && (
                <span className="store-locked-hint">🔒</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleClearSale}
          className="btn-clear-sale"
          disabled={
            safeCartItems.length === 0 &&
            !customer.name &&
            !customer.phone &&
            !customer.email
          }
        >
          Clear Sale
        </button>
      </div>

      <div className="sales-container">
        {/* Left Section - Product Search & Cart */}
        <div className="sales-left">
          {/* Product Search */}
          <div className="search-section">
            <div className="search-type-selector">
              <label className={searchType === "barcode" ? "active" : ""}>
                <input
                  type="radio"
                  value="barcode"
                  checked={searchType === "barcode"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                Barcode
              </label>
              <label className={searchType === "productid" ? "active" : ""}>
                <input
                  type="radio"
                  value="productid"
                  checked={searchType === "productid"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                Product ID
              </label>
              <label className={searchType === "sku" ? "active" : ""}>
                <input
                  type="radio"
                  value="sku"
                  checked={searchType === "sku"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                SKU
              </label>
            </div>

            <form onSubmit={handleSearchProduct} className="search-form">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Enter ${searchType}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="search-input"
              />
              <button
                type="submit"
                className="btn-search"
                disabled={loading || !selectedStore}
              >
                {loading ? "Searching..." : "Add"}
              </button>
            </form>
          </div>

          {/* Cart Items */}
          <div className="cart-section">
            <div className="cart-header">
              <h3>Cart Items ({safeCartItems.length})</h3>
              {safeCartItems.length > 0 && (
                <button onClick={handleClearCart} className="btn-clear">
                  Clear
                </button>
              )}
            </div>

            <div className="cart-items">
              {safeCartItems.length === 0 ? (
                <div className="empty-cart">No items in cart</div>
              ) : (
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Disc%</th>
                      <th>Tax%</th>
                      <th>Total</th>
                      <th style={{ width: "60px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeCartItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="item-name" title={item.name}>
                            {item.name}
                          </div>
                          <div className="item-code">{item.barcode}</div>
                        </td>
                        <td>
                          <div>
                            <div>
                              {item.selectedUnitConversionValue &&
                                item.selectedUnitConversionValue !== 1 && (
                                  <>
                                    ₹
                                    {(
                                      item.price /
                                      item.selectedUnitConversionValue
                                    ).toFixed(2)}
                                    <span
                                      style={{
                                        fontSize: "9px",
                                        color: "#666",
                                        marginLeft: "4px",
                                      }}
                                    >
                                      /{item.selectedUnit}
                                    </span>
                                  </>
                                )}
                              {(!item.selectedUnitConversionValue ||
                                item.selectedUnitConversionValue === 1) && (
                                <>
                                  ₹{item.price.toFixed(2)}
                                  {item.unit && (
                                    <span
                                      style={{
                                        fontSize: "9px",
                                        color: "#666",
                                        marginLeft: "4px",
                                      }}
                                    >
                                      /{item.unit}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            {item.subUnits && item.subUnits.length > 1 && (
                              <Dropdown
                                value={item.selectedUnit || item.unit}
                                onChange={(e) =>
                                  handleUnitChange(index, e.value)
                                }
                                options={item.subUnits}
                                optionLabel="code"
                                optionValue="code"
                                className="unit-dropdown"
                                style={{
                                  width: "auto",
                                  marginTop: "4px",
                                }}
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="qty-control">
                            <button
                              onClick={() => handleQuantityChange(index, -1)}
                            >
                              −
                            </button>
                            <input
                              type="text"
                              inputMode="decimal"
                              step="0.01"
                              min="0.01"
                              value={item.quantity}
                              onChange={(e) => {
                                let value = e.target.value;
                                handleDirectQuantityChange(index, value);
                              }}
                              onBlur={(e) => {
                                // On blur, if empty or 0, remove item
                                const value = e.target.value;
                                if (
                                  value === "" ||
                                  value === "0" ||
                                  parseFloat(value) <= 0
                                ) {
                                  handleRemoveItem(index);
                                }
                              }}
                              className="qty-input"
                            />
                            <button
                              onClick={() => handleQuantityChange(index, 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{item.discount}%</td>
                        <td>{item.tax}%</td>
                        <td className="item-total">
                          ₹{calculateItemTotal(item).toFixed(2)}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleViewProduct(item)}
                              className="btn-view"
                              title="View details"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="btn-remove"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Customer & Billing */}
        <div className="sales-right">
          {/* Customer Details */}
          <div className="customer-section">
            <div
              className="accordion-header"
              onClick={() => setExpandCustomerDetails(!expandCustomerDetails)}
            >
              <span className="accordion-title">Customer Details</span>
              <span
                className={`accordion-arrow ${expandCustomerDetails ? "open" : ""}`}
              >
                ▶
              </span>
            </div>
            {expandCustomerDetails && (
              <div className="customer-form">
                <div className="form-row">
                  <label>Phone Number *</label>
                  <div className="phone-input-group">
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      placeholder="Enter phone number"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                      maxLength="15"
                    />
                    <button
                      onClick={handleSearchCustomer}
                      className="btn-search-customer"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="Customer name (optional)"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({ ...customer, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer({ ...customer, email: e.target.value })
                    }
                  />
                </div>

                {existingCustomer && (
                  <div className="existing-customer-badge">
                    Existing Customer
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bill Summary */}
          <div className="billing-section">
            <h3>Bill Summary</h3>
            <div className="bill-details">
              <div className="bill-row">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="bill-row discount">
                <span>Discount:</span>
                <span>−₹{totals.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="bill-row tax">
                <span>Tax:</span>
                <span>+₹{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="bill-row total">
                <span>Total:</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="payment-section">
              <div className="form-row">
                <label>Payment Method</label>
                <Dropdown
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.value)}
                  options={[
                    { label: "Cash", value: "cash" },
                    { label: "Card", value: "card" },
                    { label: "UPI", value: "upi" },
                    { label: "Online", value: "online" },
                  ]}
                  optionLabel="label"
                  optionValue="value"
                />
              </div>

              <div className="form-row">
                <label>Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                />
              </div>

              {amountPaid && (
                <div className="balance-display">
                  <span>Balance:</span>
                  <span className={balance < 0 ? "change" : "due"}>
                    ₹{Math.abs(balance).toFixed(2)}{" "}
                    {balance < 0 ? "Change" : "Due"}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateSale}
              className="btn-complete-sale"
              disabled={loading || safeCartItems.length === 0}
            >
              {loading ? "Processing..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {showProductDetails && viewingProduct && (
        <div className="modal-overlay" onClick={closeProductDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Product Details</h3>
              <button className="modal-close" onClick={closeProductDetails}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Product Name:</span>
                <span className="detail-value">{viewingProduct.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Product ID:</span>
                <span className="detail-value">
                  {viewingProduct.productid || "N/A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Barcode:</span>
                <span className="detail-value">{viewingProduct.barcode}</span>
              </div>
              {viewingProduct.sku && (
                <div className="detail-row">
                  <span className="detail-label">SKU:</span>
                  <span className="detail-value">{viewingProduct.sku}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Price:</span>
                <span className="detail-value">
                  ₹{viewingProduct.price.toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Quantity:</span>
                <span className="detail-value">{viewingProduct.quantity}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Discount:</span>
                <span className="detail-value">{viewingProduct.discount}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tax (GST):</span>
                <span className="detail-value">{viewingProduct.tax}%</span>
              </div>
              {viewingProduct.available !== undefined && (
                <div className="detail-row">
                  <span className="detail-label">Available Stock:</span>
                  <span className="detail-value">
                    {viewingProduct.available}
                  </span>
                </div>
              )}
              <div className="detail-row highlight">
                <span className="detail-label">Item Total:</span>
                <span className="detail-value">
                  ₹{calculateItemTotal(viewingProduct).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesScreen;
