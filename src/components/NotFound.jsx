import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex align-items-center justify-content-center min-h-screen bg-gray-100">
      <div className="text-center p-5">
        <div className="mb-4">
          <i
            className="pi pi-exclamation-triangle"
            style={{ fontSize: "5rem", color: "#f59e0b" }}
          ></i>
        </div>
        <h1 className="text-6xl font-bold text-900 mb-3">404</h1>
        <h2 className="text-3xl font-semibold text-700 mb-4">Page Not Found</h2>
        <p className="text-xl text-600 mb-5">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-content-center">
          <Button
            label="Go to Dashboard"
            icon="pi pi-home"
            onClick={() => navigate("/dashboard")}
            className="p-button-lg"
          />
          <Button
            label="Go Back"
            icon="pi pi-arrow-left"
            onClick={() => navigate(-1)}
            className="p-button-outlined p-button-lg"
          />
        </div>
      </div>
    </div>
  );
};
