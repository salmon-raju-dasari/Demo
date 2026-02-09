// Menu configuration for POS software
export const menuItems = [
  {
    label: "Dashboard",
    icon: "pi pi-home",
    to: "/dashboard",
  },
  {
    label: "Products",
    icon: "pi pi-shopping-bag",
    items: [
      {
        label: "All Products",
        icon: "pi pi-list",
        to: "/products",
      },
      {
        label: "Add Product",
        icon: "pi pi-plus-circle",
        to: "/products/add",
      },
      {
        label: "Categories",
        icon: "pi pi-tags",
        to: "/products/categories",
      },
      {
        label: "Unit Management",
        icon: "pi pi-directions",
        to: "/units",
      },
    ],
  },
  {
    label: "Sales",
    icon: "pi pi-shopping-cart",
    items: [
      {
        label: "New Sale",
        icon: "pi pi-plus",
        to: "/sales",
      },
      {
        label: "Sales History",
        icon: "pi pi-history",
        to: "/sales/history",
      },
    ],
  },
  {
    label: "Inventory",
    icon: "pi pi-box",
    to: "/inventory",
  },
  {
    label: "Employees",
    icon: "pi pi-id-card",
    to: "/employees",
  },
  {
    label: "Custom Labels",
    icon: "pi pi-tags",
    to: "/custom-labels",
  },
  {
    label: "Business Management",
    icon: "pi pi-building",
    to: "/business",
  },
  {
    label: "Store Management",
    icon: "pi pi-map-marker",
    to: "/stores",
  },
  {
    label: "Customers",
    icon: "pi pi-users",
    items: [
      {
        label: "All Customers",
        icon: "pi pi-list",
        to: "/customers",
      },
      {
        label: "Add Customer",
        icon: "pi pi-user-plus",
        to: "/customers/add",
      },
    ],
  },
  {
    label: "Reports",
    icon: "pi pi-chart-bar",
    items: [
      {
        label: "Sales Report",
        icon: "pi pi-chart-line",
        to: "/reports/sales",
      },
      {
        label: "Inventory Report",
        icon: "pi pi-chart-pie",
        to: "/reports/inventory",
      },
    ],
  },
  {
    label: "Settings",
    icon: "pi pi-cog",
    to: "/settings",
  },
];
