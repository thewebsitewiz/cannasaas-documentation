import { useState } from "react";

const COLORS = {
  forest: { hex: "#0A1F0A", name: "Dark Forest", role: "Backgrounds, primary text" },
  primary: { hex: "#1B5E20", name: "Primary Green", role: "Brand identity, headers, CTAs" },
  accent: { hex: "#4CAF50", name: "Accent Green", role: "Success states, highlights" },
  gold: { hex: "#C9A84C", name: "Brand Gold", role: "Accents, premium elements" },
  cream: { hex: "#F0F4E8", name: "Cream", role: "Light backgrounds, cards" },
  lightGreen: { hex: "#81C784", name: "Light Green", role: "Hover states, soft accents" },
  charcoal: { hex: "#2D2D2D", name: "Charcoal", role: "Secondary text" },
  midGray: { hex: "#6B7280", name: "Mid Gray", role: "Captions, muted text" },
  lightGray: { hex: "#E5E7EB", name: "Light Gray", role: "Borders, dividers" },
  white: { hex: "#FFFFFF", name: "White", role: "Backgrounds" },
};

const SEMANTIC = {
  error: { hex: "#D32F2F", name: "Error", token: "--color-error" },
  warning: { hex: "#F9A825", name: "Warning", token: "--color-warning" },
  success: { hex: "#4CAF50", name: "Success", token: "--color-success" },
  info: { hex: "#1565C0", name: "Info", token: "--color-info" },
};

const Icon = ({ size = 80 }) => (
  <svg viewBox="0 0 200 200" width={size} height={size}>
    <defs>
      <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1B5E20" />
        <stop offset="100%" stopColor="#4CAF50" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="90" fill="#0A1F0A" />
    <path d="M130 45C85 45 50 70 50 100C50 130 85 155 130 155L120 138C85 138 65 122 65 100C65 78 85 62 120 62Z" fill="url(#lg)" />
    <path d="M100 65C95 80 92 90 90 100C88 110 92 125 100 140" stroke="#C9A84C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <circle cx="100" cy="72" r="4" fill="#C9A84C" />
    <circle cx="92" cy="100" r="4" fill="#C9A84C" />
    <circle cx="100" cy="132" r="4" fill="#C9A84C" />
  </svg>
);

const Wordmark = ({ variant = "light", scale = 1 }) => {
  const isDark = variant === "dark";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 * scale }}>
      <Icon size={56 * scale} />
      <div>
        <div style={{ fontSize: 36 * scale, fontWeight: 700, fontFamily: "'Outfit', sans-serif", letterSpacing: -1, lineHeight: 1 }}>
          <span style={{ color: isDark ? "#F0F4E8" : "#0A1F0A" }}>Canna</span>
          <span style={{ color: isDark ? "#4CAF50" : "#1B5E20" }}>SaaS</span>
        </div>
        <div style={{ fontSize: 9 * scale, fontWeight: 300, color: "#C9A84C", letterSpacing: 5, fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
          DISPENSARY INTELLIGENCE
        </div>
      </div>
    </div>
  );
};

const Section = ({ id, children }) => (
  <section id={id} style={{ padding: "60px 0", borderBottom: "1px solid #E5E7EB" }}>{children}</section>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 700, color: "#0A1F0A", margin: 0, lineHeight: 1.2 }}>{children}</h2>
    {sub && <p style={{ fontFamily: "'Crimson Pro', serif", fontSize: 16, color: "#6B7280", marginTop: 8 }}>{sub}</p>}
  </div>
);

