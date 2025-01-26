import { useState } from "react";
import Sidebar from "../layouts/Sidebar";
import EmployeeSignUp from "../../auth/SignUpPage";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../lib/axios";
import areaCode from "./areaCode.json";

const SignupEmployee = ({ authUser }) => {
  const [sendOption, setSendOption] = useState("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+972");

  const registrationUrl = `http://localhost:5173/auth/signup`;

  const handleSend = async () => {
    try {
      if (!authUser) {
        throw new Error("You must be logged in to perform this action.");
      }

      if (sendOption === "email") {
        if (!email) throw new Error("Please enter a valid email address.");

        const response = await axiosInstance.post("/companies/sendSignUp", {
          email,
        });

        console.log("Response:", response.data);
        toast.success("Email sent successfully!");
      } else if (sendOption === "whatsapp") {
        if (!phoneNumber) throw new Error("Please enter a valid phone number.");

        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        const whatsappUrl = `http://api.whatsapp.com/send?phone=${fullPhoneNumber}&text=${encodeURIComponent(
          "Register here: " + registrationUrl
        )}`;
        window.open(whatsappUrl, "_blank");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8">
        <EmployeeSignUp />
        <div className="mt-8">
          <h2>Scan the QR code to access the registration page:</h2>
          <QRCodeSVG value={registrationUrl} size={128} />
        </div>
        <div className="mt-8">
          <h3>Select how to send the registration link:</h3>
          <div className="flex items-center mt-4">
            <label className="mr-4">
              <input
                type="radio"
                name="sendOption"
                value="email"
                checked={sendOption === "email"}
                onChange={() => setSendOption("email")}
              />
              Email
            </label>
            <label className="mr-4">
              <input
                type="radio"
                name="sendOption"
                value="whatsapp"
                checked={sendOption === "whatsapp"}
                onChange={() => setSendOption("whatsapp")}
              />
              WhatsApp
            </label>
          </div>
          {sendOption === "email" && (
            <div className="mt-4">
              <label>
                Email Address:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ml-2 p-2 border rounded"
                />
              </label>
            </div>
          )}
          {sendOption === "whatsapp" && (
            <div className="mt-4">
              <label>
                Phone Number:
                <div className="flex items-center">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="p-2 border rounded mr-2"
                  >
                    {areaCode.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="p-2 border rounded"
                    placeholder="Enter phone number"
                  />
                </div>
              </label>
            </div>
          )}
          <button
            onClick={handleSend}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Send Registration Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupEmployee;
