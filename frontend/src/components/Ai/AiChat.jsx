import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axiosInstance from "../../lib/axios";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  TrendingUp,
  Lightbulb,
  BarChart3,
  Loader2,
  Sparkles,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Zap,
} from "lucide-react";

const AiChat = ({ isRTL = false }) => {
  const { t } = useTranslation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && predictions.length === 0) {
      loadPredictions();
      loadInsights();
    }
  }, [isChatOpen]);

  const loadPredictions = async () => {
    try {
      const res = await axiosInstance.get("/ai/predictions");
      if (res.data.success) {
        setPredictions(res.data.predictions);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("Predictions available for Admins only");
        setPredictions(null); // null indicates not available for this user
      } else {
        console.error("Error loading predictions:", error);
      }
    }
  };

  const loadInsights = async () => {
    try {
      const res = await axiosInstance.get("/ai/insights");
      if (res.data.success) {
        setInsights(res.data.insights);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("Insights available for Admins only");
        setInsights(null); // null indicates not available for this user
      } else {
        console.error("Error loading insights:", error);
      }
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && messages.length === 0) {
      setMessages([
        {
          text: t("ai.welcome_message"),
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      text: input,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/ai/chat", {
        message: currentInput,
      });

      if (response.data.success) {
        const botMessage = {
          text: response.data.response,
          sender: "bot",
          timestamp: new Date(),
          analysis: response.data.data, // backend returns analysis under 'data'
          summary: response.data.summary,
          predictions: response.data.predictions,
          isGeneral: response.data.isGeneral,
        };
        setMessages((prev) => [...prev, botMessage]);

        // עדכון תחזיות אם יש
        if (response.data.predictions && response.data.predictions.length > 0) {
          setPredictions(response.data.predictions);
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        text: t("ai.error_message"),
        sender: "bot",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    { text: t("ai.quick_question_1"), icon: "👥", category: "employees" },
    { text: t("ai.quick_question_2"), icon: "💰", category: "finance" },
    { text: t("ai.quick_question_3"), icon: "📊", category: "projects" },
    { text: t("ai.quick_question_4"), icon: "🔮", category: "predictions" },
    { text: t("ai.quick_question_weather"), icon: "🌤️", category: "web" },
    { text: t("ai.quick_question_time"), icon: "🕐", category: "web" },
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
    setTimeout(() => sendMessage(), 100);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  // פונקציה לעיבוד טקסט עם פורמט
  const formatMessage = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // בדיקה אם השורה היא כותרת (מתחילה ב-**)
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={idx} className="font-bold text-base mb-2">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </p>
        );
      }
      
      // בדיקה אם השורה היא bullet point
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <p key={idx} className="pl-4 text-sm mb-1">
            {line}
          </p>
        );
      }

      // שורה רגילה
      return line.trim() ? (
        <p key={idx} className="text-sm mb-2">
          {line}
        </p>
      ) : null;
    });
  };

  const chatContent = (
    <div>
      {/* כפתור צף */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            onClick={toggleChat}
            className={`fixed bottom-24 ${isRTL ? 'right-4' : 'left-4'} w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center z-[9999] group overflow-hidden`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse opacity-50"></div>
            <Sparkles className="w-7 h-7 relative z-10" />
            <div className={`absolute -top-2 ${isRTL ? '-right-2' : '-left-2'} w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg`}>
              <Zap className="w-4 h-4" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* חלון הצ'אט */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className={`fixed bottom-4 ${isRTL ? 'right-4' : 'left-4'} w-full sm:w-[440px] h-[650px] bg-white shadow-2xl rounded-2xl flex flex-col z-[9999] overflow-hidden border-2 border-indigo-200`}
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* כותרת מודרנית */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {t("ai.title")}
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </h3>
                    <p className="text-xs opacity-90">{t("ai.subtitle")}</p>
                  </div>
                </div>
                <button
                  onClick={toggleChat}
                  className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* תפריט תחזיות ותובנות */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-2 flex gap-2">
              <button
                onClick={() => {
                  setShowPredictions(!showPredictions);
                  setShowInsights(false);
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  showPredictions 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'hover:bg-blue-50 text-blue-600'
                }`}
              >
                <TrendingUp size={16} />
                {t("ai.predictions")} ({predictions.length})
              </button>
              <button
                onClick={() => {
                  setShowInsights(!showInsights);
                  setShowPredictions(false);
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  showInsights 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'hover:bg-purple-50 text-purple-600'
                }`}
              >
                <Lightbulb size={16} />
                {t("ai.insights")} ({insights.length})
              </button>
              <button
                onClick={() => {
                  loadPredictions();
                  loadInsights();
                }}
                className="p-2 rounded-lg hover:bg-gray-200 transition-all text-gray-600"
                title={t("ai.refresh")}
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* תחזיות */}
            <AnimatePresence>
              {showPredictions && predictions.length > 0 && (
                <motion.div
                  className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-200 max-h-48 overflow-y-auto"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="space-y-2">
                    {predictions.map((pred, idx) => (
                      <motion.div
                        key={idx}
                        className="p-3 bg-white rounded-xl shadow-sm border border-blue-200 hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-2xl">{pred.icon}</span>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-blue-900">
                              {pred.title}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              {pred.prediction}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                                {t("ai.confidence")}: {pred.confidence}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* תובנות */}
            <AnimatePresence>
              {showInsights && insights.length > 0 && (
                <motion.div
                  className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-200 max-h-48 overflow-y-auto"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="space-y-2">
                    {insights.map((insight, idx) => (
                      <motion.div
                        key={idx}
                        className={`p-3 rounded-xl shadow-sm border ${getSeverityColor(
                          insight.severity
                        )} hover:shadow-md transition-shadow`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <p className="font-bold text-sm mb-1">{insight.title}</p>
                        <p className="text-xs mb-2">{insight.insight}</p>
                        <div className="flex items-start gap-1">
                          <Lightbulb size={12} className="mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-medium">
                            {insight.recommendation}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* תצוגת הודעות */}
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-50 via-white to-gray-50">
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className={`flex items-start gap-2 max-w-[90%] ${
                        msg.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* אווטאר */}
                      <motion.div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                          msg.sender === "user"
                            ? "bg-gradient-to-br from-blue-500 to-blue-700"
                            : "bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600"
                        }`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        {msg.sender === "user" ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </motion.div>

                      {/* בועת הודעה */}
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-md ${
                          msg.sender === "user"
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                            : msg.isError
                            ? "bg-red-50 text-red-700 border-2 border-red-200"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {msg.sender === "user" ? (
                            <p className="text-sm">{msg.text}</p>
                          ) : (
                            <div className="text-sm space-y-1">
                              {formatMessage(msg.text)}
                            </div>
                          )}
                        </div>

                        <p
                          className={`text-xs mt-2 ${
                            msg.sender === "user"
                              ? "text-blue-200"
                              : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        {/* קטגוריות שזוהו */}
                        {msg.analysis?.categories && msg.analysis.categories.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {msg.analysis.categories.map((cat, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* אינדיקטור טעינה */}
                {isLoading && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-md border border-blue-200">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-700 font-medium">
                        {t("ai.thinking")}
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* שאלות מהירות */}
            {messages.length <= 1 && !isLoading && (
              <div className="px-4 pb-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  {t("ai.quick_questions")}:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickQuestions.map((q, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => handleQuickQuestion(q.text)}
                      className="p-2 text-left text-xs bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">{q.icon}</span>
                      <span className="truncate font-medium text-gray-700">
                        {q.text}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* שדה קלט */}
            <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isLoading && sendMessage()}
                  className="flex-1 p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                  placeholder={t("ai.input_placeholder")}
                  disabled={isLoading}
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return ReactDOM.createPortal(chatContent, document.body);
};

export default AiChat;
