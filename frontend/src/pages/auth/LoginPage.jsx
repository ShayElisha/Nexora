import { Link } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-36 sm:px-6 lg:px-8 bg-bg relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-secondary to-accent opacity-10 animate-fadeIn"></div>
      <div className="w-full max-w-md p-6 space-y-6 bg-bg rounded-lg shadow-lg border border-border-color animate-fadeIn">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto rounded-full border-2 border-button-text shadow-md"
            src="https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={t("auth.logo_alt")}
          />
          <h2 className="mt-4 text-2xl font-extrabold text-text sm:text-3xl">
            {t("auth.welcome_back")}
          </h2>
          <p className="text-secondary">{t("auth.please_login")}</p>
        </div>
        <LoginForm />
        <p className="mt-4 text-sm text-center text-secondary">
          {t("auth.not_registered")}{" "}
          <Link
            to="/create-company"
            className="font-medium text-primary hover:text-accent transition-colors duration-200"
          >
            {t("auth.sign_up_here")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
