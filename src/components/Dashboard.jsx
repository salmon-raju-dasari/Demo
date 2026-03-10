import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { useState, useEffect } from "react";
import api from "../services/api/axios";
import "./Dashboard.css";

export default function Dashboard() {
  const [businessName, setBusinessName] = useState("Your Business");
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    products: 0,
    customers: 0,
    revenue: "0.00",
  });
  const [chartData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Sales",
        data: [65, 59, 80, 81, 56, 55, 40],
        fill: false,
        borderColor: "#667eea",
        tension: 0.4,
      },
    ],
  });

  const [chartOptions] = useState({
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: "#495057",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#495057",
        },
        grid: {
          color: "#ebedef",
        },
      },
      y: {
        ticks: {
          color: "#495057",
        },
        grid: {
          color: "#ebedef",
        },
      },
    },
  });

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const response = await api.get("/business");
        console.log("Business details from /business endpoint:", response.data);

        if (response.data?.business_name) {
          console.log("Setting business name:", response.data.business_name);
          setBusinessName(response.data.business_name);
          localStorage.setItem("business_name", response.data.business_name);
        } else {
          console.log("No business_name found in response");
          setBusinessName(
            localStorage.getItem("business_name") || "Your Business",
          );
        }
      } catch (error) {
        console.error("Error fetching business details:", error);
        const storedName = localStorage.getItem("business_name");
        console.log("Using stored business name:", storedName);
        setBusinessName(storedName || "Your Business");
      }
    };
    fetchBusinessDetails();
  }, []);

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get("/stores");
        console.log("Stores response:", response.data);

        const storesList = response.data?.items || [];

        // Create dropdown options: all stores only (no Central Inventory)
        const options = storesList.map((store) => ({
          label: store.store_name,
          value: store.id,
        }));

        setStores(options);

        // Set default selected store to first store (if available)
        setSelectedStore(options.length > 0 ? options[0].value : null);
      } catch (error) {
        console.error("Error fetching stores:", error);
        // Default to empty if fetch fails
        setStores([]);
        setSelectedStore(null);
      }
    };

    fetchStores();
  }, []);

  // Fetch and calculate metrics based on selected store
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const salesResponse = await api.get("/sales");
        const sales = salesResponse.data || [];

        // Filter sales by selected store
        let filteredSales = sales;
        if (selectedStore !== null) {
          filteredSales = sales.filter(
            (sale) => sale.store_id === selectedStore,
          );
        } else {
          // No store selected - show no sales
          filteredSales = [];
        }

        // Calculate metrics
        const totalRevenue = filteredSales.reduce((sum, sale) => {
          return sum + (parseFloat(sale.total_amount) || 0);
        }, 0);

        // Count unique customers
        const uniqueCustomers = new Set(
          filteredSales
            .filter((sale) => sale.customer_id)
            .map((sale) => sale.customer_id),
        );

        // Count unique products
        const uniqueProducts = new Set();
        filteredSales.forEach((sale) => {
          if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item) => {
              if (item.product_id) {
                uniqueProducts.add(item.product_id);
              }
            });
          }
        });

        setMetrics({
          totalSales: filteredSales.length,
          products: uniqueProducts.size,
          customers: uniqueCustomers.size,
          revenue: totalRevenue.toFixed(2),
        });

        console.log("Calculated metrics:", {
          totalSales: filteredSales.length,
          products: uniqueProducts.size,
          customers: uniqueCustomers.size,
          revenue: totalRevenue.toFixed(2),
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
        setMetrics({
          totalSales: 0,
          products: 0,
          customers: 0,
          revenue: "0.00",
        });
      }
    };

    fetchMetrics();
  }, [selectedStore]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>
          Welcome to{" "}
          <span className="business-name-heading">{businessName}</span>
        </h1>
        <div className="store-selector">
          <Dropdown
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.value)}
            options={stores}
            showClear={true}
            optionLabel="label"
            optionValue="value"
            placeholder="Choose a store..."
            className="w-full"
          />
        </div>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-3">
          <Card className="dashboard-stat-card">
            <div className="flex align-items-center">
              <div
                className="flex align-items-center justify-content-center"
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <i className="pi pi-shopping-cart text-white text-2xl"></i>
              </div>
              <div className="ml-3">
                <span className="block text-500 font-medium mb-1">
                  Total Sales
                </span>
                <div className="text-900 font-bold text-xl">
                  {metrics.totalSales}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="dashboard-stat-card">
            <div className="flex align-items-center">
              <div
                className="flex align-items-center justify-content-center"
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                }}
              >
                <i className="pi pi-box text-white text-2xl"></i>
              </div>
              <div className="ml-3">
                <span className="block text-500 font-medium mb-1">
                  Products
                </span>
                <div className="text-900 font-bold text-xl">
                  {metrics.products}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="dashboard-stat-card">
            <div className="flex align-items-center">
              <div
                className="flex align-items-center justify-content-center"
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                }}
              >
                <i className="pi pi-users text-white text-2xl"></i>
              </div>
              <div className="ml-3">
                <span className="block text-500 font-medium mb-1">
                  Customers
                </span>
                <div className="text-900 font-bold text-xl">
                  {metrics.customers}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-12 md:col-6 lg:col-3">
          <Card className="dashboard-stat-card">
            <div className="flex align-items-center">
              <div
                className="flex align-items-center justify-content-center"
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                }}
              >
                <i className="pi pi-dollar text-white text-2xl"></i>
              </div>
              <div className="ml-3">
                <span className="block text-500 font-medium mb-1">Revenue</span>
                <div className="text-900 font-bold text-xl">
                  ${metrics.revenue}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid mt-4">
        <div className="col-12">
          <Card title="Weekly Sales Overview">
            <Chart
              type="line"
              data={chartData}
              options={chartOptions}
              style={{ height: "300px" }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
