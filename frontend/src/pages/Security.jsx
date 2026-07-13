import {
  Bell,
  DatabaseBackup,
  Eye,
  KeyRound,
  Lock,
  Shield,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import PublicCardGrid from "../components/public/PublicCardGrid";
import { usePageLocale } from "../hooks/usePageLocale";

const securityIcons = [Lock, KeyRound, DatabaseBackup, Shield, Eye, ShieldCheck, UserRoundCheck, Bell];
const complianceIcons = [ShieldCheck, ShieldCheck, ShieldCheck, ShieldCheck];

const Security = () => {
  const { t } = usePageLocale();
  const items = t("public.security.items", { returnObjects: true }) || [];
  const standards = t("public.security.standards", { returnObjects: true }) || [];

  const securityCards = items.map((item, index) => ({
    ...item,
    icon: securityIcons[index % securityIcons.length],
  }));

  const standardCards = standards.map((item, index) => ({
    ...item,
    title: item.name,
    icon: complianceIcons[index % complianceIcons.length],
  }));

  return (
    <PublicPageLayout>
      <PublicPageHero
        badge={t("public.security.badge")}
        title={t("public.security.title")}
        subtitle={t("public.security.subtitle")}
      />

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <PublicCardGrid items={securityCards} columns={4} />
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: "var(--text-color)" }}>
            {t("public.security.standardsTitle")}
          </h2>
          <PublicCardGrid items={standardCards} columns={4} />
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Security;

