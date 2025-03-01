import React from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../../../lib/axios";

const CustomersList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axiosInstance.get("/customers");
      return res.data.data; // הנחה: הנתונים נמצאים ב-res.data.data
    },
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-red-500">Error fetching customers</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Customers List
      </h1>
      <div className="container mx-auto px-4">
        {/* Responsive grid: 1 column on small screens, 2 on medium, 3 on large */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((customer) => (
            <div
              key={customer._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition duration-300"
            >
              <div className="p-6">
                {/* חלק 1: מידע בסיסי */}
                <div className="mb-4 border-b pb-2">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {customer.name}
                  </h2>
                  <p className="text-sm text-gray-500">{customer.email}</p>
                  <p className="text-sm text-gray-500">
                    {customer.phone || "No phone"}
                  </p>
                </div>
                {/* חלק 2: פרטי חברה וסטטוס */}
                <div className="mb-4 border-b pb-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Company:</span>{" "}
                    {customer.company || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Website:</span>{" "}
                    {customer.website || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Industry:</span>{" "}
                    {customer.industry || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Status:</span>{" "}
                    {customer.status}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Type:</span>{" "}
                    {customer.customerType}
                  </p>
                </div>
                {/* חלק 3: פרטים נוספים */}
                <div>
                  {customer.customerType === "Individual" && (
                    <>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">DOB:</span>{" "}
                        {customer.dateOfBirth
                          ? new Date(customer.dateOfBirth).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Gender:</span>{" "}
                        {customer.gender || "N/A"}
                      </p>
                    </>
                  )}
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Preferred Contact:</span>{" "}
                    {customer.preferredContactMethod || "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Last Contacted:</span>{" "}
                    {customer.lastContacted
                      ? new Date(customer.lastContacted).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Customer Since:</span>{" "}
                    {customer.customerSince
                      ? new Date(customer.customerSince).toLocaleDateString()
                      : "N/A"}
                  </p>
                  {customer.contacts && customer.contacts.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-800">
                        Contacts:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700">
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
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {customer.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomersList;
