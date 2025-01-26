// src/components/procurement/PaymentAndShipping.jsx
import currency from "../../finance/currency.json";
import toast from "react-hot-toast";

const PaymentAndShipping = ({
  formData,
  handleFormChange,
  handleCurrencyChange,
}) => {
  return (
    <div>
      <h2 className="text-lg font-bold text-blue-400 mb-4">
        Payment & Shipping
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Payment Method:</label>
          <select
            name="PaymentMethod"
            value={formData.PaymentMethod}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-gray-700"
          >
            <option value="">Select Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label>Payment Terms:</label>
          <select
            name="PaymentTerms"
            value={formData.PaymentTerms}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-gray-700"
          >
            <option value="">Select Payment Terms</option>
            <option value="Due on receipt">Due on receipt</option>
            <option value="Net 30 days">Net 30 days</option>
            <option value="Net 45 days">Net 45 days</option>
            <option value="Net 60 days">Net 60 days</option>
          </select>
        </div>
        <div>
          <label>Delivery Address:</label>
          <input
            type="text"
            name="DeliveryAddress"
            value={formData.DeliveryAddress}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>
        <div>
          <label>Shipping Method:</label>
          <select
            name="ShippingMethod"
            value={formData.ShippingMethod}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-gray-700"
          >
            <option value="">Select Shipping Method</option>
            <option value="Air Freight">Air Freight</option>
            <option value="Sea Freight">Sea Freight</option>
            <option value="Land Freight">Land Freight</option>
          </select>
        </div>
        <div>
          <label>Shipping Cost:</label>
          <input
            type="number"
            name="shippingCost"
            value={formData.shippingCost}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-gray-700"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="currency" className="block text-gray-300 font-medium">
            Currency:
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={(e) => {
              if (!formData.supplierId) {
                toast.error(
                  "Please select a supplier before changing the currency."
                );
                return;
              }
              handleCurrencyChange(e);
            }}
            className="w-full p-2 rounded bg-gray-700 text-gray-300"
          >
            <option value="">Select Currency</option>
            {currency.map((cur) => (
              <option key={cur.currencyCode} value={cur.currencyCode}>
                {cur.currencyName} ({cur.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default PaymentAndShipping;
