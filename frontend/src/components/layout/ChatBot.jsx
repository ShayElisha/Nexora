import React, { useState } from "react";
import axios from "axios";

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
      const response = await axios.post("http://localhost:5000/api/chat", {
        message: input,
      });
      // הוספת תגובת הבוט
      setMessages((prev) => [
        ...prev,
        { text: response.data.reply, sender: "bot" },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { text: "שגיאה בתקשורת עם השרת", sender: "bot" },
      ]);
    }
    setInput(""); // ניקוי השדה
  };

  return (
    <div>
      {/* כפתור לפתיחת הצ'אט */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600"
        >
          צ'אט
        </button>
      )}

      {/* חלון הצ'אט */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-white shadow-lg rounded-lg flex flex-col">
          {/* כותרת */}
          <div className="bg-blue-500 text-white p-2 rounded-t-lg flex justify-between">
            <span>צ'אט בוט</span>
            <button onClick={toggleChat} className="text-white">
              X
            </button>
          </div>

          {/* תצוגת הודעות */}
          <div className="flex-1 p-2 overflow-y-auto">
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
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>

          {/* שדה קלט ושליחה */}
          <div className="p-2 border-t">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="w-full p-2 border rounded"
              placeholder="כתוב הודעה..."
            />
            <button
              onClick={sendMessage}
              className="mt-2 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              שלח
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
