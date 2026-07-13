import {
  BarChart3,
  Boxes,
  DollarSign,
  Handshake,
  Link2,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicCardGrid from "../components/public/PublicCardGrid";
import { usePageLocale } from "../hooks/usePageLocale";

const featureIcons = [Users, DollarSign, Boxes, Handshake, BarChart3, Link2, Smartphone, ShieldCheck];

const Features = () => {
  const { t } = usePageLocale();
  const items = t("public.features.items", { returnObjects: true }) || [];
  const cards = items.map((item, index) => ({
    ...item,
    icon: featureIcons[index % featureIcons.length],
  }));

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.features.badge")}
        title={t("public.features.title")}
        subtitle={t("public.features.subtitle")}
      />
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <PublicCardGrid items={cards} columns={4} />
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Features;

