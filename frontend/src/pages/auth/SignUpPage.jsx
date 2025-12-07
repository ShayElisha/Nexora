import { Link } from "react-router-dom";
import SignUpForm from "../../components/auth/SignUpForm";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const SignUpPage = () => {
  const { data: authData } = useQuery({ queryKey: ["authUser"] });
  const authUser = authData?.user;
  const { t } = useTranslation();

  const isLoggedIn = !!authUser;

  return (
    <div 
      className="w-full py-8"
    >
      <div className="w-full space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="inline-block mb-4"
          >
            <div 
              className="mx-auto w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
                border: '4px solid var(--border-color)'
              }}
            >
              <span className="text-5xl">👤</span>
            </div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl sm:text-4xl font-extrabold mb-3"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-accent))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {isLoggedIn
              ? t("signupEmployee.signUpPage.add_new_employee")
              : t("signupEmployee.signUpPage.create_account")}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base"
            style={{ color: 'var(--text-color)', opacity: 0.8 }}
          >
            {t("signupEmployee.signUpPage.fill_details")}
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <SignUpForm />
        </motion.div>

        {/* Login Link */}
        {!isLoggedIn && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-sm text-center"
            style={{ color: 'var(--text-color)', opacity: 0.8 }}
          >
            {t("signupEmployee.signUpPage.already_have_account")}{" "}
            <Link
              to="/login"
              className="font-semibold transition-all duration-300 hover:underline underline-offset-4"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-accent)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-primary)'}
            >
              {t("signupEmployee.signUpPage.log_in_here")}
            </Link>
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
