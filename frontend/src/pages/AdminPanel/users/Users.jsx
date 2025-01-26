import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../lib/axios";
import Sidebar from "../layouts/Sidebar";

const Users = () => {
  // Fetch users using useQuery
  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await axiosInstance.get("/employees");
      return response.data.data;
    },
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="container mx-auto max-w-6xl bg-gray-800 p-6 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
            Users List
          </h1>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-white">Loading...</p>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              {error.message || "Failed to load users"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-900 text-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="py-2 px-4">Profile Image</th>
                    <th className="py-2 px-4">Name</th>
                    <th className="py-2 px-4">Last Name</th>
                    <th className="py-2 px-4">Email</th>
                    <th className="py-2 px-4">Phone</th>
                    <th className="py-2 px-4">Role</th>
                    <th className="py-2 px-4">Address</th>
                    <th className="py-2 px-4">Projects</th>
                    <th className="py-2 px-4">Performance Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.email} className="border-b border-gray-700">
                      <td className="py-2 px-4">
                        <img
                          src={user.profileImage}
                          alt={`${user.name} ${user.lastName}`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </td>
                      <td className="py-2 px-4">{user.name}</td>
                      <td className="py-2 px-4">{user.lastName}</td>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">{user.phone}</td>
                      <td className="py-2 px-4">{user.role}</td>
                      <td className="py-2 px-4">
                        {user.address?.deletedAt ? "Deleted" : "Active"}
                      </td>
                      <td className="py-2 px-4">
                        {user.projects.length > 0
                          ? user.projects.join(", ")
                          : "No Projects"}
                      </td>
                      <td className="py-2 px-4">
                        {user.performanceReviews.length > 0
                          ? `${user.performanceReviews.length} Reviews`
                          : "No Reviews"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
