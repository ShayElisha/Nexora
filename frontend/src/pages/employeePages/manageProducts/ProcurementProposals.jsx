import React, { useState, useEffect } from "react";
import axiosInstance from "../../../lib/axios";
import { toast } from "react-hot-toast";

const ProcurementProposals = () => {
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
        toast.error("אירעה שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        productName: selectedProduct.productName || "N/A",
        sku: selectedProduct.sku || "N/A",
        category: selectedProduct.category || "N/A",
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
        sku: "N/A",
        category: "N/A",
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
          sku: "N/A",
          category: "N/A",
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
        productName: item.productName || "N/A",
        sku: item.sku || "N/A",
        category: item.category || "N/A",
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
      toast.success("ההצעה נוצרה בהצלחה");
    } catch (error) {
      toast.error("אירעה שגיאה ביצירת ההצעה");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">טוען הצעות...</div>;
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">הצעות רכש</h1>

      {/* טופס ליצירת הצעת רכש חדשה */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          צור הצעת רכש חדשה
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              כותרת:
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={newProposal.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2
                         focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              תיאור:
            </label>
            <textarea
              id="description"
              name="description"
              value={newProposal.description}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2
                         focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* מערך הפריטים */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              מוצרים לרכישה
            </h3>
            {newProposal.items.map((item, index) => (
              <div
                key={index}
                className="mb-4 p-4 border border-gray-200 rounded-md"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    בחר מוצר קיים (purchase/both) או השאר ליצירת חדש:
                  </label>
                  <select
                    value={item.productId || ""}
                    onChange={(e) => handleProductSelect(index, e)}
                    className="mt-1 block w-full border border-gray-300
                               rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- מוצר חדש / לא מוגדר --</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.productName} - SKU: {product.sku || "N/A"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* עריכת שם המוצר רק אם הוא חדש */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    שם מוצר:
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={item.productName}
                    onChange={(e) => handleItemChange(index, e)}
                    disabled={!item.isNew} // לא ניתן לערוך אם נבחר מוצר קיים
                    className="mt-1 block w-full border border-gray-300
                               rounded-md p-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:bg-gray-100"
                  />
                </div>

                {/* עריכת SKU רק אם הוא חדש */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    SKU:
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={item.sku}
                    onChange={(e) => handleItemChange(index, e)}
                    disabled={!item.isNew}
                    className="mt-1 block w-full border border-gray-300
                               rounded-md p-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:bg-gray-100"
                  />
                </div>

                {/* עריכת Category רק אם הוא חדש */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    קטגוריה:
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={item.category}
                    onChange={(e) => handleItemChange(index, e)}
                    disabled={!item.isNew}
                    className="mt-1 block w-full border border-gray-300
                               rounded-md p-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:bg-gray-100"
                  />
                </div>

                {/* מחיר וכמות */}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    מחיר יחידה:
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, e)}
                    min="0"
                    className="mt-1 block w-full border border-gray-300
                               rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    כמות:
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    min="1"
                    className="mt-1 block w-full border border-gray-300
                               rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="mt-2 text-red-600 hover:text-red-800"
                >
                  הסר מוצר
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 hover:text-blue-800"
            >
              הוסף מוצר לרכישה
            </button>
          </div>

          <div>
            <label
              htmlFor="expectedDeliveryDate"
              className="block text-sm font-medium text-gray-700"
            >
              תאריך אספקה צפוי:
            </label>
            <input
              id="expectedDeliveryDate"
              type="date"
              name="expectedDeliveryDate"
              value={newProposal.expectedDeliveryDate}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300
                         rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              הערות:
            </label>
            <textarea
              id="notes"
              name="notes"
              value={newProposal.notes}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2
                         focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="attachments"
              className="block text-sm font-medium text-gray-700"
            >
              קבצים מצורפים (URL מפריד בפסיק):
            </label>
            <input
              id="attachments"
              type="text"
              name="attachments"
              value={newProposal.attachments}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300
                         rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            צור הצעה
          </button>
        </form>
      </section>

      {/* הצגת הצעות קיימות */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          הצעות קיימות
        </h2>
        {proposals.length === 0 ? (
          <p className="text-gray-500">אין הצעות להצגה</p>
        ) : (
          <ul className="space-y-6">
            {proposals.map((proposal) => (
              <li
                key={proposal._id}
                className="p-4 border border-gray-200 rounded-md"
              >
                <h3 className="text-xl font-medium text-gray-800">
                  {proposal.title || "ללא כותרת"}
                </h3>
                <p className="text-gray-600">
                  {proposal.description || "ללא תיאור"}
                </p>
                <p className="text-gray-700">
                  <strong>סטטוס:</strong> {proposal.status || "לא מוגדר"}
                </p>
                <p className="text-gray-700">
                  <strong>סכום משוער:</strong>{" "}
                  {proposal.totalEstimatedCost?.toLocaleString() || 0} ₪
                </p>

                {/* פריטים במערך */}
                <div className="mt-2">
                  <strong className="text-gray-700">מוצרים לרכישה:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {Array.isArray(proposal.items) &&
                    proposal.items.length > 0 ? (
                      proposal.items.map((item, idx) => (
                        <li key={idx} className="text-gray-600">
                          {item.productName} (SKU: {item.sku}) | קטגוריה:{" "}
                          {item.category} | כמות: {item.quantity} | מחיר יחידה:{" "}
                          {item.unitPrice} ₪ | סכום לפריט: {item.total} ₪
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">אין מוצרים לרכישה</li>
                    )}
                  </ul>
                </div>

                {proposal.expectedDeliveryDate &&
                  !isNaN(new Date(proposal.expectedDeliveryDate).getTime()) && (
                    <p className="text-gray-700">
                      <strong>תאריך אספקה צפוי:</strong>{" "}
                      {new Date(
                        proposal.expectedDeliveryDate
                      ).toLocaleDateString()}
                    </p>
                  )}

                {proposal.notes && (
                  <p className="text-gray-700">
                    <strong>הערות:</strong> {proposal.notes}
                  </p>
                )}

                {Array.isArray(proposal.attachments) &&
                  proposal.attachments.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-gray-700">קבצים מצורפים:</strong>
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
