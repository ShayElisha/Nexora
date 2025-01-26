import { Link } from "react-router-dom";
import CreateCompanyForm from "../../components/company/CreateCompanyForm";

const CreateCompanyPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img
          className="mx-auto size-36 border-4 border-white rounded-full shadow-lg"
          src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Nexora"
        />
        <h2 className="text-3xl font-extrabold text-zinc-900 mt-4">
          Start your company journey
        </h2>
      </div>

      {/* Form Section */}
      <div className="mt-8 w-full sm:w-full sm:max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10">
          <CreateCompanyForm />
          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-900"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-zinc-900">
                  Already have a company?
                </span>
              </div>
            </div>

            {/* Link to Login */}
            <div className="mt-6 flex justify-center">
              <Link
                to="/login"
                className="w-full max-w-xs flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-900"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyPage;
