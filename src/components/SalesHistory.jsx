import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import "./SalesHistory.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    paymentStatus: "",
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams();

      if (filters.paymentStatus) {
        params.append("payment_status", filters.paymentStatus);
      }
      if (filters.startDate) {
        const startDateStr = filters.startDate.toISOString().split("T")[0];
        params.append("start_date", startDateStr);
      }
      if (filters.endDate) {
        const endDateStr = filters.endDate.toISOString().split("T")[0];
        params.append("end_date", endDateStr);
      }

      const response = await axios.get(
        `${API_BASE_URL}/sales/?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setSales(response.data);
    } catch (error) {
      showNotification(
        error.response?.data?.detail || "Failed to fetch sales",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedSale(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchSales();
  };

  const handleClearFilters = () => {
    setFilters({
      paymentStatus: "",
      startDate: null,
      endDate: null,
    });
    setTimeout(fetchSales, 100);
  };

  const getPaymentStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-paid";
      case "partial":
        return "status-partial";
      case "pending":
        return "status-pending";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const paymentStatusOptions = [
    { label: "All", value: "" },
    { label: "Paid", value: "paid" },
    { label: "Partial", value: "partial" },
    { label: "Pending", value: "pending" },
  ];

  return (
    <div className="sales-history-container">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="history-header">
        <h2>Sales History</h2>
        <button onClick={fetchSales} className="btn-refresh" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Payment Status</label>
          <Dropdown
            value={filters.paymentStatus}
            onChange={(e) => handleFilterChange("paymentStatus", e.value)}
            options={paymentStatusOptions}
            placeholder="Select Status"
          />
        </div>

        <div className="filter-group">
          <label>From Date</label>
          <Calendar
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.value)}
            dateFormat="dd/mm/yy"
            placeholder="Select date"
            showIcon
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <Calendar
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.value)}
            dateFormat="dd/mm/yy"
            placeholder="Select date"
            showIcon
          />
        </div>

        <div className="filter-actions">
          <button onClick={handleApplyFilters} className="btn-apply">
            Apply
          </button>
          <button onClick={handleClearFilters} className="btn-clear">
            Clear
          </button>
        </div>
      </div>

      <div className="sales-summary">
        <div className="summary-card">
          <span className="summary-label">Total Sales</span>
          <span className="summary-value">{sales.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Amount</span>
          <span className="summary-value">
            ₹
            {sales
              .reduce(
                (sum, sale) => sum + parseFloat(sale.total_amount || 0),
                0,
              )
              .toFixed(2)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Amount Paid</span>
          <span className="summary-value">
            ₹
            {sales
              .reduce((sum, sale) => sum + parseFloat(sale.amount_paid || 0), 0)
              .toFixed(2)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Amount Due</span>
          <span className="summary-value">
            ₹
            {sales
              .reduce((sum, sale) => sum + parseFloat(sale.amount_due || 0), 0)
              .toFixed(2)}
          </span>
        </div>
      </div>

      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Sale #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  {loading ? "Loading..." : "No sales found"}
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="sale-number">{sale.sale_number}</td>
                  <td className="sale-date">{formatDate(sale.created_at)}</td>
                  <td className="customer-info">
                    <div className="customer-name">
                      {sale.customer_name || "Walk-in"}
                    </div>
                    {sale.customer_phone && (
                      <div className="customer-phone">
                        {sale.customer_phone}
                      </div>
                    )}
                  </td>
                  <td className="items-count">{sale.items?.length || 0}</td>
                  <td className="amount">
                    ₹{parseFloat(sale.total_amount).toFixed(2)}
                  </td>
                  <td className="amount">
                    ₹{parseFloat(sale.amount_paid).toFixed(2)}
                  </td>
                  <td className="amount">
                    ₹{parseFloat(sale.amount_due).toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getPaymentStatusClass(sale.payment_status)}`}
                    >
                      {sale.payment_status.charAt(0).toUpperCase() +
                        sale.payment_status.slice(1)}
                    </span>
                  </td>
                  <td className="payment-method">
                    {sale.payment_method.charAt(0).toUpperCase() +
                      sale.payment_method.slice(1)}
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewDetails(sale)}
                      className="btn-view"
                      title="View Details"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sale Details Modal */}
      {showDetails && selectedSale && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sale Details - {selectedSale.sale_number}</h3>
              <button className="modal-close" onClick={closeDetails}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h4>Sale Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Sale Number:</span>
                  <span className="detail-value">
                    {selectedSale.sale_number}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {formatDate(selectedSale.created_at)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Customer Name:</span>
                  <span className="detail-value">
                    {selectedSale.customer_name || "Walk-in Customer"}
                  </span>
                </div>
                {selectedSale.customer_phone && (
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">
                      {selectedSale.customer_phone}
                    </span>
                  </div>
                )}
                {selectedSale.customer_email && (
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">
                      {selectedSale.customer_email}
                    </span>
                  </div>
                )}
              </div>

              <div className="details-section">
                <h4>Items</h4>
                <div className="items-table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Disc%</th>
                        <th>Tax%</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items?.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="item-name">{item.product_name}</div>
                            <div className="item-code">{item.barcode}</div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                          <td>{item.discount_percent}%</td>
                          <td>{item.tax_percent}%</td>
                          <td>₹{parseFloat(item.total_amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="details-section">
                <h4>Payment Details</h4>
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>₹{parseFloat(selectedSale.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Discount:</span>
                    <span>
                      -₹{parseFloat(selectedSale.discount_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tax (GST):</span>
                    <span>
                      ₹{parseFloat(selectedSale.tax_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>
                      ₹{parseFloat(selectedSale.total_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Amount Paid:</span>
                    <span>
                      ₹{parseFloat(selectedSale.amount_paid).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Amount Due:</span>
                    <span>
                      ₹{parseFloat(selectedSale.amount_due).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Payment Method:</span>
                    <span>
                      {selectedSale.payment_method.charAt(0).toUpperCase() +
                        selectedSale.payment_method.slice(1)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Payment Status:</span>
                    <span
                      className={`status-badge ${getPaymentStatusClass(selectedSale.payment_status)}`}
                    >
                      {selectedSale.payment_status.charAt(0).toUpperCase() +
                        selectedSale.payment_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedSale.notes && (
                <div className="details-section">
                  <h4>Notes</h4>
                  <p>{selectedSale.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
