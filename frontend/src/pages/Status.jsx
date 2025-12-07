import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const Status = () => {
  const { t, i18n } = useTranslation();
  const isRTL = ["he", "ar"].includes(i18n.language);

  const services = [
    {
      name: "API Gateway",
      status: "operational",
      uptime: "99.99%",
      response: "45ms"
    },
    {
      name: "Web Application",
      status: "operational",
      uptime: "99.98%",
      response: "120ms"
    },
    {
      name: "Database",
      status: "operational",
      uptime: "100%",
      response: "8ms"
    },
    {
      name: "File Storage",
      status: "operational",
      uptime: "99.99%",
      response: "95ms"
    },
    {
      name: "Email Service",
      status: "operational",
      uptime: "99.95%",
      response: "210ms"
    },
    {
      name: "Authentication",
      status: "operational",
      uptime: "100%",
      response: "35ms"
    }
  ];

  const incidents = [
    {
      date: "15 ינואר 2024",
      title: "עדכון שגרתי",
      description: "עדכון תוכנה מתוכנן - ללא הפרעות",
      severity: "info"
    },
    {
      date: "10 ינואר 2024",
      title: "שיפור ביצועים",
      description: "שיפרנו את מהירות המערכת ב-30%",
      severity: "success"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "#10B981"; // green
      case "degraded":
        return "#F59E0B"; // yellow
      case "down":
        return "#EF4444"; // red
      default:
        return "#6B7280"; // gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "operational":
        return "פעיל";
      case "degraded":
        return "ביצועים מופחתים";
      case "down":
        return "לא זמין";
      default:
        return "לא ידוע";
    }
  };

  const allOperational = services.every(s => s.status === "operational");

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
          background: allOperational 
            ? `linear-gradient(135deg, #10B981, #059669)`
            : `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl mb-6"
          >
            {allOperational ? "✅" : "⚠️"}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold mb-6 text-white"
          >
            {allOperational ? "כל המערכות פעילות" : "בעיות טכניות"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white"
            style={{ opacity: 0.9 }}
          >
            עדכון אחרון: {new Date().toLocaleString('he-IL')}
          </motion.p>
        </div>
      </section>

      {/* Services Status */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 
            className="text-3xl font-bold mb-12 text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            סטטוס שירותים
          </h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '2px solid var(--border-color)'
                }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getStatusColor(service.status) }}
                  />
                  <div>
                    <h3 
                      className="font-bold text-lg"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {service.name}
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: getStatusColor(service.status) }}
                    >
                      {getStatusText(service.status)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-8 text-sm">
                  <div className="text-center">
                    <p style={{ color: 'var(--text-color)', opacity: 0.7 }}>Uptime</p>
                    <p 
                      className="font-bold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {service.uptime}
                    </p>
                  </div>
                  <div className="text-center">
                    <p style={{ color: 'var(--text-color)', opacity: 0.7 }}>Response</p>
                    <p 
                      className="font-bold"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      {service.response}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Incidents */}
      <section className="py-20" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 
            className="text-3xl font-bold mb-12 text-center"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            אירועים אחרונים
          </h2>
          <div className="space-y-4">
            {incidents.map((incident, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-color)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">
                    {incident.severity === "success" ? "✅" : 
                     incident.severity === "info" ? "ℹ️" : "⚠️"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 
                        className="font-bold text-lg"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {incident.title}
                      </h3>
                      <span 
                        className="text-xs"
                        style={{ color: 'var(--text-color)', opacity: 0.7 }}
                      >
                        {incident.date}
                      </span>
                    </div>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--text-color)', opacity: 0.9 }}
                    >
                      {incident.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section 
        className="py-20"
        style={{
          background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            קבל עדכונים
          </h2>
          <p className="text-lg text-white mb-8" style={{ opacity: 0.9 }}>
            הירשם לקבלת התראות על שינויים בסטטוס המערכת
          </p>
          <div className="flex gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="המייל שלך"
              className="flex-1 p-4 rounded-xl"
              style={{
                backgroundColor: 'white',
                color: 'var(--text-color)',
                border: 'none'
              }}
            />
            <button
              className="py-4 px-8 font-bold rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
              style={{
                backgroundColor: 'white',
                color: 'var(--color-primary)'
              }}
            >
              הירשם
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Status;

