import { motion } from "framer-motion";

const GlassCard = ({ className, style, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className={`absolute backdrop-blur-xl border border-white/40 shadow-2xl ${className}`}
    style={{
      background: "rgba(255,255,255,0.55)",
      ...style,
    }}
  >
    {children}
  </motion.div>
);

const HeroWallVisual = () => (
  <div className="relative w-full h-[420px] md:h-[520px] perspective-[1200px]">
    {/* Ambient glow */}
    <div
      className="absolute inset-0 rounded-3xl pointer-events-none"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent, color-mix(in srgb, var(--color-accent) 12%, transparent))`,
      }}
    />

    {/* Left wall panel */}
    <motion.div
      initial={{ rotateY: 0, x: 0 }}
      animate={{ rotateY: -18, x: -24 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="absolute left-[8%] top-[10%] w-[42%] h-[80%] origin-right"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="w-full h-full rounded-l-2xl border border-slate-200 shadow-lift"
        style={{
          backgroundImage: `
            linear-gradient(rgba(11,15,25,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11,15,25,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
          backgroundColor: "#FFFFFF",
        }}
      />
    </motion.div>

    {/* Right wall panel */}
    <motion.div
      initial={{ rotateY: 0, x: 0 }}
      animate={{ rotateY: 18, x: 24 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="absolute right-[8%] top-[10%] w-[42%] h-[80%] origin-left"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="w-full h-full rounded-r-2xl border border-slate-200 shadow-lift"
        style={{
          backgroundImage: `
            linear-gradient(rgba(11,15,25,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(11,15,25,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
          backgroundColor: "#FFFFFF",
        }}
      />
    </motion.div>

    {/* Laser split line */}
    <motion.div
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="absolute left-1/2 -translate-x-1/2 top-[8%] w-[2px] h-[84%] z-20 rounded-full"
      style={{
        background: "linear-gradient(180deg, transparent, var(--color-accent), var(--color-primary), var(--color-accent), transparent)",
        boxShadow: "0 0 20px color-mix(in srgb, var(--color-primary) 50%, transparent)",
      }}
    />

    {/* Inner ecosystem */}
    <div className="absolute inset-[18%] z-10">
      <GlassCard className="left-[5%] top-[8%] w-[45%] h-[38%] rounded-xl p-3" delay={0.6}>
        <div className="flex items-end gap-1 h-full">
          {[55, 80, 45, 90, 65].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background: i % 2 === 0 ? "#2563EB" : "#10B981",
                opacity: 0.85,
              }}
            />
          ))}
        </div>
      </GlassCard>

      <GlassCard className="right-[5%] top-[12%] w-[38%] h-[30%] rounded-xl p-3" delay={0.75}>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald" />
              <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-tech-blue" style={{ width: `${90 - i * 20}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="left-[15%] bottom-[8%] w-[70%] h-[28%] rounded-xl p-3" delay={0.9}>
        <div className="flex items-center gap-3 h-full">
          <div className="w-10 h-10 rounded-lg bg-tech-blue/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-tech-blue animate-pulse" />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-3/4 rounded-full bg-slate-300" />
            <div className="h-2 w-1/2 rounded-full bg-slate-200" />
          </div>
          <div className="text-xs font-bold text-tech-blue">Live</div>
        </div>
      </GlassCard>
    </div>

    {/* Floating fragments */}
    {[
      { top: "15%", left: "2%", rotate: -12 },
      { top: "60%", right: "3%", rotate: 8 },
      { bottom: "12%", left: "6%", rotate: -6 },
    ].map((pos, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 1 + i * 0.15, duration: 0.8 }}
        className="absolute w-10 h-10 border border-slate-200 bg-white shadow-lift rounded-lg"
        style={{
          ...pos,
          transform: `rotate(${pos.rotate}deg)`,
          backgroundImage: "linear-gradient(rgba(11,15,25,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(11,15,25,0.06) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      />
    ))}
  </div>
);

export default HeroWallVisual;