const ColorSwatch = ({ hex, name, role, large }) => {
  const [copied, setCopied] = useState(false);
  const brightness = parseInt(hex.slice(1, 3), 16) * 299 + parseInt(hex.slice(3, 5), 16) * 587 + parseInt(hex.slice(5, 7), 16) * 114;
  const textColor = brightness / 1000 < 140 ? "#fff" : "#0A1F0A";
  return (
    <div
      onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      style={{
        background: hex, borderRadius: 10, padding: large ? "28px 20px" : "16px 14px",
        minHeight: large ? 140 : 100, cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(10,31,10,0.08)",
        border: hex === "#FFFFFF" ? "1px solid #E5E7EB" : "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,31,10,0.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(10,31,10,0.08)"; }}
    >
      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: large ? 15 : 13, color: textColor }}>{copied ? "Copied!" : name}</div>
      <div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: textColor, opacity: 0.8 }}>{hex.toUpperCase()}</div>
        {role && <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 11, color: textColor, opacity: 0.6, marginTop: 4 }}>{role}</div>}
      </div>
    </div>
  );
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "logos", label: "Logos" },
  { id: "colors", label: "Colors" },
  { id: "typography", label: "Typography" },
  { id: "elements", label: "Elements" },
  { id: "tokens", label: "Tokens" },
  { id: "voice", label: "Voice" },
];

