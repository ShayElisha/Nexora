import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CreateCompanyForm from "../../components/company/CreateCompanyForm";
import AuthPageShell from "../../components/auth/AuthPageShell";
import AuthSurface from "../../components/auth/AuthSurface";
import AuthCardHeader from "../../components/auth/AuthCardHeader";

const CreateCompanyPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  return (
    <AuthPageShell align="start">
      <AuthSurface wide>
        <div
          className="px-6 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-8"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <AuthCardHeader
            title={t("auth.signup_title")}
            subtitle={t("auth.signup_subtitle")}
          />

          <div className="transition-all duration-300 ease-in-out">
            <CreateCompanyForm />
          </div>

          <p
            className="mt-8 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {t("auth.already_have_account")}{" "}
            <Link
              to="/login"
              className="font-semibold transition-opacity duration-200 hover:opacity-70"
              style={{ color: "var(--color-primary)" }}
            >
              {t("auth.toggle_to_login")}
            </Link>
          </p>
        </div>
      </AuthSurface>
    </AuthPageShell>
  );
};

export default CreateCompanyPage;
