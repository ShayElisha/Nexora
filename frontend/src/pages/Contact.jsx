import React from "react";

const Contact = () => {
  return (
    <div className="bg-bg min-h-screen text-text">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary py-12 text-center text-white">
        <h1 className="text-4xl font-extrabold mb-2">צרו קשר</h1>
        <p className="max-w-xl mx-auto text-sm">
          נשמח לשמוע מכם! מלאו את הפרטים למטה ואחד מאנשי הצוות שלנו יחזור אליכם
          בהקדם.
        </p>
      </div>

      {/* Main Content - Contact Form */}
      <section className="py-10 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow border border-border-color">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            טופס יצירת קשר
          </h2>
          <p className="mb-6">
            נשמח לסייע לכם בכל שאלה או בקשה. אנא מלאו את הפרטים הבאים:
          </p>
          <form className="space-y-6">
            {/* שם מלא */}
            <div>
              <label
                className="block mb-1 font-semibold text-sm"
                htmlFor="fullName"
              >
                שם מלא
              </label>
              <input
                type="text"
                id="fullName"
                className="w-full p-2 border border-border-color rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="שם פרטי ושם משפחה"
              />
            </div>

            {/* דוא"ל */}
            <div>
              <label
                className="block mb-1 font-semibold text-sm"
                htmlFor="email"
              >
                דוא"ל
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-2 border border-border-color rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="example@mail.com"
              />
            </div>

            {/* נושא הפנייה */}
            <div>
              <label
                className="block mb-1 font-semibold text-sm"
                htmlFor="subject"
              >
                נושא
              </label>
              <input
                type="text"
                id="subject"
                className="w-full p-2 border border-border-color rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="נושא ההודעה"
              />
            </div>

            {/* הודעה */}
            <div>
              <label
                className="block mb-1 font-semibold text-sm"
                htmlFor="message"
              >
                הודעה
              </label>
              <textarea
                id="message"
                rows="5"
                className="w-full p-2 border border-border-color rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="פרטו כאן את פנייתכם"
              ></textarea>
            </div>

            {/* כפתור שליחה */}
            <button
              type="submit"
              className="bg-primary text-white font-semibold py-2 px-6 rounded hover:bg-secondary transition-colors"
            >
              שליחה
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Contact;
