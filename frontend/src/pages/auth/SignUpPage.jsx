import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import SignUpForm from "../../components/auth/SignUpForm";
import AuthPageShell from "../../components/auth/AuthPageShell";
import AuthSurface from "../../components/auth/AuthSurface";
import AuthCardHeader from "../../components/auth/AuthCardHeader";

const SignUpPage = () => {
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const isLoggedIn = !!authUser;
  const companyIdFromQuery = new URLSearchParams(window.location.search).get(
    "companyId"
  );
  const missingCompanyContext = !isLoggedIn && !companyIdFromQuery;

  return (
    <AuthPageShell align="start">
      <AuthSurface wide className="max-w-4xl">
        <div
          className="px-6 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-8"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <AuthCardHeader
            title={
              isLoggedIn
                ? t("signupEmployee.signUpPage.add_new_employee")
                : t("auth.signup_title")
            }
            subtitle={
              isLoggedIn
                ? t("signupEmployee.signUpPage.fill_details")
                : t("auth.signup_subtitle")
            }
          />

          {missingCompanyContext && (
            <div
              className="mb-6 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "rgba(245, 158, 11, 0.08)",
                color: "var(--text-color)",
              }}
            >
              כדי להירשם כמנהל חברה, פתחו את קישור האישור מהמייל (כולל companyId),
              או התחילו ב־{" "}
              <Link
                to="/create-company"
                className="font-semibold underline"
                style={{ color: "var(--color-primary)" }}
              >
                יצירת חברה
              </Link>
              .
            </div>
          )}

          <div className="transition-all duration-300 ease-in-out">
            <SignUpForm />
          </div>
          {!isLoggedIn && (
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
          )}
        </div>
      </AuthSurface>
    </AuthPageShell>
  );
};

export default SignUpPage;
