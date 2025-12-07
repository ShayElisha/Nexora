import { Link } from "react-router-dom";
import CreateCompanyForm from "../../components/company/CreateCompanyForm";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const CreateCompanyPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 relative overflow-hidden py-12"
      style={{ backgroundColor: 'var(--bg-color)' }}
    >
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl"
          style={{ 
            background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
            opacity: 0.15
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-20 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ 
            background: `linear-gradient(135deg, var(--color-accent), var(--color-primary))`,
            opacity: 0.15
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-72 h-72 rounded-full blur-3xl"
          style={{ 
            background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`,
            opacity: 0.1
          }}
          animate={{
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 z-10"
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-50"
              style={{ 
                background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`
              }}
            ></div>
            <img
              className="relative mx-auto size-28 rounded-full shadow-2xl object-cover"
              style={{ borderWidth: '4px', borderColor: 'var(--border-color)' }}
              src="../../../public/assets/logo.png"
              alt={t("company.logo_alt")}
            />
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-6 text-3xl sm:text-4xl font-bold"
          style={{
            background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          {t("company.start_journey")}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 text-sm"
          style={{ color: 'var(--color-secondary)' }}
        >
          {t("company.subtitle") || "Create your company and get started!"}
        </motion.p>
      </motion.div>

      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="w-full sm:w-full sm:max-w-4xl z-10"
      >
        <div 
          className="backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
          style={{ 
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* Decorative top border */}
          <div 
            className="h-2"
            style={{ 
              background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`
            }}
          ></div>

          <div className="py-10 px-6 sm:px-12">
            <CreateCompanyForm />
            
            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div 
                    className="w-full border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  ></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span 
                    className="px-3 font-medium"
                    style={{ 
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)'
                    }}
                  >
                    {t("company.already_have")}
                  </span>
                </div>
              </div>

              {/* Link to Login */}
              <div className="mt-6 flex justify-center">
                <Link
                  to="/login"
                  className="w-full max-w-xs flex justify-center py-3 px-6 rounded-xl shadow-lg font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  style={{
                    background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`,
                    color: 'var(--button-text)'
                  }}
                >
                  {t("company.login_button")}
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative bottom section */}
          <div 
            className="px-8 py-4"
            style={{ 
              background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`,
              opacity: 0.1,
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <p className="text-xs text-center" style={{ color: 'var(--color-secondary)' }}>
              © 2024 Nexora. {t("auth.all_rights_reserved")}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCompanyPage;
