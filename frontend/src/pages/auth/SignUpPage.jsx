import { Link } from "react-router-dom";
import SignUpForm from "../../components/auth/SignUpForm";

const SignUpPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-xl p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto"
            src="https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Your Logo"
          />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Create Your Account
          </h2>
          <p className="text-gray-600">Fill in the details to sign up</p>
        </div>
        <SignUpForm />
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
