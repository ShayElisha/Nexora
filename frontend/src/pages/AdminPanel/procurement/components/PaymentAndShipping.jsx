import currency from "../../finance/currency.json";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const PaymentAndShipping = ({
  formData,
  handleFormChange,
  handleCurrencyChange,
  handleShippingAddressChange,
  addressMode,
  onAddressModeChange,
  warehouses = [],
  selectedWarehouseId,
  onSelectWarehouse,
}) => {
  const { t } = useTranslation();
  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

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

      <div className="mt-8 space-y-4">
        <h3 className="text-base font-semibold text-primary">
          {t("procurement.shipping_address_details", {
            defaultValue: "Shipping Address",
          })}
        </h3>
        <div className="flex flex-wrap gap-4 text-sm text-text">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="addressMode"
              value="warehouse"
              checked={addressMode === "warehouse"}
              onChange={() => onAddressModeChange("warehouse")}
              disabled={!warehouses.length}
            />
            {t("procurement.address_mode_warehouse", {
              defaultValue: "Use existing warehouse",
            })}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="addressMode"
              value="manual"
              checked={addressMode === "manual"}
              onChange={() => onAddressModeChange("manual")}
            />
            {t("procurement.address_mode_manual", {
              defaultValue: "Enter address manually",
            })}
          </label>
          {!warehouses.length && (
            <span className="text-xs text-amber-600">
              {t("procurement.no_warehouses_available", {
                defaultValue: "No warehouses available yet. Please use manual entry.",
              })}
            </span>
          )}
        </div>

        <div>
          {addressMode === "warehouse" ? (
            <div className="space-y-3">
              <label className="block text-text mb-1">
                {t("procurement.select_warehouse_address", {
                  defaultValue: "Select warehouse",
                })} <span className="text-red-500">*</span>
              </label>
              {warehouses.length ? (
                <>
                  <select
                    value={selectedWarehouseId || ""}
                    onChange={(e) => onSelectWarehouse(e.target.value)}
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">
                      {t("procurement.choose_warehouse_option", {
                        defaultValue: "Choose warehouse",
                      })}
                    </option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                        {warehouse.region ? ` (${warehouse.region})` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedWarehouse?.address && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm text-text">
                      <p className="font-medium">{selectedWarehouse.name}</p>
                      <p>
                        {[
                          selectedWarehouse.address.street,
                          selectedWarehouse.address.city,
                          selectedWarehouse.address.state,
                          selectedWarehouse.address.zipCode,
                          selectedWarehouse.address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {(selectedWarehouse.address.contactName ||
                        selectedWarehouse.address.contactPhone) && (
                        <p className="mt-1 text-gray-600">
                          {selectedWarehouse.address.contactName && (
                            <>
                              {t("procurement.contact_name", {
                                defaultValue: "Contact Name",
                              })}
                              : {selectedWarehouse.address.contactName}
                            </>
                          )}
                          {selectedWarehouse.address.contactPhone && (
                            <>
                              {" "}
                              |{" "}
                              {t("procurement.contact_phone", {
                                defaultValue: "Contact Phone",
                              })}
                              : {selectedWarehouse.address.contactPhone}
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  {t("procurement.no_warehouses_available", {
                    defaultValue: "No warehouses available yet. Please create one first.",
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* בחירת מחסן גם בכתובת ידנית - חובה */}
              {warehouses.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-text mb-1">
                    {t("procurement.select_warehouse", {
                      defaultValue: "Select warehouse",
                    })} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedWarehouseId || ""}
                    onChange={(e) => onSelectWarehouse(e.target.value)}
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">
                      {t("procurement.choose_warehouse_option", {
                        defaultValue: "Choose warehouse",
                      })}
                    </option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                        {warehouse.region ? ` (${warehouse.region})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text mb-2">
                    {t("procurement.street", { defaultValue: "Street" })} *
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.street || ""}
                    onChange={(e) => handleShippingAddressChange("street", e.target.value)}
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                    required={addressMode === "manual"}
                  />
                </div>
                <div>
                  <label className="block text-text mb-2">
                    {t("procurement.city", { defaultValue: "City" })} *
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.city || ""}
                    onChange={(e) => handleShippingAddressChange("city", e.target.value)}
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                    required={addressMode === "manual"}
                  />
                </div>
                <div>
                  <label className="block text-text mb-2">
                    {t("procurement.state", { defaultValue: "State/Region" })}
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.state || ""}
                    onChange={(e) => handleShippingAddressChange("state", e.target.value)}
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-text mb-2">
                    {t("procurement.zip_code", {
                      defaultValue: "ZIP / Postal Code",
                    })}
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.zipCode || ""}
                    onChange={(e) => handleShippingAddressChange("zipCode", e.target.value)}
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-text mb-2">
                    {t("procurement.country", { defaultValue: "Country" })}
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.country || ""}
                    onChange={(e) => handleShippingAddressChange("country", e.target.value)}
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                    required={addressMode === "manual"}
                  />
                </div>
                <div>
                  <label className="block text-text mb-2">
                    {t("procurement.contact_name", {
                      defaultValue: "Contact Name",
                    })}
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.contactName || ""}
                    onChange={(e) =>
                      handleShippingAddressChange("contactName", e.target.value)
                    }
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-text mb-2">
                    {t("procurement.contact_phone", {
                      defaultValue: "Contact Phone",
                    })}
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.contactPhone || ""}
                    onChange={(e) =>
                      handleShippingAddressChange("contactPhone", e.target.value)
                    }
                    className="w-full p-2 rounded bg-bg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-text mt-4">
          {t("procurement.formatted_address", {
            defaultValue: "Formatted Address",
          })}
          :{" "}
          <span className="font-semibold">
            {formData.DeliveryAddress ||
              t("procurement.address_placeholder", {
                defaultValue: "Address will be generated automatically",
              })}
          </span>
        </p>
      </div>
    </div>
  );
};


export default PaymentAndShipping;
