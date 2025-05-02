import { useState } from "react";
import ReactDOM from "react-dom";
import axiosInstance from "../../lib/axios"; // שימוש ב-axiosInstance במקום axios

const ChatBot = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // פתיחה/סגירה של הצ'אט
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // שליחת הודעה לשרת
  const sendMessage = async () => {
    if (!input.trim()) return;

    // הוספת הודעת המשתמש לרשימה
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    try {
      const response = await axiosInstance.post("/chat", {
        message: input,
      });
      // הוספת תגובת הבוט
      setMessages((prev) => [
        ...prev,
        { text: response.data.reply, sender: "bot" },
      ]);
    } catch (error) {
      console.error("שגיאה בשליחת הודעה:", error);
      setMessages((prev) => [
        ...prev,
        { text: "שגיאה בתקשורת עם השרת", sender: "bot" },
      ]);
    }
    setInput(""); // ניקוי השדה
  };

  // תוכן הצ'אטבוט
  const chatContent = (
    <div>
      {/* כפתור לפתיחת הצ'אט */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200 z-[10000]"
        >
          צ'אט
        </button>
      )}

      {/* חלון הצ'אט */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-80 sm:w-96 h-96 bg-white shadow-lg rounded-lg flex flex-col z-[10000]">
          {/* כותרת */}
          <div className="bg-blue-500 text-white p-2 rounded-t-lg flex justify-between items-center">
            <span>צ'אט בוט</span>
            <button
              onClick={toggleChat}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* תצוגת הודעות */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    msg.sender === "user" ? "bg-blue-100" : "bg-gray-200"
                  } max-w-[80%] text-sm sm:text-base`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          {/* שדה קלט ושליחה */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="כתוב הודעה..."
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base"
              >
                שלח
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // הצבת הצ'אטבוט ב-document.body באמצעות portal
  return ReactDOM.createPortal(chatContent, document.body);
};

export default ChatBot;
