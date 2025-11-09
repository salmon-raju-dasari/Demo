import { Outlet } from "react-router-dom";
import "./App.css";

function App() {
  return (
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
  );
}

export default App;
