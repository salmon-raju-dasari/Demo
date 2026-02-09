import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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

  const [searchType, setSearchType] = useState("barcode");
  const [searchValue, setSearchValue] = useState("");
  const [cartItems, setCartItems] = useState(getInitialCart);
  const [customer, setCustomer] = useState(getInitialCustomer);
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(getInitialPaymentMethod);
  const [amountPaid, setAmountPaid] = useState(getInitialAmountPaid);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  const searchInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Focus on search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
    console.log("Sales screen loaded with cart items:", cartItems.length);
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

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  const handleSearchProduct = async (e) => {
    e?.preventDefault();
    if (!searchValue.trim()) {
      showNotification("Please enter a search value", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const lookup = {};

      if (searchType === "barcode") lookup.barcode = searchValue;
      else if (searchType === "productid") lookup.product_id = searchValue;
      else if (searchType === "sku") lookup.sku = searchValue;

      console.log("Searching for product:", {
        searchType,
        searchValue,
        lookup,
      });

      const response = await axios.post(
        `${API_BASE_URL}/sales/product-lookup`,
        lookup,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log("Product found:", response.data);
      const product = response.data;

      // Check if product already in cart
      const existingIndex = cartItems.findIndex(
        (item) => item.id === product.id,
      );

      if (existingIndex !== -1) {
        // Increase quantity
        const newCart = [...cartItems];
        const newQty = newCart[existingIndex].quantity + 1;
        const available = newCart[existingIndex].available || product.quantity;

        if (newQty <= available) {
          newCart[existingIndex].quantity = newQty;
          setCartItems(newCart);
        } else {
          showNotification(`Only ${available} items available`, "warning");
        }
      } else {
        // Add new item
        // Calculate price per full unit if unitvalue exists
        const pricePerFullUnit =
          product.unitvalue && product.unitvalue > 0
            ? parseFloat(product.price) / parseFloat(product.unitvalue)
            : parseFloat(product.price);

        setCartItems([
          ...cartItems,
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
            available: product.quantity,
            unit: product.unit, // Add unit (kg, liter, bottle, etc.)
            unitvalue: product.unitvalue, // Add unit value (0.5 for "0.5kg")
            bottle_capacity: product.bottle_capacity, // Add bottle capacity
            bottle_unit: product.bottle_unit, // Add bottle unit
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
      // Only check availability if we have the data (not from localStorage)
      if (available !== undefined && available !== null && newQty > available) {
        showNotification(`Only ${available} items available`, "warning");
        return;
      }
      newCart[index].quantity = newQty;
    }

    setCartItems(newCart);
  };

  const handleDirectQuantityChange = (index, value) => {
    const newCart = [...cartItems];
    const item = newCart[index];

    // Allow normal decimal input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      newCart[index].quantity = value;
      setCartItems(newCart);
      return;
    }

    // If we get here and it's a number, parse and validate
    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue <= 0) {
      return;
    }

    const available = newCart[index].available;

    // Only check availability if we have the data
    if (available !== undefined && available !== null && numValue > available) {
      showNotification(`Only ${available} items available`, "warning");
      return;
    }

    newCart[index].quantity = numValue;
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
    const subtotal = item.price * item.quantity;
    const discountAmount = (subtotal * item.discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * item.tax) / 100;
    return taxableAmount + taxAmount;
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const totalDiscount = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity * item.discount) / 100,
      0,
    );
    const taxableAmount = subtotal - totalDiscount;
    const totalTax = cartItems.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
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
    } catch (error) {
      setExistingCustomer(null);
      showNotification("New customer - details will be saved", "info");
    }
  };

  const handleCreateSale = async () => {
    if (cartItems.length === 0) {
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
        items: cartItems.map((item) => ({
          product_id: item.id,
          product_code: item.productid,
          barcode: item.barcode,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          discount_percent: item.discount,
          tax_percent: item.tax,
        })),
      };

      const response = await axios.post(`${API_BASE_URL}/sales/`, saleData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showNotification(
        `Sale ${response.data.sale_number} created successfully!`,
        "success",
      );

      // Clear cart and payment details after successful sale
      setCartItems([]);
      setAmountPaid("");
      // Keep customer details for next sale

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
    if (window.confirm("Clear all items from cart?")) {
      setCartItems([]);
    }
  };

  const handleClearSale = () => {
    if (
      window.confirm(
        "Clear entire sale including customer details and payment info?",
      )
    ) {
      // Clear all state
      setCartItems([]);
      setCustomer({ name: "", phone: "", email: "" });
      setExistingCustomer(null);
      setAmountPaid("");
      setPaymentMethod("cash");
      setSearchValue("");

      // Clear localStorage
      localStorage.removeItem("salesCart");
      localStorage.removeItem("salesCustomer");
      localStorage.removeItem("salesPaymentMethod");
      localStorage.removeItem("salesAmountPaid");

      showNotification("Sale cleared", "info");
      searchInputRef.current?.focus();
    }
  };

  const totals = calculateTotals();
  const balance = totals.total - parseFloat(amountPaid || 0);

  return (
    <div className="sales-screen">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="sales-header">
        <h2>New Sale</h2>
        <button onClick={handleClearSale} className="btn-clear-sale">
          Clear Sale
        </button>
      </div>

      <div className="sales-container">
        {/* Left Section - Product Search & Cart */}
        <div className="sales-left">
          {/* Product Search */}
          <div className="search-section">
            <h3>Product Search</h3>
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
              <button type="submit" className="btn-search" disabled={loading}>
                {loading ? "Searching..." : "Add"}
              </button>
            </form>
          </div>

          {/* Cart Items */}
          <div className="cart-section">
            <div className="cart-header">
              <h3>Cart Items ({cartItems.length})</h3>
              {cartItems.length > 0 && (
                <button onClick={handleClearCart} className="btn-clear">
                  Clear
                </button>
              )}
            </div>

            <div className="cart-items">
              {cartItems.length === 0 ? (
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
                    {cartItems.map((item, index) => (
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
                            </div>
                            {item.unit &&
                              item.unit.toLowerCase() === "bottle" &&
                              item.bottle_capacity && (
                                <div
                                  style={{
                                    fontSize: "9px",
                                    color: "#666",
                                    marginTop: "2px",
                                  }}
                                >
                                  ({item.bottle_capacity}
                                  {item.bottle_unit})
                                </div>
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
            <h3>Customer Details</h3>
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
                <div className="existing-customer-badge">Existing Customer</div>
              )}
            </div>
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
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                </select>
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
              disabled={loading || cartItems.length === 0}
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
