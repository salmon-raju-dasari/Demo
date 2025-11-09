import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

// Core styles
// theme is loaded by ThemeProvider dynamically
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
// App is mounted via RouteConfig
import { PrimeReactProvider } from "primereact/api";
import RouteConfig from "./RouteConfig.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PrimeReactProvider>
        <RouteConfig />
      </PrimeReactProvider>
    </BrowserRouter>
  </StrictMode>
);
