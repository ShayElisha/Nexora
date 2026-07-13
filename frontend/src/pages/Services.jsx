import { Briefcase, Cloud, Code2, Globe, Megaphone, Shield } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicCardGrid from "../components/public/PublicCardGrid";
import { usePageLocale } from "../hooks/usePageLocale";

const serviceIcons = [Code2, Briefcase, Shield, Globe, Megaphone, Cloud];

const Services = () => {
  const { t } = usePageLocale();
  const items = t("public.services.items", { returnObjects: true }) || [];
  const cards = items.map((item, index) => ({
    ...item,
    icon: serviceIcons[index % serviceIcons.length],
  }));

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.services.badge")}
        title={t("public.services.title")}
        subtitle={t("public.services.subtitle")}
      />
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <PublicCardGrid items={cards} columns={3} />
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Services;
