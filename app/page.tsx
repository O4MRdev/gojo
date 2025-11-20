'use client';

import { useMemo, useState } from 'react';
import {
  masterOfTheSwordsMenu,
  MenuButton,
  MenuIcon,
  MenuPanel,
} from '@/types/game';
import { motion } from 'framer-motion';

const swordGlows: Record<NonNullable<MenuIcon['glow']>, string> = {
  ember: 'rgba(215, 146, 52, 0.65)',
  frost: 'rgba(108, 197, 255, 0.65)',
  void: 'rgba(167, 123, 255, 0.65)',
};

const decorativeSwords = [
  { id: 'sentinel-left', left: '12%', rotate: -12, hue: 'rgba(215,146,52,0.4)', delay: 0 },
  { id: 'sentinel-right', left: '88%', rotate: 12, hue: 'rgba(108,197,255,0.35)', delay: 0.3 },
  { id: 'sentinel-center', left: '50%', rotate: 0, hue: 'rgba(160,122,255,0.35)', delay: 0.5 },
];

const createParticles = () =>
  Array.from({ length: 28 }, (_, index) => ({
    id: `ash-${index}`,
    left: Math.random() * 100,
    top: 30 + Math.random() * 50,
    size: 1 + Math.random() * 3,
    delay: Math.random() * 6,
    duration: 6 + Math.random() * 8,
  }));

export default function Home() {
  const menu = masterOfTheSwordsMenu;
  const { theme, panels, footer } = menu;

  const [activeButton, setActiveButton] = useState<MenuButton>(panels[0].items[0]);
  const particles = useMemo(createParticles, []);

  const accentColors: Record<'primary' | 'secondary' | 'warning', string> = {
    primary: theme.palette.accent,
    secondary: theme.palette.accentSecondary,
    warning: '#ff6b6b',
  };

  const activeAccent =
    accentColors[activeButton.accent ?? 'primary'] ?? theme.palette.accent;

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: theme.palette.background }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,87,235,0.35),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="pointer-events-none absolute rounded-full bg-white/40"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], y: -80 }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}

      {decorativeSwords.map((sword) => (
        <DecorativeSword key={sword.id} {...sword} />
      ))}

      <main className="relative z-10 px-6 pb-12 pt-16 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row">
          <motion.section
            className="flex-1 space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/60">
                Arcane UI Protocol
                <span className="h-px w-16 bg-white/30" />
              </p>
              <h1
                className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl"
                style={{ fontFamily: theme.typography.title }}
              >
                {menu.title}
              </h1>
              <p
                className="text-lg text-white/80 lg:text-xl"
                style={{ fontFamily: theme.typography.subtitle }}
              >
                {menu.tagline}
              </p>
            </div>

            <ActiveActionCard button={activeButton} accentColor={activeAccent} />

            <div className="flex flex-wrap gap-6 text-sm text-white/60">
              <div>
                <p className="uppercase tracking-[0.3em] text-xs text-white/40">Version</p>
                <p className="text-white text-base font-semibold">{menu.version}</p>
              </div>
              <div>
                <p className="uppercase tracking-[0.3em] text-xs text-white/40">Blades Ready</p>
                <p className="text-white text-base font-semibold">
                  {theme.swords.count} twin sentinels
                </p>
              </div>
              <div>
                <p className="uppercase tracking-[0.3em] text-xs text-white/40">Ambient</p>
                <p className="text-white text-base font-semibold capitalize">
                  {theme.ambient.hum} hum | bloom {theme.ambient.bloomLevel}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="flex-1 space-y-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            {panels.map((panel) => (
              <MenuPanelCard
                key={panel.id}
                panel={panel}
                activeButtonId={activeButton.id}
                onSelect={setActiveButton}
                accentColors={accentColors}
              />
            ))}
          </motion.section>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-12 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row">
          <div className="flex-1 rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Whispers</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {footer.hints.map((hint) => (
                <p key={hint} className="text-sm leading-relaxed text-white/80">
                  {hint}
                </p>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-black/40 p-6 text-xs uppercase tracking-[0.2em] text-white/60">
            {footer.legal}
          </div>
        </div>
      </footer>
    </div>
  );
}

