import { Outlet } from "react-router-dom";
import NavigationGuard from "./components/NavigationGuard";
import "./App.css";

function App() {
  return (
    <NavigationGuard>
      <div className="app-root">
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 1000,
          }}
        ></div>
        <Outlet />
      </div>
    </NavigationGuard>
  );
}

export default App;
