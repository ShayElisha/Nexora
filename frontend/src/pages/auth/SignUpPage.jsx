// src/components/auth/SignUpPage.jsx
import { Link } from "react-router-dom";
import SignUpForm from "../../components/auth/SignUpForm";
import { useTranslation } from "react-i18next";

const SignUpPage = () => {
  const { t } = useTranslation(); // שימוש במילון 'signUpPage'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-xl p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto"
            src="https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={t("signupEmployee.signUpPage.logo_alt")}
          />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            {t("signupEmployee.signUpPage.create_account")}
          </h2>
          <p className="text-gray-600">
            {t("signupEmployee.signUpPage.fill_details")}
          </p>
        </div>
        <SignUpForm />
        <p className="mt-4 text-sm text-center text-gray-600">
          {t("signupEmployee.signUpPage.already_have_account")}{" "}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t("signupEmployee.signUpPage.log_in_here")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
