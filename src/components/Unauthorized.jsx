import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex align-items-center justify-content-center min-h-screen">
      <div className="text-center">
        <i className="pi pi-lock text-6xl text-yellow-500 mb-4"></i>
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg mb-4">
          You don't have permission to access this page
        </p>
        <Button
          label="Go Back"
          icon="pi pi-arrow-left"
          onClick={() => navigate("/profile")}
        />
      </div>
    </div>
  );
};
