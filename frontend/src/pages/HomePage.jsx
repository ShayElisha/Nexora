import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const HomePage = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/create-company");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  // Typing effect for the tagline
  const [tagline, setTagline] = useState("");
  const fullTagline = "ניהול חכם לעסק שלך";

  useEffect(() => {
    let i = 0;
    const type = () => {
      if (i < fullTagline.length) {
        setTagline(fullTagline.slice(0, i + 1));
        i++;
        setTimeout(type, 100);
      }
    };
    type();
    return () => clearTimeout(type);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-black text-white font-sans"
      dir="rtl"
    >
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        {/* Text Content */}
        <div className="z-20 w-1/2 flex items-center justify-end pr-20">
          <div className="max-w-xl text-right space-y-8">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white animate-fade-in-up">
              ממשק ERP יוקרתי לעסק המודרני
            </h1>
            <p className="text-xl text-gray-300 animate-fade-in-up animation-delay-200">
              {tagline}{" "}
              <span className="animate-blink text-blue-500 ml-1">|</span>
            </p>
            <p className="text-gray-400">
              פלטפורמה חכמה לניהול עובדים, לקוחות ותהליכים – הכול במקום אחד.
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSignUp}
                className="py-3 px-8 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-xl"
              >
                התחלה מהירה
              </button>
              <button
                onClick={handleLogin}
                className="py-3 px-8 border border-white text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
              >
                גלה עוד
              </button>
            </div>
          </div>
        </div>

        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-10">
          <video
            className="w-full h-full object-cover"
            src="/assets/vid.MP4"
            autoPlay
            loop
            muted
            playsInline
            poster="/assets/fallback-image.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/70 to-transparent" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white text-black">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-8">
            נהל את העסק שלך בסטייל
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            כל הכלים הדרושים לניהול מתקדם של העסק – עובדים, לקוחות, מלאי ורכש.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "ניהול עובדים",
                description:
                  "מעקב אחר ביצועים, שעות עבודה ומשמרות. נהל את צוות העובדים שלך ביעילות מרבית.",
                image:
                  "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
              },
              {
                title: "רכש והזמנות",
                description:
                  "אוטומציה של תהליכי רכש, מעקב אחר הזמנות וניהול מלאי חכם לעסק שלך.",
                image:
                  "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
              },
              {
                title: "ניהול לקוחות",
                description:
                  "CRM מובנה לשירות טוב יותר, מעקב אחר לקוחות ושיפור תקשורת וחווית לקוח.",
                image:
                  "https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-10">
            {[
              { number: "85%", label: "שיפור ביעילות" },
              { number: "1,200+", label: "לקוחות מרוצים" },
              { number: "24/7", label: "שירות מסביב לשעון" },
              { number: "99.9%", label: "זמינות מערכת" },
            ].map((item, index) => (
              <div key={index}>
                <p className="text-4xl font-bold text-blue-700">
                  {item.number}
                </p>
                <p className="text-gray-700 mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            מוכן לשדרג את העסק שלך?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            הצטרף לעסקים שכבר נהנים מפתרון ERP שמגדיל רווחיות ומשפר שליטה.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleSignUp}
              className="py-3 px-8 bg-white text-blue-700 font-semibold rounded-full hover:bg-blue-100 transition-all duration-300"
            >
              נסה עכשיו
            </button>
            <button
              onClick={handleLogin}
              className="py-3 px-8 border border-white text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
            >
              התחבר
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
