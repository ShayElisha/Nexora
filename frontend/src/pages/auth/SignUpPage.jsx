import { Link } from "react-router-dom";
import SignUpForm from "../../components/auth/SignUpForm";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

const SignUpPage = () => {
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const { t } = useTranslation(); // Get logged-in user from context

  const isLoggedIn = !!authUser; // Check if user is logged in

  return (
    <div className="max-h-full flex flex-col items-center justify-center py-12 bg-bg relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-secondary to-accent opacity-10 animate-fadeIn"></div>
      <div className="w-full max-w-full space-y-6 bg-bg rounded-lg shadow-lg border animate-fadeIn">
        <div className="text-center">
          <img
            className="mx-auto h-20 w-auto rounded-full border-2 border-button-text shadow-md"
            src="https://images.unsplash.com/photo-1620288627223-53302f4e8c74?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={t("signupEmployee.signUpPage.logo_alt")}
          />
          <h2 className="mt-4 text-3xl font-extrabold text-text sm:text-4xl">
            {isLoggedIn
              ? t("signupEmployee.signUpPage.add_new_employee")
              : t("signupEmployee.signUpPage.create_account")}
          </h2>
          <p className="text-secondary">
            {t("signupEmployee.signUpPage.fill_details")}
          </p>
        </div>
        <SignUpForm />
        {!isLoggedIn && (
          <p className="mt-4 text-sm text-center text-secondary">
            {t("signupEmployee.signUpPage.already_have_account")}{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-accent transition-colors duration-200"
            >
              {t("signupEmployee.signUpPage.log_in_here")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
