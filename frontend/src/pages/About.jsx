import { Handshake, Lightbulb, ShieldCheck, Target, UserRound } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicCardGrid from "../components/public/PublicCardGrid";
import { usePageLocale } from "../hooks/usePageLocale";

const valueIcons = [Target, Handshake, Lightbulb, ShieldCheck];

const About = () => {
  const { t } = usePageLocale();
  const values = t("public.about.values", { returnObjects: true }) || [];
  const storyParagraphs = t("public.about.storyParagraphs", { returnObjects: true }) || [];
  const team = t("public.about.team", { returnObjects: true }) || [];

  const valueCards = values.map((value, index) => ({
    ...value,
    icon: valueIcons[index % valueIcons.length],
  }));

  return (
    <PublicPageLayout>
      <PublicPageHero badge={t("public.about.badge")} title={t("public.about.title")} subtitle={t("public.about.subtitle")} />

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "var(--text-color)" }}>
            {t("public.about.storyTitle")}
          </h2>
          <div className="space-y-4">
            {storyParagraphs.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed" style={{ color: "var(--color-secondary)" }}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: "var(--text-color)" }}>
            {t("public.about.valuesTitle")}
          </h2>
          <PublicCardGrid items={valueCards} columns={4} />
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: "var(--text-color)" }}>
            {t("public.about.teamTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-2xl border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                }}
              >
                <UserRound size={32} strokeWidth={1.75} style={{ color: "var(--color-primary)" }} />
                <h3 className="text-lg font-bold mt-4 mb-1" style={{ color: "var(--text-color)" }}>
                  {member.name}
                </h3>
                <p className="text-sm mb-3" style={{ color: "var(--color-primary)" }}>
                  {member.role}
                </p>
                <p className="text-sm" style={{ color: "var(--color-secondary)" }}>
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default About;

