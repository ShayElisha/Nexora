import React from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";
import { useTranslation } from "react-i18next";

const CustomersList = () => {
  const { t } = useTranslation();

  const {
    data: customers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers");
      return res.data.data; // Assuming the data is in res.data.data
    },
  });

  if (isLoading)
    return (
      <div className="min-h-screen bg-bg flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
      </div>
    );
  if (isError)
    return (
      <div className="min-h-screen bg-bg flex justify-center items-center">
        <div className="text-red-500 font-medium text-lg">
          {t("customersList.error_loading_customers")}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center py-10 animate-fade-in">
      <div className="max-w-7xl mx-auto p-6 sm:p-8 w-full">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text mb-8 tracking-tight drop-shadow-md text-center">
          {t("customersList.title")}
        </h1>
        {customers.length === 0 ? (
          <p className="text-text opacity-70 text-center italic">
            {t("customersList.no_customers_found")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <div
                key={customer._id}
                className="bg-bg rounded-xl shadow-md flex flex-col transition-transform hover:scale-105 hover:shadow-lg"
              >
                <div className="p-5 border-b border-border-color">
                  <h2 className="text-xl font-semibold text-text truncate">
                    {customer.name || t("customersList.unnamed_customer")}
                  </h2>
                  <p className="text-sm text-text opacity-70">
                    {customer.email || t("customersList.no_email")}
                  </p>
                </div>
                <div className="p-5 flex-grow">
                  <div className="grid grid-cols-2 gap-4 text-sm text-text">
                    <div>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.phone")}
                        </strong>{" "}
                        {customer.phone || t("customersList.not_available")}
                      </p>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.company")}
                        </strong>{" "}
                        {customer.company || t("customersList.not_available")}
                      </p>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.website")}
                        </strong>{" "}
                        {customer.website || t("customersList.not_available")}
                      </p>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.industry")}
                        </strong>{" "}
                        {customer.industry || t("customersList.not_available")}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.status")}
                        </strong>{" "}
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            customer.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {customer.status || t("customersList.not_available")}
                        </span>
                      </p>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.type")}
                        </strong>{" "}
                        {customer.customerType ||
                          t("customersList.not_available")}
                      </p>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.customer_since")}
                        </strong>{" "}
                        {customer.customerSince
                          ? new Date(
                              customer.customerSince
                            ).toLocaleDateString()
                          : t("customersList.not_available")}
                      </p>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.last_contacted")}
                        </strong>{" "}
                        {customer.lastContacted
                          ? new Date(
                              customer.lastContacted
                            ).toLocaleDateString()
                          : t("customersList.not_available")}
                      </p>
                    </div>
                  </div>
                  {customer.customerType === "Individual" && (
                    <div className="mt-4 text-sm text-text">
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.DOB")}
                        </strong>{" "}
                        {customer.dateOfBirth
                          ? new Date(customer.dateOfBirth).toLocaleDateString()
                          : t("customersList.not_available")}
                      </p>
                      <p>
                        <strong className="font-semibold">
                          {t("customersList.gender")}
                        </strong>{" "}
                        {customer.gender || t("customersList.not_available")}
                      </p>
                    </div>
                  )}
                  {customer.contacts && customer.contacts.length > 0 && (
                    <div className="mt-4 text-sm text-text">
                      <p className="font-semibold">
                        {t("customersList.contacts")}
                      </p>
                      <ul className="list-disc list-inside opacity-80">
                        {customer.contacts.map((contact, index) => (
                          <li key={index}>
                            {contact.name}{" "}
                            {contact.position && `- ${contact.position}`}{" "}
                            {contact.email && `(${contact.email})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {customer.notes && (
                    <p className="mt-4 text-sm text-text opacity-80">
                      <strong className="font-semibold">
                        {t("customersList.notes")}
                      </strong>{" "}
                      {customer.notes}
                    </p>
                  )}
                </div>
                <div className="p-5 border-t border-border-color flex justify-end">
                  <button className="px-4 py-2 bg-button-bg text-button-text rounded-full shadow-md hover:bg-secondary transition-all duration-200">
                    {t("customersList.view_details")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CustomersList;