function MenuPanelCard({
  panel,
  activeButtonId,
  onSelect,
  accentColors,
}: {
  panel: MenuPanel;
  activeButtonId: string;
  onSelect: (button: MenuButton) => void;
  accentColors: Record<'primary' | 'secondary' | 'warning', string>;
}) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-white/15 p-6 shadow-2xl"
      style={{ background: panel.background }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50 blur-3xl"
        style={{ boxShadow: `0 0 120px ${panel.borderGlow}` }}
      />
      <div className="relative z-10 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">{panel.title}</p>
          {panel.subtitle && (
            <p className="text-sm text-white/80">{panel.subtitle}</p>
          )}
        </div>

        <div className="space-y-4">
          {panel.items.map((button) => {
            const accent =
              accentColors[button.accent ?? 'primary'] ?? accentColors.primary;
            const isActive = button.id === activeButtonId;

            return (
              <motion.button
                key={button.id}
                onMouseEnter={() => onSelect(button)}
                onFocus={() => onSelect(button)}
                onClick={() => onSelect(button)}
                className={`relative flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition ${
                  isActive
                    ? 'border-white/60 bg-white/10 shadow-[0_0_25px_rgba(255,255,255,0.3)]'
                    : 'border-white/15 bg-black/20 hover:border-white/40'
                }`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <SwordIcon icon={button.icon} accentColor={accent} />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-lg font-semibold text-white">{button.label}</p>
                    {button.shortcut && (
                      <span className="rounded border border-white/30 px-2 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
                        {button.shortcut}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70">{button.description}</p>
                  <span
                    className="text-xs uppercase tracking-[0.4em]"
                    style={{ color: accent }}
                  >
                    {button.action}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ActiveActionCard({
  button,
  accentColor,
}: {
  button: MenuButton;
  accentColor: string;
}) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-white/20 bg-black/40 p-6 shadow-2xl backdrop-blur-md"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50 blur-3xl"
        style={{ boxShadow: `0 0 120px ${accentColor}` }}
      />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="rounded-full border px-3 py-1 text-xs uppercase tracking-[0.35em]"
            style={{
              borderColor: accentColor,
              color: accentColor,
            }}
          >
            {button.action}
          </div>
          <span className="text-xs uppercase tracking-[0.4em] text-white/50">
            Sword Protocol
          </span>
        </div>

        <h2 className="text-3xl font-bold text-white">{button.label}</h2>
        <p className="text-base text-white/70">{button.description}</p>

        <div className="flex items-center gap-6 text-sm text-white/80">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Shortcut</p>
            <p className="font-semibold">
              {button.shortcut ?? 'Enter'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Status</p>
            <p className="font-semibold">Ready</p>
          </div>
        </div>

        <motion.button
          className="mt-2 inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold text-black"
          style={{ background: accentColor }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Engage {button.label}
          <span className="text-sm tracking-[0.5em]">{'>>'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

function SwordIcon({
  icon,
  accentColor,
}: {
  icon?: MenuIcon;
  accentColor: string;
}) {
  if (!icon) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20">
        <span className="text-sm tracking-[0.5em]">||</span>
      </div>
    );
  }

  const blade = icon.bladeFinish === 'obsidian' ? '#0f0b18' : '#f8f2ff';
  const glow = (icon.glow && swordGlows[icon.glow]) || `${accentColor}55`;

  return (
    <svg
      width="44"
      height="48"
      viewBox="0 0 44 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
      aria-hidden="true"
    >
      <rect
        x="21"
        y="4"
        width="2"
        height="24"
        rx="1"
        fill={blade}
        stroke={accentColor}
        strokeWidth="0.6"
      />
      <rect
        x="15"
        y="26"
        width="14"
        height="3"
        rx="1.5"
        fill={accentColor}
      />
      <rect
        x="19"
        y="29"
        width="6"
        height="12"
        rx="2"
        fill="#1b102c"
        stroke={accentColor}
        strokeWidth="0.6"
      />
      <circle cx="22" cy="42" r="3" fill={accentColor} />
    </svg>
  );
}

function DecorativeSword({
  left,
  rotate,
  hue,
  delay,
}: {
  left: string;
  rotate: number;
  hue: string;
  delay: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute top-[-20vh] h-[150vh] w-[3px] origin-top"
      style={{
        left,
        background: `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, ${hue} 50%, transparent 100%)`,
      }}
      initial={{ opacity: 0, scaleY: 0.6, rotate }}
      animate={{ opacity: 0.35, scaleY: 1, rotate }}
      transition={{ delay, duration: 1.2, ease: 'easeOut' }}
    >
      <div className="absolute top-[18%] left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-white/70" />
      <div className="absolute top-[18%] left-1/2 h-4 w-3 -translate-x-1/2 rounded-b-full bg-black/60" />
      <div className="absolute bottom-6 left-1/2 h-8 w-2 -translate-x-1/2 rounded-full bg-[#1b0f2a]/80" />
    </motion.div>
  );
}
