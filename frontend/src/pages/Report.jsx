import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";

const Report = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: "",
    severity: "",
    title: "",
    description: "",
    steps: "",
    email: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const bugTypes = [
    { value: "ui", label: "בעיית תצוגה", icon: "🎨" },
    { value: "functionality", label: "תקלה תפקודית", icon: "⚙️" },
    { value: "performance", label: "בעיית ביצועים", icon: "🐌" },
    { value: "security", label: "בעיית אבטחה", icon: "🔒" },
    { value: "data", label: "בעיית נתונים", icon: "💾" },
    { value: "other", label: "אחר", icon: "❓" }
  ];

  const severityLevels = [
    { value: "low", label: "נמוכה", color: "#10B981", icon: "🟢" },
    { value: "medium", label: "בינונית", color: "#F59E0B", icon: "🟡" },
    { value: "high", label: "גבוהה", color: "#EF4444", icon: "🔴" },
    { value: "critical", label: "קריטית", color: "#991B1B", icon: "🚨" }
  ];

  // Map bug types to support ticket categories
  const mapBugTypeToCategory = (type) => {
    const mapping = {
      ui: "Bug Report",
      functionality: "Bug Report",
      performance: "Technical Support",
      security: "Bug Report",
      data: "Bug Report",
      other: "General Question"
    };
    return mapping[type] || "Bug Report";
  };

  // Map severity to priority
  const mapSeverityToPriority = (severity) => {
    const mapping = {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Urgent"
    };
    return mapping[severity] || "Medium";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.type || !formData.severity || !formData.title || !formData.description) {
      toast.error("אנא מלא את כל השדות הנדרשים");
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine description and steps
      const fullDescription = formData.steps
        ? `${formData.description}\n\nשלבים לשחזור הבעיה:\n${formData.steps}`
        : formData.description;

      // Create support ticket
      const ticketData = {
        title: formData.title,
        description: fullDescription,
        category: mapBugTypeToCategory(formData.type),
        priority: mapSeverityToPriority(formData.severity)
      };

      const response = await axiosInstance.post("/support-tickets", ticketData);
      
      if (response.data.success) {
        toast.success("הדיווח נשלח בהצלחה! נחזור אליך בהקדם.");
        
        // Reset form
        setFormData({
          type: "",
          severity: "",
          title: "",
          description: "",
          steps: "",
          email: ""
        });

        // Optionally redirect to dashboard if user is logged in
        // You can check if user is logged in and redirect accordingly
        setTimeout(() => {
          // Check if user is authenticated (you might want to check this differently)
          const isAuthenticated = document.cookie.includes("auth_token");
          if (isAuthenticated) {
            navigate("/dashboard/support-tickets");
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating support ticket:", error);
      
      if (error.response?.status === 401) {
        toast.error("אנא התחבר כדי לשלוח דיווח");
        // Optionally redirect to login
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(
          error.response?.data?.message || 
          "שגיאה בשליחת הדיווח. אנא נסה שוב מאוחר יותר."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Hero */}
      <section 
        className="py-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl mb-6"
          >
            🐛
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold mb-6 text-white"
          >
            דווח על באג
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white max-w-3xl mx-auto"
            style={{ opacity: 0.9 }}
          >
            עזור לנו לשפר את Nexora - דווח על בעיה שמצאת
          </motion.p>
        </div>
      </section>

      {/* Form */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Bug Type */}
            <div>
              <label 
                className="block text-lg font-bold mb-4"
                style={{ color: 'var(--text-color)' }}
              >
                סוג הבעיה
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {bugTypes.map((type) => (
                  <motion.button
                    key={type.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      formData.type === type.value ? 'shadow-xl' : 'shadow-lg'
                    }`}
                    style={{
                      backgroundColor: formData.type === type.value 
                        ? 'var(--color-primary)' 
                        : 'var(--bg-color)',
                      color: formData.type === type.value 
                        ? 'var(--button-text)' 
                        : 'var(--text-color)',
                      border: `2px solid ${formData.type === type.value ? 'var(--color-primary)' : 'var(--border-color)'}`
                    }}
                  >
                    <div className="text-4xl mb-2">{type.icon}</div>
                    <div className="font-semibold">{type.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label 
                className="block text-lg font-bold mb-4"
                style={{ color: 'var(--text-color)' }}
              >
                רמת חומרה
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {severityLevels.map((level) => (
                  <motion.button
                    key={level.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFormData({ ...formData, severity: level.value })}
                    className={`p-4 rounded-xl transition-all duration-300 ${
                      formData.severity === level.value ? 'shadow-xl' : 'shadow-lg'
                    }`}
                    style={{
                      backgroundColor: formData.severity === level.value 
                        ? level.color 
                        : 'var(--bg-color)',
                      color: formData.severity === level.value 
                        ? 'white' 
                        : 'var(--text-color)',
                      border: `2px solid ${formData.severity === level.value ? level.color : 'var(--border-color)'}`
                    }}
                  >
                    <div className="text-4xl mb-2">{level.icon}</div>
                    <div className="font-semibold">{level.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label 
                className="block text-lg font-bold mb-3"
                style={{ color: 'var(--text-color)' }}
              >
                כותרת הבעיה
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="תאר את הבעיה בקצרה..."
                className="w-full p-4 rounded-xl shadow-lg transition-all duration-300 focus:shadow-xl"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  border: '2px solid var(--border-color)'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label 
                className="block text-lg font-bold mb-3"
                style={{ color: 'var(--text-color)' }}
              >
                תיאור מפורט
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                placeholder="תאר את הבעיה בפירוט..."
                className="w-full p-4 rounded-xl shadow-lg transition-all duration-300 focus:shadow-xl"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  border: '2px solid var(--border-color)'
                }}
              />
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label 
                className="block text-lg font-bold mb-3"
                style={{ color: 'var(--text-color)' }}
              >
                שלבים לשחזור הבעיה
              </label>
              <textarea
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                rows={4}
                placeholder="1. עשה כך...&#10;2. לחץ על...&#10;3. הבעיה מתרחשת..."
                className="w-full p-4 rounded-xl shadow-lg transition-all duration-300 focus:shadow-xl"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  border: '2px solid var(--border-color)'
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label 
                className="block text-lg font-bold mb-3"
                style={{ color: 'var(--text-color)' }}
              >
                המייל שלך (לעדכונים)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com (אופציונלי)"
                className="w-full p-4 rounded-xl shadow-lg transition-all duration-300 focus:shadow-xl"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  border: '2px solid var(--border-color)'
                }}
              />
            </div>

            {/* Submit */}
            <div className="text-center">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                className="py-4 px-12 font-bold rounded-xl shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
                  color: 'var(--button-text)'
                }}
              >
                {isSubmitting ? "שולח..." : "שלח דיווח 🚀"}
              </motion.button>
            </div>
          </form>
        </div>
      </section>

      {/* Thank You Note */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            תודה על העזרה! 🙏
          </h2>
          <p className="text-lg text-white" style={{ opacity: 0.9 }}>
            הדיווח שלך עוזר לנו לשפר את Nexora ולספק שירות טוב יותר לכולם
          </p>
        </div>
      </section>
    </div>
  );
};

export default Report;

