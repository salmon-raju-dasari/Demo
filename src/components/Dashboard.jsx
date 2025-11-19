import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { useState } from "react";

export default function Dashboard() {
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

  return (
    <div className="dashboard-container">
      <h1 className="mb-4">Welcome to POS Dashboard</h1>

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
                <div className="text-900 font-bold text-xl">$12,345</div>
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
                <div className="text-900 font-bold text-xl">452</div>
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
                <div className="text-900 font-bold text-xl">1,234</div>
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
                <div className="text-900 font-bold text-xl">$45,678</div>
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