export default function BrandGuide() {
  const [activeNav, setActiveNav] = useState("overview");
  const [logoBg, setLogoBg] = useState("light");

  const scrollTo = (id) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", color: "#2D2D2D", background: "#FAFBF8" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&family=Crimson+Pro:ital,wght@0,400;0,700;1,400&family=DM+Mono&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100, background: "#0A1F0A",
        borderBottom: "2px solid #C9A84C", padding: "12px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon size={32} />
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 18, color: "#F0F4E8" }}>
            Canna<span style={{ color: "#4CAF50" }}>SaaS</span>
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C9A84C", marginLeft: 8, padding: "2px 8px", border: "1px solid #C9A84C33", borderRadius: 4 }}>
            BRAND v1.0
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {NAV_ITEMS.map(n => (
            <button
              key={n.id}
              onClick={() => scrollTo(n.id)}
              style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: activeNav === n.id ? 700 : 400,
                color: activeNav === n.id ? "#C9A84C" : "#81C784", background: "none", border: "none",
                cursor: "pointer", padding: "6px 12px", borderRadius: 6,
                backgroundColor: activeNav === n.id ? "#1B5E2033" : "transparent",
                transition: "all 0.2s",
              }}
            >{n.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px" }}>

        {/* OVERVIEW */}
        <Section id="overview">
          <div style={{ textAlign: "center", padding: "40px 0 20px" }}>
            <Icon size={100} />
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 48, fontWeight: 700, margin: "24px 0 8px", color: "#0A1F0A" }}>
              Canna<span style={{ color: "#1B5E20" }}>SaaS</span>
            </h1>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#C9A84C", letterSpacing: 6, fontWeight: 300 }}>
              DISPENSARY INTELLIGENCE
            </div>
            <p style={{ maxWidth: 600, margin: "24px auto 0", fontSize: 17, lineHeight: 1.7, color: "#6B7280" }}>
              The affordable, compliance-first dispensary management platform purpose-built for independent cannabis retailers in NY, NJ, and CT.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 40 }}>
            {[
              { title: "Compliance-First", desc: "Every feature validates against state regulations" },
              { title: "Operator Empathy", desc: "Built for the pressure of small regulated business" },
              { title: "Modern & Clean", desc: "Premium SaaS, not dispensary cliché" },
              { title: "Accessible Value", desc: "Enterprise power at indie prices" },
            ].map((p, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "20px 16px", borderLeft: "4px solid #1B5E20", boxShadow: "0 2px 8px rgba(10,31,10,0.06)" }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", marginBottom: 6 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* LOGOS */}
        <Section id="logos">
          <SectionTitle sub="The CannaSaaS logo comprises an icon mark and wordmark. Use together or independently.">Logo System</SectionTitle>

          {/* Background toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["light", "dark", "cream"].map(bg => (
              <button key={bg} onClick={() => setLogoBg(bg)} style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 12, padding: "6px 16px", borderRadius: 6,
                border: logoBg === bg ? "2px solid #1B5E20" : "1px solid #E5E7EB",
                background: bg === "dark" ? "#0A1F0A" : bg === "cream" ? "#F0F4E8" : "#fff",
                color: bg === "dark" ? "#F0F4E8" : "#0A1F0A", cursor: "pointer", fontWeight: logoBg === bg ? 700 : 400,
              }}>{bg.charAt(0).toUpperCase() + bg.slice(1)} BG</button>
            ))}
          </div>

          {/* Logo display */}
          <div style={{
            background: logoBg === "dark" ? "#0A1F0A" : logoBg === "cream" ? "#F0F4E8" : "#fff",
            borderRadius: 12, padding: 48, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #E5E7EB", minHeight: 180,
            backgroundImage: logoBg === "dark" ? "repeating-linear-gradient(45deg, transparent, transparent 30px, #0D260D 30px, #0D260D 31px)" : "none",
          }}>
            <Wordmark variant={logoBg === "dark" ? "dark" : "light"} scale={1.2} />
          </div>

          {/* Variants grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24 }}>
            <div style={{ background: "#fff", borderRadius: 10, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "1px solid #E5E7EB" }}>
              <Icon size={64} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B7280" }}>Icon Mark</span>
            </div>
            <div style={{ background: "#0A1F0A", borderRadius: 10, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: -1 }}>
                <span style={{ color: "#F0F4E8" }}>Canna</span><span style={{ color: "#4CAF50" }}>SaaS</span>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#81C784" }}>Reversed Wordmark</span>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid #E5E7EB" }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: -1, color: "#0A1F0A" }}>
                CannaSaaS
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B7280" }}>Monochrome</span>
            </div>
          </div>

          {/* Rules */}
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: "#E8F5E9", borderRadius: 10, padding: 20 }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#1B5E20", marginBottom: 12 }}>✓ Do</div>
              {["Use on approved background colors", "Maintain clear space (1× icon height)", "Use provided SVG/PNG files", "Minimum icon: 24px digital, 0.375\" print"].map((r, i) => (
                <div key={i} style={{ fontSize: 13, color: "#2D2D2D", padding: "4px 0", lineHeight: 1.5 }}>• {r}</div>
              ))}
            </div>
            <div style={{ background: "#FFEBEE", borderRadius: 10, padding: 20 }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#D32F2F", marginBottom: 12 }}>✗ Don't</div>
              {["Rotate, skew, or distort", "Change colors outside variants", "Add shadows or effects", "Place on busy backgrounds"].map((r, i) => (
                <div key={i} style={{ fontSize: 13, color: "#2D2D2D", padding: "4px 0", lineHeight: 1.5 }}>• {r}</div>
              ))}
            </div>
          </div>
        </Section>

        {/* COLORS */}
        <Section id="colors">
          <SectionTitle sub="A palette balancing deep, trustworthy greens with gold accents and warm cream.">Color Palette</SectionTitle>

          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", marginBottom: 12 }}>Primary Palette</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {Object.entries(COLORS).slice(0, 5).map(([k, v]) => (
              <ColorSwatch key={k} {...v} large />
            ))}
          </div>

          {/* Usage ratio */}
          <div style={{ marginTop: 24, marginBottom: 8, fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: "#0A1F0A" }}>Usage Ratio</div>
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 28 }}>
            {[["#0A1F0A", 40], ["#1B5E20", 25], ["#F0F4E8", 20], ["#C9A84C", 10], ["#4CAF50", 5]].map(([c, p], i) => (
              <div key={i} style={{ background: c, flex: p, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: i < 2 || i === 4 ? "#fff" : "#0A1F0A" }}>{p}%</span>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", marginTop: 32, marginBottom: 12 }}>Extended Palette</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {Object.entries(COLORS).slice(5).map(([k, v]) => (
              <ColorSwatch key={k} {...v} />
            ))}
          </div>

          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", marginTop: 32, marginBottom: 12 }}>Semantic Colors</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {Object.entries(SEMANTIC).map(([k, v]) => (
              <ColorSwatch key={k} hex={v.hex} name={v.name} role={v.token} />
            ))}
          </div>
        </Section>

        {/* TYPOGRAPHY */}
        <Section id="typography">
          <SectionTitle sub="A three-tier type system: display (Outfit), body (Crimson Pro), and mono (DM Mono).">Typography</SectionTitle>

          {[
            { name: "Outfit", role: "Display", family: "'Outfit', sans-serif", sample: "Aa Bb Cc Dd — 0123456789", desc: "Headlines, navigation, buttons, labels, logo wordmark", weights: "300 Light · 400 Regular · 700 Bold", link: "fonts.google.com/specimen/Outfit" },
            { name: "Crimson Pro", role: "Body", family: "'Crimson Pro', serif", sample: "Aa Bb Cc Dd — 0123456789", desc: "Body copy, descriptions, long-form content, marketing", weights: "400 Regular · 400 Italic · 700 Bold", link: "fonts.google.com/specimen/Crimson+Pro" },
            { name: "DM Mono", role: "Monospace", family: "'DM Mono', monospace", sample: "Aa Bb Cc Dd — 0123456789", desc: "Code, data tables, metric displays, compliance IDs", weights: "400 Regular", link: "fonts.google.com/specimen/DM+Mono" },
          ].map((t, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: 24, marginBottom: 16, border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <div>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: "#1B5E20" }}>{t.role.toUpperCase()}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#6B7280", marginLeft: 12 }}>{t.name}</span>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C9A84C" }}>{t.link}</span>
              </div>
              <div style={{ fontFamily: t.family, fontSize: 36, fontWeight: 700, color: "#0A1F0A", marginBottom: 8 }}>{t.sample}</div>
              <div style={{ fontFamily: t.family, fontSize: 15, color: "#6B7280", marginBottom: 4 }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #E5E7EB" }}>
                <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: 13, color: "#6B7280" }}>{t.desc}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B7280" }}>{t.weights}</span>
              </div>
            </div>
          ))}

          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", margin: "24px 0 16px" }}>Type Scale</div>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, border: "1px solid #E5E7EB" }}>
            {[
              { label: "Display XL", size: 36, font: "'Outfit', sans-serif", weight: 700, spec: "36px / 2.25rem" },
              { label: "Display", size: 28, font: "'Outfit', sans-serif", weight: 700, spec: "28px / 1.75rem" },
              { label: "H1", size: 22, font: "'Outfit', sans-serif", weight: 700, spec: "22px / 1.375rem" },
              { label: "H2", size: 18, font: "'Outfit', sans-serif", weight: 700, spec: "18px / 1.125rem" },
              { label: "Body", size: 16, font: "'Crimson Pro', serif", weight: 400, spec: "16px / 1rem" },
              { label: "Small", size: 13, font: "'Crimson Pro', serif", weight: 400, spec: "13px / 0.8125rem" },
              { label: "Mono", size: 13, font: "'DM Mono', monospace", weight: 400, spec: "13px / 0.8125rem" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: i < 6 ? "1px solid #F0F4E8" : "none" }}>
                <span style={{ fontFamily: s.font, fontWeight: s.weight, fontSize: Math.min(s.size, 28), color: "#0A1F0A" }}>{s.label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#C9A84C" }}>{s.spec}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* DESIGN ELEMENTS */}
        <Section id="elements">
          <SectionTitle sub="Patterns, borders, radii, and shadows that reinforce the systematic brand identity.">Design Elements</SectionTitle>

          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", marginBottom: 12 }}>Patterns</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
            {/* Diagonal */}
            <div style={{
              background: "#0A1F0A", borderRadius: 10, height: 120, position: "relative", overflow: "hidden",
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 14px, #132F13 14px, #132F13 15px)",
              display: "flex", alignItems: "flex-end", padding: 12,
            }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C9A84C" }}>Diagonal Hatch</span>
            </div>
            {/* Dots */}
            <div style={{
              background: "#F0F4E8", borderRadius: 10, height: 120, position: "relative", overflow: "hidden",
              backgroundImage: "radial-gradient(#D5DFD0 2px, transparent 2px)", backgroundSize: "12px 12px",
              display: "flex", alignItems: "flex-end", padding: 12,
            }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#1B5E20" }}>Dot Grid</span>
            </div>
            {/* Gradient mesh */}
            <div style={{
              borderRadius: 10, height: 120, overflow: "hidden",
              background: "linear-gradient(135deg, #0A1F0A 0%, #1B5E20 40%, #4CAF50 70%, #C9A84C 100%)",
              display: "flex", alignItems: "flex-end", padding: 12,
            }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#fff" }}>Brand Gradient</span>
            </div>
          </div>

          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", marginBottom: 12 }}>Corner Radius</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
            {[["2px", 2], ["4px", 4], ["8px", 8], ["12px", 12], ["Full", 99]].map(([label, r]) => (
              <div key={label} style={{
                width: 72, height: 56, borderRadius: r, background: "#F0F4E8", border: "2px solid #1B5E20",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#0A1F0A",
              }}>{label}</div>
            ))}
          </div>

          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", marginBottom: 12 }}>Shadows</div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              ["sm", "0 1px 2px rgba(10,31,10,0.06)"],
              ["md", "0 4px 6px rgba(10,31,10,0.10)"],
              ["lg", "0 10px 15px rgba(10,31,10,0.12)"],
              ["xl", "0 20px 25px rgba(10,31,10,0.15)"],
            ].map(([label, shadow]) => (
              <div key={label} style={{
                width: 100, height: 72, borderRadius: 10, background: "#fff", boxShadow: shadow,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: "#0A1F0A" }}>{label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#6B7280", marginTop: 4 }}>shadow-{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* TOKENS */}
        <Section id="tokens">
          <SectionTitle sub="CSS custom properties for consistent implementation across all applications.">Design Tokens</SectionTitle>
          <div style={{
            background: "#0A1F0A", borderRadius: 12, padding: 28, fontFamily: "'DM Mono', monospace",
            fontSize: 13, lineHeight: 2, color: "#81C784", overflow: "auto",
          }}>
            <div style={{ color: "#6B7280" }}>{"/* CannaSaaS Design Tokens */"}</div>
            <div style={{ color: "#F0F4E8" }}>{":root {"}</div>
            <br/>
            <div style={{ color: "#C9A84C" }}>{"  /* ── Colors ── */"}</div>
            {Object.entries(COLORS).map(([k, v]) => (
              <div key={k}>{"  "}<span style={{ color: "#81C784" }}>--color-{k}</span>: <span style={{ color: "#F0F4E8" }}>{v.hex}</span>;</div>
            ))}
            <br/>
            <div style={{ color: "#C9A84C" }}>{"  /* ── Typography ── */"}</div>
            <div>{"  "}<span style={{ color: "#81C784" }}>--font-display</span>: <span style={{ color: "#F0F4E8" }}>'Outfit', sans-serif</span>;</div>
            <div>{"  "}<span style={{ color: "#81C784" }}>--font-body</span>: <span style={{ color: "#F0F4E8" }}>'Crimson Pro', serif</span>;</div>
            <div>{"  "}<span style={{ color: "#81C784" }}>--font-mono</span>: <span style={{ color: "#F0F4E8" }}>'DM Mono', monospace</span>;</div>
            <br/>
            <div style={{ color: "#C9A84C" }}>{"  /* ── Spacing (4px base) ── */"}</div>
            {["xs: 4px", "sm: 8px", "md: 12px", "lg: 16px", "xl: 24px", "2xl: 32px", "3xl: 48px", "4xl: 64px"].map(s => {
              const [token, val] = s.split(": ");
              return <div key={token}>{"  "}<span style={{ color: "#81C784" }}>--space-{token}</span>: <span style={{ color: "#F0F4E8" }}>{val}</span>;</div>;
            })}
            <br/>
            <div style={{ color: "#C9A84C" }}>{"  /* ── Radius ── */"}</div>
            {["sm: 4px", "md: 8px", "lg: 12px", "full: 9999px"].map(r => {
              const [token, val] = r.split(": ");
              return <div key={token}>{"  "}<span style={{ color: "#81C784" }}>--radius-{token}</span>: <span style={{ color: "#F0F4E8" }}>{val}</span>;</div>;
            })}
            <br/>
            <div style={{ color: "#C9A84C" }}>{"  /* ── Shadows ── */"}</div>
            <div>{"  "}<span style={{ color: "#81C784" }}>--shadow-sm</span>: <span style={{ color: "#F0F4E8" }}>0 1px 2px rgba(10,31,10,0.06)</span>;</div>
            <div>{"  "}<span style={{ color: "#81C784" }}>--shadow-md</span>: <span style={{ color: "#F0F4E8" }}>0 4px 6px rgba(10,31,10,0.10)</span>;</div>
            <div>{"  "}<span style={{ color: "#81C784" }}>--shadow-lg</span>: <span style={{ color: "#F0F4E8" }}>0 10px 15px rgba(10,31,10,0.12)</span>;</div>
            <div>{"  "}<span style={{ color: "#81C784" }}>--shadow-xl</span>: <span style={{ color: "#F0F4E8" }}>0 20px 25px rgba(10,31,10,0.15)</span>;</div>
            <br/>
            <div style={{ color: "#F0F4E8" }}>{"}"}</div>
          </div>
        </Section>

        {/* VOICE */}
        <Section id="voice">
          <SectionTitle sub="How CannaSaaS speaks — confident, clear, warm, action-oriented.">Voice & Tone</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { attr: "Authoritative, not arrogant", desc: "We know compliance inside and out. We lead with expertise, not ego." },
              { attr: "Clear, not dumbed-down", desc: "Complex regulations explained simply — without losing precision." },
              { attr: "Warm, not casual", desc: "Professional and approachable. We care about your success." },
              { attr: "Action-oriented, not pushy", desc: "We guide toward next steps. Every message has purpose." },
            ].map((v, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 10, padding: 20, borderLeft: "4px solid #1B5E20", boxShadow: "0 2px 8px rgba(10,31,10,0.06)" }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#0A1F0A", marginBottom: 6 }}>{v.attr}</div>
                <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#E8F5E9", borderRadius: 10, padding: 24 }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#1B5E20", marginBottom: 16 }}>✓ Write Like This</div>
              {[
                `"Your Metrc sync completed — 47 packages verified against state records."`,
                `"Start your free trial. No credit card, no per-transaction fees, ever."`,
                `"Compliance dashboard updated with the latest NJ CRC rule changes."`,
              ].map((ex, i) => (
                <div key={i} style={{ fontFamily: "'Crimson Pro', serif", fontSize: 14, color: "#2D2D2D", padding: "8px 0", borderBottom: i < 2 ? "1px solid #C8E6C9" : "none", lineHeight: 1.6 }}>{ex}</div>
              ))}
            </div>
            <div style={{ background: "#FFEBEE", borderRadius: 10, padding: 24 }}>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: "#D32F2F", marginBottom: 16 }}>✗ Not Like This</div>
              {[
                `"Hey! Your stuff synced. All good fam!"`,
                `"SIGN UP NOW before it's too late!!"`,
                `"Blaze through your compliance!"`,
              ].map((ex, i) => (
                <div key={i} style={{ fontFamily: "'Crimson Pro', serif", fontSize: 14, color: "#2D2D2D", padding: "8px 0", borderBottom: i < 2 ? "1px solid #FFCDD2" : "none", lineHeight: 1.6, textDecoration: "line-through", opacity: 0.7 }}>{ex}</div>
              ))}
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "48px 0 32px", borderTop: "2px solid #C9A84C", marginTop: 32 }}>
          <Icon size={40} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6B7280", marginTop: 12 }}>
            © 2025–2026 CannaSaaS Inc. · Brand Guidelines v1.0 · Confidential
          </div>
        </div>
      </div>
    </div>
  );
}
