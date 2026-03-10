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
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [filters, setFilters] = useState({
    paymentStatus: "",
    startDate: null,
    endDate: null,
    store: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryTotals, setSummaryTotals] = useState({
    count: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalDue: 0,
  });

  useEffect(() => {
    fetchStores();
    fetchSummaryTotals();
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch sales and totals when filters change
  useEffect(() => {
    if (
      filters.store ||
      filters.paymentStatus ||
      filters.startDate ||
      filters.endDate
    ) {
      // Only refetch when a filter is actively set
      const timer = setTimeout(() => {
        setCurrentPage(1); // Reset to page 1 when filters change
        fetchSummaryTotals();
        fetchSales();
      }, 300); // Debounce to avoid rapid API calls
      return () => clearTimeout(timer);
    }
  }, [
    filters.store,
    filters.paymentStatus,
    filters.startDate,
    filters.endDate,
  ]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      3000,
    );
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/stores/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Handle both array and object responses
      const storesList = response.data?.items || response.data || [];
      setStores(Array.isArray(storesList) ? storesList : []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      setStores([]);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams();

      // Add pagination parameters
      params.append("skip", (currentPage - 1) * pageSize);
      params.append("limit", pageSize);

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
      if (filters.store) {
        params.append("store_id", filters.store.id);
      }

      const response = await axios.get(
        `${API_BASE_URL}/sales/?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Handle both array and object responses
      const salesData = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];
      setSales(salesData);
      // totalRecords is already set by fetchSummaryTotals, don't recalculate it here
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

  const fetchSummaryTotals = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const params = new URLSearchParams();

      // Fetch all matching records without pagination to calculate totals
      params.append("skip", 0);
      params.append("limit", 999999);

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
      if (filters.store) {
        params.append("store_id", filters.store.id);
      }

      const response = await axios.get(
        `${API_BASE_URL}/sales/?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const allSalesData = Array.isArray(response.data)
        ? response.data
        : response.data?.items || [];

      // Calculate totals from all matching records
      const totals = {
        count: allSalesData.length,
        totalAmount: allSalesData.reduce(
          (sum, sale) => sum + parseFloat(sale.total_amount || 0),
          0,
        ),
        totalPaid: allSalesData.reduce(
          (sum, sale) => sum + parseFloat(sale.amount_paid || 0),
          0,
        ),
        totalDue: allSalesData.reduce(
          (sum, sale) => sum + parseFloat(sale.amount_due || 0),
          0,
        ),
      };

      setSummaryTotals(totals);
      setTotalRecords(totals.count); // Update pagination total to match filtered count
    } catch (error) {
      console.error("Error fetching summary totals:", error);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filtering
    fetchSummaryTotals(); // Fetch totals for all matching records
    fetchSales();
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setFilters({
      paymentStatus: "",
      startDate: null,
      endDate: null,
      store: null,
    });
    setTimeout(() => {
      fetchSummaryTotals();
      fetchSales();
    }, 100);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const calculateTotalPages = () => {
    return Math.ceil(totalRecords / pageSize);
  };

  const getPageNumbers = () => {
    const totalPages = calculateTotalPages();
    const maxVisible = 3;
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Re-fetch when page changes
  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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
          <label>Store</label>
          <Dropdown
            value={filters.store}
            onChange={(e) => handleFilterChange("store", e.value)}
            options={Array.isArray(stores) ? stores : []}
            optionLabel="store_name"
            placeholder="Select Store"
            loading={storesLoading}
            filter
            filterBy="store_name"
            showFilterClear
          />
        </div>

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
          <span className="summary-value">{summaryTotals.count}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Amount</span>
          <span className="summary-value">
            ₹{summaryTotals.totalAmount.toFixed(2)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Amount Paid</span>
          <span className="summary-value">
            ₹{summaryTotals.totalPaid.toFixed(2)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Amount Due</span>
          <span className="summary-value">
            ₹{summaryTotals.totalDue.toFixed(2)}
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

      {/* Pagination Controls */}
      <div className="pagination-section">
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          <div className="page-numbers">
            {getPageNumbers().map((page) => (
              <button
                key={page}
                className={`page-number ${currentPage === page ? "active" : ""}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= calculateTotalPages()}
          >
            Next →
          </button>

          <div className="page-size-selector">
            <label>Records per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="page-size-dropdown"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="pagination-info">
            Page {currentPage} of {calculateTotalPages()} (Total: {totalRecords}
            )
          </div>
        </div>
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
