import { BarChart3, Boxes, Bot, ShieldCheck, Users, Wallet } from "lucide-react";
import PublicPageHero from "../components/home/PublicPageHero";
import PublicPageLayout from "../components/home/PublicPageLayout";
import { usePageLocale } from "../hooks/usePageLocale";

const postIcons = [BarChart3, Boxes, ShieldCheck, Bot, Wallet, Users];

const Blog = () => {
  const { t } = usePageLocale();
  const posts = t("public.blog.posts", { returnObjects: true }) || [];

  return (
    <PublicPageLayout>
      <PublicPageHero badge={t("public.blog.badge")} title={t("public.blog.title")} subtitle={t("public.blog.subtitle")} />
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => {
              const Icon = postIcons[index % postIcons.length];
              return (
                <article
                  key={post.title}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                >
                  <div className="h-40 px-6 flex items-center">
                    <Icon size={34} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div className="px-6 pb-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full border"
                        style={{
                          borderColor: "var(--border-color)",
                          color: "var(--color-primary)",
                        }}
                      >
                        {post.category}
                      </span>
                      <span className="text-xs self-center" style={{ color: "var(--color-secondary)" }}>
                        {post.date}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text-color)" }}>
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-secondary)" }}>
                      {post.excerpt}
                    </p>
                    <button type="button" className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                      {t("public.blog.readMore")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default Blog;

