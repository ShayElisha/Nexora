import { Link } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden"
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
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl"
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
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl"
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

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxNDgsIDE2MywgMTg0LCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
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
          
          {/* Content */}
          <div className="p-8 sm:p-10">
            {/* Logo and Header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-8"
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
                    className="relative mx-auto h-24 w-24 rounded-full shadow-2xl object-cover"
                    style={{ borderWidth: '4px', borderColor: 'var(--border-color)' }}
                    src="../../../public/assets/logo.png"
                    alt={t("auth.logo_alt")}
                  />
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-6 text-3xl sm:text-4xl font-bold"
                style={{
                  background: `linear-gradient(to right, var(--color-primary), var(--color-secondary), var(--color-accent))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t("auth.welcome_back")}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-2 text-sm"
                style={{ color: 'var(--color-secondary)' }}
              >
                {t("auth.please_login")}
              </motion.p>
            </motion.div>

            {/* Login Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <LoginForm />
            </motion.div>

            {/* Sign Up Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-6 text-center"
            >
              <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                {t("auth.not_registered")}{" "}
                <Link
                  to="/create-company"
                  className="font-semibold transition-all duration-300 hover:underline underline-offset-4"
                  style={{ color: 'var(--color-primary)' }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--color-accent)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--color-primary)'}
                >
                  {t("auth.sign_up_here")}
                </Link>
              </p>
            </motion.div>
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

        {/* Floating elements for decoration */}
        <motion.div
          className="absolute -top-4 -left-4 w-24 h-24 rounded-full blur-2xl"
          style={{ 
            background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
            opacity: 0.3
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full blur-2xl"
          style={{ 
            background: `linear-gradient(135deg, var(--color-accent), var(--color-primary))`,
            opacity: 0.3
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  );
};

export default LoginPage;
