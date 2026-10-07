
import { Link } from "react-router-dom";
import { LogoIcon } from "../../components/Logo";
import { Footer } from "../../components/Footer";
import { ThemeToggle } from "../../components/ThemeToggle";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
  MouseEvent as ReactMouseEvent,
} from "react";

function useLandingFonts() {
  useEffect(() => {
    const id = "landing-font-link";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,380;9..144,480;9..144,560;9..144,640&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const listener = () => setReduced(mq.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);
  return reduced;
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setY(window.scrollY);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

function Reveal({
  children,
  delayMs = 0,
}: {
  children: ReactNode;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delayMs}ms`,
        transformStyle: "preserve-3d",
        perspective: "1400px",
      }}
      className={`transition-all duration-[900ms] ease-out ${visible || reduced
        ? "opacity-100 translate-y-0 blur-0 [transform:rotateX(0deg)_scale(1)]"
        : "opacity-0 translate-y-16 blur-sm [transform:rotateX(20deg)_scale(0.94)]"
        }`}
    >
      {children}
    </div>
  );
}

const badges = [
  {
    label: "Verified Pro's",
    icon: <path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z" />,
  },
  {
    label: "Secure Escrow",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
  },
  {
    label: "Real-time Booking",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    label: "24/7 Support",
    icon: (
      <>
        <path d="M3 12a9 9 0 0118 0" />
        <path d="M3 12v3a2 2 0 002 2h1v-6H5a2 2 0 00-2 2z" />
        <path d="M21 12v3a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2z" />
      </>
    ),
  },
];

const steps = [
  {
    number: "1",
    title: "Post your job",
    description: "Describe what you need, add a few photos, and share your location.",
  },
  {
    number: "2",
    title: "Compare quotes",
    description: "Nearby professionals send you their price and availability in real time.",
  },
  {
    number: "3",
    title: "Hire and relax",
    description: "Pick the best offer, track progress, and pay securely once it's done.",
  },
];

const testimonials = [
  {
    quote: "Found a plumber within minutes and he was at my door the same evening. Genuinely saved my weekend.",
    name: "Priya K.",
    role: "Customer",
  },
  {
    quote: "As a worker, this app gave me a steady stream of nearby jobs without paying for ads.",
    name: "Arjun M.",
    role: "Electrician",
  },
  {
    quote: "The quote comparison made it so easy to pick someone I actually trusted.",
    name: "Fathima R.",
    role: "Customer",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Pointer-tracked 3D tilt, the kind you'd see on Linear/Stripe cards: the
// card leans toward the cursor and a soft light follows it, then eases
// back flat on leave.
function TiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>();
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const reduced = usePrefersReducedMotion();

  const handleMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (reduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 10;
      const rotateX = (0.5 - py) * 10;
      setStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`,
        transition: "transform 60ms linear",
      });
      setGlare({ x: px * 100, y: py * 100, opacity: 0.35 });
    },
    [reduced]
  );

  const handleLeave = useCallback(() => {
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)",
      transition: "transform 500ms cubic-bezier(0.22,1,0.36,1)",
    });
    setGlare((g) => ({ ...g, opacity: 0 }));
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ ...style, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px] transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(320px circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.55), transparent 60%)`,
        }}
      />
    </div>
  );
}

function RoleCard({
  role,
  title,
  description,
  ctaLabel,
  imageUrl,
}: {
  role: "customer" | "worker";
  title: string;
  description: string;
  ctaLabel: string;
  imageUrl: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <TiltCard className="relative group">
      <Link
        to="/signup"
        state={{ presetRole: role }}
        className="block bg-white rounded-[28px] border border-navy/10 overflow-hidden shadow-[0_1px_2px_rgba(11,30,51,0.06)] group-hover:shadow-[0_28px_56px_-18px_rgba(11,30,51,0.28)] group-hover:border-accent/40 transition-shadow duration-500"
      >
        <div className="h-56 relative overflow-hidden">
          {!imgFailed ? (
            <img
              src={imageUrl}
              alt=""
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${role === "customer"
                ? "bg-gradient-to-br from-navy to-navy/70"
                : "bg-gradient-to-br from-accent/90 to-navy"
                }`}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.4" className="opacity-80">
                {role === "customer" ? (
                  <>
                    <path d="M3 11l9-7 9 7" />
                    <path d="M5 10v10h14V10" />
                  </>
                ) : (
                  <>
                    <path d="M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3" />
                    <path d="M16 8l3-3" />
                  </>
                )}
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" />
          <span className="absolute top-4 left-4 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/85 border border-white/30 rounded-full px-3 py-1 backdrop-blur-sm">
            {role === "customer" ? "For customers" : "For professionals"}
          </span>
          <h3
            className="absolute bottom-4 left-5 right-5 text-xl text-white"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 560 }}
          >
            {title}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-navy/55 leading-relaxed mb-5">{description}</p>
          <span className="text-accent text-sm font-medium inline-flex items-center gap-1.5 group-hover:gap-3 transition-all duration-300">
            {ctaLabel}
            <span aria-hidden className="translate-y-[-1px]">→</span>
          </span>
        </div>
      </Link>
    </TiltCard>
  );
}

