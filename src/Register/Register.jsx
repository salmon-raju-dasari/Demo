import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
export default function Register() {
  const navigate = useNavigate();
  return (
    <>
      <div>
        <Card
          title="Register"
          className="sm:max-w-100 w-[90%] m-auto mt-6 p-2 border-round-lg shadow-2"
        >
          <InputText placeholder="Username" className="w-full mb-3"></InputText>
          <InputText
            placeholder="Mobile Number"
            className="w-full mb-3"
          ></InputText>
          <InputText placeholder="Email" className="w-full mb-3"></InputText>
          <InputText placeholder="City" className="w-full mb-3"></InputText>
          <InputText placeholder="Address" className="w-full mb-3"></InputText>
          <InputText placeholder="Password" className="w-full mb-3"></InputText>
          <Button label="Register" className="w-full mt-3" />
          <Button
            label="Login"
            className="w-full mt-3"
            onClick={() => navigate("/")}
          />
        </Card>
      </div>
    </>
  );
}
