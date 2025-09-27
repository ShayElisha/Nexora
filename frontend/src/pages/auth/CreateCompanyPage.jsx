import { Link } from "react-router-dom";
import CreateCompanyForm from "../../components/company/CreateCompanyForm";
import { useTranslation } from "react-i18next";

const CreateCompanyPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg animate-fadeIn">
      {/* Header Section */}
      <div
        className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-fadeIn"
        style={{ animationDelay: "0.1s" }}
      >
        <img
          className="mx-auto size-36 border-4 border-button-text rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
          src="../../../public/assets/logo.png"

          alt={t("company.logo_alt")}
        />
        <h2 className="mt-6 text-3xl font-extrabold text-text sm:text-4xl">
          {t("company.start_journey")}
        </h2>
        <p className="mt-2 text-sm text-secondary">
          {t("company.subtitle") || "Create your company and get started!"}
        </p>
      </div>

      {/* Form Section */}
      <div
        className="mt-10 w-full sm:w-full sm:max-w-4xl px-4 sm:px-6 lg:px-8 animate-fadeIn"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="bg-bg py-10 px-6 shadow-lg border border-border-color sm:rounded-lg sm:px-12 transition-all duration-300 hover:shadow-xl">
          <CreateCompanyForm />
          {/* Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-color"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-bg text-text font-medium">
                  {t("company.already_have")}
                </span>
              </div>
            </div>

            {/* Link to Login */}
            <div className="mt-6 flex justify-center">
              <Link
                to="/login"
                className="w-full max-w-xs flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-button-text bg-button-bg hover:bg-secondary focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all duration-300"
              >
                {t("company.login_button")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyPage;