// Signature hero motif: concentric pulses radiating from a pinned location,
// standing in for "trusted help, right around the corner" — real-time,
// nearby, always-on. Drifts with scroll for depth.
function ProximityMark({ parallax }: { parallax: number }) {
  return (
    <div
      className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto select-none"
      style={{ transform: `translateY(${-parallax}px) rotate(${parallax * 0.06}deg)` }}
      aria-hidden
    >
      <style>{`
        @keyframes proximity-pulse {
          0%   { transform: scale(0.35); opacity: 0.55; }
          80%  { opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .proximity-ring { animation: proximity-pulse 3.2s cubic-bezier(0.3,0,0.4,1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .proximity-ring { animation: none; opacity: 0.25; }
        }
      `}</style>
      <div className="absolute inset-0 rounded-full border border-accent/25" />
      <div className="absolute inset-6 rounded-full border border-accent/25" />
      <div className="absolute inset-12 rounded-full border border-accent/30" />
      <span className="proximity-ring absolute inset-0 rounded-full border-2 border-accent" style={{ animationDelay: "0s" }} />
      <span className="proximity-ring absolute inset-0 rounded-full border-2 border-accent" style={{ animationDelay: "1.1s" }} />
      <span className="proximity-ring absolute inset-0 rounded-full border-2 border-accent" style={{ animationDelay: "2.2s" }} />

      {/* orbiting service dots */}
      <div className="absolute inset-0 animate-[spin_18s_linear_infinite]">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-navy shadow-[0_0_0_4px_rgba(255,255,255,0.9)]" />
        <div className="absolute bottom-6 left-6 w-2 h-2 rounded-full bg-accent shadow-[0_0_0_4px_rgba(255,255,255,0.9)]" />
        <div className="absolute bottom-10 right-4 w-2 h-2 rounded-full bg-navy/70 shadow-[0_0_0_4px_rgba(255,255,255,0.9)]" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center shadow-[0_16px_32px_-8px_rgba(11,30,51,0.45)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 21s-7-6.1-7-11a7 7 0 0114 0c0 4.9-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  useLandingFonts();
  const scrollY = useScrollY();
  const reduced = usePrefersReducedMotion();
  const heroParallax = reduced ? 0 : Math.min(scrollY * 0.18, 140);
  const blobParallaxA = reduced ? 0 : Math.min(scrollY * 0.08, 80);
  const blobParallaxB = reduced ? 0 : Math.min(scrollY * 0.12, 100);

  return (
    <div className="min-h-screen bg-[#FBFAF8] dark:bg-[#0B1513] text-navy dark:text-gray-100 overflow-x-clip transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FBFAF8]/85 dark:bg-[#101F1C]/90 backdrop-blur-md border-b border-navy/[0.06] dark:border-gray-800/80 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon className="w-8 h-8 rounded-lg shadow-[0_4px_10px_-2px_rgba(11,30,51,0.4)]" />
            <span className="text-navy dark:text-white font-semibold text-lg tracking-tight">Servixo</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-medium text-navy dark:text-white bg-white dark:bg-gray-800/80 border border-navy/10 dark:border-gray-700/80 px-4 py-2 rounded-full hover:border-accent hover:text-accent dark:hover:text-accent transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        {/* ambient depth blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-accent/20 blur-[90px]"
          style={{ transform: `translateY(${blobParallaxA}px)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 right-0 w-96 h-96 rounded-full bg-navy/10 blur-[100px]"
          style={{ transform: `translateY(${-blobParallaxB}px)` }}
        />

        <Reveal>
          <div className="relative text-center lg:text-left">
            <span className="inline-block text-[11px] font-semibold tracking-[0.22em] uppercase text-accent mb-5">
              Verified · Real-time · Nearby
            </span>
            <h1
              className="text-4xl sm:text-5xl text-navy dark:text-white leading-[1.08]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 560 }}
            >
              Trusted help,{" "}
              <span className="italic text-accent">right around the corner</span>
            </h1>
            <p className="text-navy/55 dark:text-gray-300 mt-6 max-w-md mx-auto lg:mx-0 leading-relaxed">
              The premium marketplace for on-demand home services and professional expertise.
              High-trust, real-time, and reliable.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={150}>
          <ProximityMark parallax={heroParallax} />
        </Reveal>
      </section>

      {/* How it works */}
      <Reveal delayMs={80}>
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2
            className="text-2xl text-navy dark:text-white text-center mb-12"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 560 }}
          >
            How it works
          </h2>
          <div className="relative grid sm:grid-cols-3 gap-10 sm:gap-6">
            <div className="hidden sm:block absolute top-6 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-navy/15 via-accent/40 to-navy/15 dark:from-white/10 dark:to-white/10" />
            {steps.map((step, i) => (
              <Reveal key={step.number} delayMs={i * 120}>
                <div className="relative text-center">
                  <div
                    className="w-12 h-12 mx-auto rounded-full bg-white dark:bg-[#142623] border border-navy/10 dark:border-gray-700 text-navy dark:text-white flex items-center justify-center mb-4 relative z-10 shadow-[0_6px_16px_-6px_rgba(11,30,51,0.25)]"
                    style={{ fontFamily: "'Fraunces', serif", fontWeight: 560 }}
                  >
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-navy dark:text-white mb-1.5 text-[15px]">{step.title}</h3>
                  <p className="text-sm text-navy/50 dark:text-gray-400 leading-relaxed max-w-[220px] mx-auto">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Role cards */}
      <section className="max-w-4xl mx-auto px-6 grid sm:grid-cols-2 gap-6 pb-20">
        <Reveal delayMs={100}>
          <RoleCard
            role="customer"
            title="I need a service"
            description="Find verified experts for repairs, cleaning, installations, and more in minutes."
            ctaLabel="Start exploring services"
            imageUrl="https://images.unsplash.com/photo-1759238136854-a43787126db7?fm=jpg&q=80&w=1200&auto=format&fit=crop"
          />
        </Reveal>
        <Reveal delayMs={250}>
          <RoleCard
            role="worker"
            title="I provide a service"
            description="Join our network of professionals and grow your business with high-quality leads."
            ctaLabel="List your professional services"
            imageUrl="https://media.istockphoto.com/id/1840366193/photo/close-up-of-repairman-in-uniform-standing-on-home-kitchen-and-holding-his-tool-bag.webp?a=1&b=1&s=612x612&w=0&k=20&c=hBeMiaGAVe3l2mQn9DZ6K2cEpZUH8LWKXnFPfjOHHME="
          />
        </Reveal>
      </section>

      {/* Testimonials */}
      <Reveal delayMs={100}>
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <h2
            className="text-2xl text-navy dark:text-white text-center mb-12"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 560 }}
          >
            What people are saying
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delayMs={i * 120}>
                <div className="bg-white dark:bg-[#132320] rounded-2xl border border-navy/[0.06] dark:border-gray-700/80 p-6 flex flex-col hover:border-accent/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-16px_rgba(11,30,51,0.2)] transition-all duration-300">
                  <span
                    className="text-accent/70 leading-none mb-1"
                    style={{ fontFamily: "'Fraunces', serif", fontSize: "2.75rem" }}
                    aria-hidden
                  >
                    &ldquo;
                  </span>
                  <p className="text-sm text-navy/65 dark:text-gray-300 leading-relaxed flex-1 -mt-3">{t.quote}</p>
                  <div className="mt-5 pt-4 border-t border-navy/[0.06] dark:border-gray-700/60 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy/[0.06] dark:bg-gray-700/60 text-navy dark:text-accent text-[11px] font-semibold flex items-center justify-center">
                      {initials(t.name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy dark:text-white leading-tight">{t.name}</p>
                      <p className="text-xs text-navy/40 dark:text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Trust badges */}
      <Reveal delayMs={100}>
        <section className="bg-navy">
          <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-4">
            {badges.map((badge, i) => (
              <div
                key={badge.label}
                className={`flex flex-col items-center text-center gap-3 py-4 sm:py-0 ${i !== 0 ? "sm:border-l sm:border-white/10" : ""
                  }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-accent">
                  {badge.icon}
                </svg>
                <span className="text-xs font-medium text-white/80 tracking-wide">{badge.label}</span>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Footer */}
      <Footer />
    </div>
  );
}