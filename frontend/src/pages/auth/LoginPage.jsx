import { Link } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <div className="h-min flex flex-col items-center justify-center py-36 sm:px-6 lg:px-8 bg-gray-700">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto"
            src="https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={t("auth.logo_alt")}
          />
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
            {t("auth.welcome_back")}
          </h2>
          <p className="text-gray-600">{t("auth.please_login")}</p>
        </div>
        <LoginForm />
        <p className="mt-4 text-sm text-center text-gray-600">
          {t("auth.not_registered")}{" "}
          <Link
            to="/create-company"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t("auth.sign_up_here")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
