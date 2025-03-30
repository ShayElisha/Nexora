import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const ProcurementProposals = () => {
  const { t } = useTranslation();

  // נניח ש-companyId ידוע; ניתן להחליף בערך דינמי מטוקן/מצב אחר
  const [newProposal, setNewProposal] = useState({
    companyId: "6759df2af3a4aa882f571bfa",
    title: "",
    description: "",
    items: [],
    expectedDeliveryDate: "",
    notes: "",
    attachments: "",
  });

  const [proposals, setProposals] = useState([]);
  const [products, setProducts] = useState([]); // מוצרים מסוג purchase או both
  const [loading, setLoading] = useState(true);

  // שליפת הצעות ומוצרים
  useEffect(() => {
    const fetchData = async () => {
      try {
        // שליפת הצעות רכש
        const proposalsResponse = await axiosInstance.get("/proposals");
        setProposals(
          Array.isArray(proposalsResponse.data) ? proposalsResponse.data : []
        );

        // שליפת מוצרים וסינון
        const productsResponse = await axiosInstance.get("/product");
        const allProducts = Array.isArray(productsResponse.data?.data)
          ? productsResponse.data.data
          : [];
        // מוצרים לסוג רכישה או "both"
        const filteredProducts = allProducts.filter(
          (prod) =>
            prod.productType === "purchase" || prod.productType === "both"
        );
        setProducts(filteredProducts);
      } catch (error) {
        setProposals([]);
        setProducts([]);
        toast.error(t("procurement.error_loading_data"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // עדכון שדה טקסט פשוט בטופס
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProposal((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // עדכון שדות בפריטים (quantity, unitPrice וכד')
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...newProposal.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]:
        name === "quantity" || name === "unitPrice" ? Number(value) : value,
    };
    setNewProposal((prev) => ({ ...prev, items: updatedItems }));
  };

  // בחירת מוצר קיים מרשימה -> ממלא פרטי SKU, Category וכו'
  const handleProductSelect = (index, e) => {
    const productId = e.target.value;
    const selectedProduct = products.find((p) => p._id === productId);
    const updatedItems = [...newProposal.items];

    if (selectedProduct) {
      updatedItems[index] = {
        ...updatedItems[index],
        productId: selectedProduct._id,
        productName:
          selectedProduct.productName || t("procurement.not_available"),
        sku: selectedProduct.sku || t("procurement.not_available"),
        category: selectedProduct.category || t("procurement.not_available"),
        unitPrice: selectedProduct.unitPrice || 0,
        // נשאיר quantity כמו שהמשתמש הגדיר, או 1 כברירת מחדל
        quantity: updatedItems[index].quantity || 1,
        // total יחושב בסוף לפי quantity * unitPrice
        isNew: false,
      };
    } else {
      // אם המשתמש בחר "לא להגדיר" -> מוצר חדש
      updatedItems[index] = {
        ...updatedItems[index],
        productId: null,
        productName: "",
        sku: t("procurement.not_available"),
        category: t("procurement.not_available"),
        unitPrice: 0,
        isNew: true,
      };
    }

    setNewProposal((prev) => ({ ...prev, items: updatedItems }));
  };

  // הוספת פריט חדש
  const addItem = () => {
    setNewProposal((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: null,
          productName: "",
          sku: t("procurement.not_available"),
          category: t("procurement.not_available"),
          unitPrice: 0,
          quantity: 1,
          isNew: true,
        },
      ],
    }));
  };

  // הסרת פריט
  const removeItem = (index) => {
    const updatedItems = [...newProposal.items];
    updatedItems.splice(index, 1);
    setNewProposal((prev) => ({ ...prev, items: updatedItems }));
  };

  // שליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    // המרת המחרוזת למערך של קישורים
    const attachmentsArray = newProposal.attachments
      ? newProposal.attachments
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url)
      : [];

    // הכנת הנתונים לשליחה (חישוב total לכל פריט)
    const proposalData = {
      ...newProposal,
      items: newProposal.items.map((item) => ({
        productId: item.productId || null,
        productName: item.productName || t("procurement.not_available"),
        sku: item.sku || t("procurement.not_available"),
        category: item.category || t("procurement.not_available"),
        unitPrice: item.unitPrice || 0,
        quantity: item.quantity || 0,
        // חישוב total לפי כמות * מחיר
        total: (item.quantity || 0) * (item.unitPrice || 0),
      })),
      attachments: attachmentsArray,
      expectedDeliveryDate: newProposal.expectedDeliveryDate
        ? new Date(newProposal.expectedDeliveryDate)
        : undefined,
    };

    try {
      const response = await axiosInstance.post("/proposals", proposalData);
      setProposals([...proposals, response.data]);
      // איפוס הטופס, שמירת ה-companyId
      setNewProposal({
        companyId: newProposal.companyId,
        title: "",
        description: "",
        items: [],
        expectedDeliveryDate: "",
        notes: "",
        attachments: "",
      });
      toast.success(t("procurement.proposal_created_successfully"));
    } catch (error) {
      toast.error(t("procurement.error_creating_proposal"));
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500">
        {t("procurement.loading_proposals")}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-8 bg-bg rounded-2xl shadow-2xl border border-border-color transform transition-all duration-500 hover:shadow-3xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {t("procurement.proposals")}
      </h1>

      {/* טופס ליצירת הצעת רכש חדשה */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          {t("procurement.create_new_proposal")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              {t("procurement.title")}:
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={newProposal.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              {t("procurement.description")}:
            </label>
            <textarea
              id="description"
              name="description"
              value={newProposal.description}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* מערך הפריטים */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {t("procurement.products_to_purchase")}
            </h3>
            {newProposal.items.map((item, index) => (
              <div
                key={index}
                className="mb-4 p-4 border border-gray-200 rounded-md"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("procurement.select_existing_product_or_create_new")}
                  </label>
                  <select
                    value={item.productId || ""}
                    onChange={(e) => handleProductSelect(index, e)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">
                      {t("procurement.new_or_undefined_product")}
                    </option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.productName} - {t("procurement.sku")}:{" "}
                        {product.sku || t("procurement.not_available")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* עריכת שם המוצר רק אם הוא חדש */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("procurement.product_name")}:
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={item.productName}
                    onChange={(e) => handleItemChange(index, e)}
                    disabled={!item.isNew}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* עריכת SKU רק אם הוא חדש */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("procurement.sku")}:
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={item.sku}
                    onChange={(e) => handleItemChange(index, e)}
                    disabled={!item.isNew}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* עריכת Category רק אם הוא חדש */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("procurement.category")}:
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={item.category}
                    onChange={(e) => handleItemChange(index, e)}
                    disabled={!item.isNew}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* מחיר וכמות */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("procurement.unit_price")}:
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, e)}
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("procurement.quantity")}:
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="mt-2 text-red-600 hover:text-red-800"
                >
                  {t("procurement.remove_product")}
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 hover:text-blue-800"
            >
              {t("procurement.add_product_to_purchase")}
            </button>
          </div>

          <div>
            <label
              htmlFor="expectedDeliveryDate"
              className="block text-sm font-medium text-gray-700"
            >
              {t("procurement.expected_delivery_date")}:
            </label>
            <input
              id="expectedDeliveryDate"
              type="date"
              name="expectedDeliveryDate"
              value={newProposal.expectedDeliveryDate}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              {t("procurement.notes")}:
            </label>
            <textarea
              id="notes"
              name="notes"
              value={newProposal.notes}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="attachments"
              className="block text-sm font-medium text-gray-700"
            >
              {t("procurement.attachments")} (
              {t("procurement.attachments_hint")}):
            </label>
            <input
              id="attachments"
              type="text"
              name="attachments"
              value={newProposal.attachments}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t("procurement.create_proposal")}
          </button>
        </form>
      </section>

      {/* הצגת הצעות קיימות */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          {t("procurement.existing_proposals")}
        </h2>
        {proposals.length === 0 ? (
          <p className="text-gray-500">{t("procurement.no_proposals")}</p>
        ) : (
          <ul className="space-y-6">
            {proposals.map((proposal) => (
              <li
                key={proposal._id}
                className="p-4 border border-gray-200 rounded-md"
              >
                <h3 className="text-xl font-medium text-gray-800">
                  {proposal.title || t("procurement.no_title")}
                </h3>
                <p className="text-gray-600">
                  {proposal.description || t("procurement.no_description")}
                </p>
                <p className="text-gray-700">
                  <strong>{t("procurement.status")}:</strong>{" "}
                  {proposal.status || t("procurement.not_defined")}
                </p>
                <p className="text-gray-700">
                  <strong>{t("procurement.estimated_cost")}:</strong>{" "}
                  {proposal.totalEstimatedCost?.toLocaleString() || 0} ₪
                </p>

                {/* פריטים במערך */}
                <div className="mt-2">
                  <strong className="text-gray-700">
                    {t("procurement.products_to_purchase")}:
                  </strong>
                  <ul className="list-disc pl-5 mt-1">
                    {Array.isArray(proposal.items) &&
                    proposal.items.length > 0 ? (
                      proposal.items.map((item, idx) => (
                        <li key={idx} className="text-gray-600">
                          {item.productName} ( {t("procurement.sku")}:{" "}
                          {item.sku} ) | {t("procurement.category")}:{" "}
                          {item.category} | {t("procurement.quantity")}:{" "}
                          {item.quantity} | {t("procurement.unit_price")}:{" "}
                          {item.unitPrice} ₪ | {t("procurement.item_total")}:{" "}
                          {item.total} ₪
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">
                        {t("procurement.no_products")}
                      </li>
                    )}
                  </ul>
                </div>

                {proposal.expectedDeliveryDate &&
                  !isNaN(new Date(proposal.expectedDeliveryDate).getTime()) && (
                    <p className="text-gray-700">
                      <strong>
                        {t("procurement.expected_delivery_date")}:
                      </strong>{" "}
                      {new Date(
                        proposal.expectedDeliveryDate
                      ).toLocaleDateString()}
                    </p>
                  )}

                {proposal.notes && (
                  <p className="text-gray-700">
                    <strong>{t("procurement.notes")}:</strong> {proposal.notes}
                  </p>
                )}

                {Array.isArray(proposal.attachments) &&
                  proposal.attachments.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-gray-700">
                        {t("procurement.attachments")}:
                      </strong>
                      <ul className="list-disc pl-5 mt-1">
                        {proposal.attachments.map((url, idx) => (
                          <li key={idx}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProcurementProposals;
