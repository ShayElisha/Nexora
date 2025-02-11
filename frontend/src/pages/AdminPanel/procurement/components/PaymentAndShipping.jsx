import currency from "../../finance/currency.json";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const PaymentAndShipping = ({
  formData,
  handleFormChange,
  handleCurrencyChange,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-lg font-bold text-primary mb-4">
        {t("procurement.payment_shipping")}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-text mb-2">
            {t("procurement.payment_method")}:
          </label>
          <select
            name="PaymentMethod"
            value={formData.PaymentMethod}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("procurement.select_payment_method")}</option>
            <option value="Cash">{t("procurement.cash")}</option>
            <option value="Credit Card">{t("procurement.credit_card")}</option>
            <option value="Bank Transfer">
              {t("procurement.bank_transfer")}
            </option>
          </select>
        </div>
        <div>
          <label className="block text-text mb-2">
            {t("procurement.payment_terms")}:
          </label>
          <select
            name="PaymentTerms"
            value={formData.PaymentTerms}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("procurement.select_payment_terms")}</option>
            <option value="Due on receipt">
              {t("procurement.due_on_receipt")}
            </option>
            <option value="Net 30 days">{t("procurement.net_30_days")}</option>
            <option value="Net 45 days">{t("procurement.net_45_days")}</option>
            <option value="Net 60 days">{t("procurement.net_60_days")}</option>
          </select>
        </div>
        <div>
          <label className="block text-text mb-2">
            {t("procurement.delivery_address")}:
          </label>
          <input
            type="text"
            name="DeliveryAddress"
            value={formData.DeliveryAddress || ""}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-text mb-2">
            {t("procurement.shipping_method")}:
          </label>
          <select
            name="ShippingMethod"
            value={formData.ShippingMethod}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("procurement.select_shipping_method")}</option>
            <option value="Air Freight">{t("procurement.air_freight")}</option>
            <option value="Sea Freight">{t("procurement.sea_freight")}</option>
            <option value="Land Freight">
              {t("procurement.land_freight")}
            </option>
          </select>
        </div>
        <div>
          <label className="block text-text mb-2">
            {t("procurement.shipping_cost")}:
          </label>
          <input
            type="number"
            name="shippingCost"
            value={formData.shippingCost}
            onChange={handleFormChange}
            className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="currency"
            className="block text-text font-medium mb-2"
          >
            {t("procurement.currency")}:
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={(e) => {
              if (!formData.supplierId) {
                toast.error(t("procurement.please_select_supplier_first"));
                return;
              }
              handleCurrencyChange(e);
            }}
            className="w-full p-2 rounded bg-bg text-text border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("procurement.select_currency")}</option>
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
