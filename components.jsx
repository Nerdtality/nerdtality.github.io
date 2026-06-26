// components.jsx — minimal personal page with terminal typewriter

// ── TerminalType ─────────────────────────────────────────────────────────
// Types out a sequence of tokens character-by-character. Supports inline
// className segments and <br /> breaks. Blinking caret while typing,
// settled blink when done. Calls onDone after the final char.
function TerminalType({ tokens, charDelay = 70, startDelay = 0, onDone, caret = true, caretClass = "tt-caret" }) {
  const totalChars = React.useMemo(
    () => tokens.reduce((s, t) => s + (t.type === "type" ? t.text.length : 0), 0),
    [tokens]
  );
  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    let timer;
    const tick = (n) => {
      if (cancelled) return;
      setShown(n);
      if (n < totalChars) {
        timer = setTimeout(() => tick(n + 1), charDelay);
      } else if (onDone) {
        timer = setTimeout(onDone, 280);
      }
    };
    timer = setTimeout(() => tick(0), startDelay);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  let remaining = shown;
  const out = [];
  let stopped = false;
  for (let i = 0; i < tokens.length; i++) {
    if (stopped) break;
    const t = tokens[i];
    if (t.type === "br") {
      out.push(<br key={i} />);
    } else {
      const take = Math.min(remaining, t.text.length);
      remaining -= take;
      out.push(
        <span key={i} className={t.className || ""}>{t.text.slice(0, take)}</span>
      );
      if (take < t.text.length) stopped = true;
    }
  }
  const done = shown >= totalChars;
  return (
    <>
      {out}
      {caret && <span className={done ? caretClass : `${caretClass} tt-typing`}></span>}
    </>
  );
}

// ── CountUp ──────────────────────────────────────────────
// Animates an integer from 0 up to `to` once. Respects reduced motion.
// Renders the number, then `suffix` after (e.g. "+ in IT & infrastructure").
function CountUp({ to, suffix = "", duration = 1400, startDelay = 800 }) {
  const reduce = typeof window !== "undefined" &&
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = React.useState(reduce ? to : 0);
  React.useEffect(() => {
    if (reduce) return;
    let raf;
    const begin = performance.now() + startDelay;
    const tick = (t) => {
      const elapsed = t - begin;
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, startDelay, reduce]);
  const done = n >= to;
  return (
    <>
      <span className={"count-num" + (done ? " count-done" : " count-running")}>{n}</span>
      {suffix}
    </>
  );
}

function ClockChip() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return (
    <div>
      <span className="k">MDT</span>
      <span className="v" style={{ fontVariantNumeric: "tabular-nums" }}>{time}</span>
    </div>
  );
}

function Topbar() {
  return (
    <div className="topbar">
      <div className="lockup">
        <span className="glyph">CD</span>
        <span style={{ letterSpacing: "0.02em" }}>chancedority.com</span>
      </div>
      <div className="meta">
        <div>
          <span className="dot"></span>
          <span className="k">in</span>
          <span className="v">Denver, CO</span>
        </div>
        <ClockChip />
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────
// Hero terminal + the calmer copy beneath. When `get in touch` is clicked,
// the contact wizard renders *inside* the same terminal — no popup, no
// scary breach flicker — and the page outside dims so focus stays on
// the conversation.
function Card({ nameStyle = "plain", contactActive, setContactActive }) {
  const [step, setStep] = React.useState(0);
  const bodyRef = React.useRef(null);

  const Prompt = ({ scope }) => (
    <span className="t-prompt">
      <span className="user">chance@denver</span>
      <span className="path">:~{scope ? `/${scope}` : ""}</span>
      <span className="dollar">#</span>
      <span className="t-prompt-sp">{'\u00A0'}</span>
    </span>
  );

  // Open contact mode: dim page + activate inline wizard.
  const handleOpenContact = () => {
    if (contactActive) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setContactActive(true);
  };
  const handleCloseContact = () => setContactActive(false);

  // Lock background scroll while contact is active + esc-to-close from anywhere
  React.useEffect(() => {
    if (!contactActive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") handleCloseContact();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [contactActive]);

  // Auto-scroll terminal body as new contact lines appear
  React.useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  });

  return (
    <main className="card-wrap">
      <section className="card">
        <div
          className={"terminal reveal r2" + (contactActive ? " is-active" : "")}
          role="img"
          aria-label="Terminal: whoami → chance dority. cat motto.txt → Boring infrastructure is good infrastructure."
        >
          <header className="t-head">
            <span className="t-dot t-red" onClick={contactActive ? handleCloseContact : undefined}
                  role={contactActive ? "button" : undefined}
                  aria-label={contactActive ? "Close contact" : undefined}
                  title={contactActive ? "Close" : undefined}></span>
            <span className="t-dot t-yellow"></span>
            <span className="t-dot t-green"></span>
            <span className="t-title">
              {contactActive ? "chance@denver : compose : 80×24" : "chance@denver : zsh : 80×24"}
            </span>
            {contactActive && (
              <button type="button" className="cm-x" onClick={handleCloseContact} aria-label="Close">esc</button>
            )}
          </header>
          <div className="t-body" ref={bodyRef}>
            <div className="t-line">
              <Prompt />
              <TerminalType
                tokens={[{ type: "type", text: "whoami" }]}
                charDelay={60}
                startDelay={600}
                onDone={() => setStep(1)}
                caret={step < 1}
                caretClass="tt-caret tt-mono"
              />
            </div>
            <div className={"t-line t-out " + (nameStyle === "ascii" ? "t-name-ascii" : "t-name")}>
              {step >= 1 && (
                nameStyle === "ascii" ? (
                  <AsciiName onDone={() => setStep(3)} />
                ) : (
                  <EchoLine onDone={() => setStep(3)} delay={420}>chance dority</EchoLine>
                )
              )}
            </div>
            <div className="t-line t-blank">&nbsp;</div>
            <div className="t-line">
              {step >= 3 && (
                <>
                  <Prompt />
                  <TerminalType
                    tokens={[{ type: "type", text: "cat motto.txt" }]}
                    charDelay={60}
                    startDelay={350}
                    onDone={() => setStep(4)}
                    caret={step < 4}
                    caretClass="tt-caret tt-mono"
                  />
                </>
              )}
            </div>
            <div className="t-line t-out t-motto">
              {step >= 4 && (
                <EchoLine onDone={() => setStep(5)} delay={420}>
                  Boring infrastructure is good infrastructure.
                </EchoLine>
              )}
            </div>
            <div className="t-line t-blank">&nbsp;</div>

            {/* Idle prompt — hidden once contact flow takes over */}
            {step >= 5 && !contactActive && (
              <div className="t-line">
                <Prompt />
                <span className="tt-caret tt-mono"></span>
              </div>
            )}

            {/* Contact flow renders directly into the same terminal body */}
            {contactActive && (
              <ContactFlow active={contactActive} onClose={handleCloseContact} Prompt={Prompt} />
            )}
          </div>
        </div>

        <div className="card-role reveal r3">
          Senior Systems &amp; Network Engineer
        </div>

        <p className="card-intro reveal r4">
          {PROFILE.intro[0]}
        </p>

        <div className="card-facts reveal r5">
          {PROFILE.facts.map((f, i) => (
            <div className={"fact" + (f.featured ? " featured" : "") + (f.wide ? " wide" : "") + (f.highlight ? " highlight" : "")} key={i}>
              <span className="fact-k">{f.k}</span>
              <span className="fact-v">
                {f.count
                  ? <CountUp to={f.count} suffix={"+ " + f.v.replace(/^\d+\+?\s*/, "")} />
                  : f.v}
              </span>
            </div>
          ))}
        </div>

        <div className="card-cta reveal r6">
          <button type="button" className="btn primary" onClick={handleOpenContact} disabled={contactActive}>
            <span>get in touch</span>
            <span className="arrow">→</span>
          </button>
          <span className="card-foot">
            that's it. say hi.
          </span>
        </div>
      </section>
    </main>
  );
}

// ── EchoLine ────────────────────────────────────────────────────────────
// Instant terminal output. Renders children immediately, then fires
// onDone after `delay` so downstream steps can advance.
function EchoLine({ children, onDone, delay = 240 }) {
  React.useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, delay);
    return () => clearTimeout(t);
  }, []);
  return <>{children}</>;
}

// ── AsciiName ───────────────────────────────────────────────────────────
function AsciiName({ onDone }) {
  const lines = [
    "█▀▀ █░█ ▄▀█ █▄░█ █▀▀ █▀▀   █▀▄ █▀█ █▀█ █ ▀█▀ █▄█",
    "█▄▄ █▀█ █▀█ █░▀█ █▄▄ ██▄   █▄▀ █▄█ █▀▄ █ ░█░ ░█░",
  ];
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    const timers = [];
    lines.forEach((_, i) => {
      timers.push(setTimeout(() => { if (!cancelled) setShown(i + 1); }, 110 + i * 130));
    });
    timers.push(setTimeout(() => { if (!cancelled && onDone) onDone(); }, 110 + lines.length * 130 + 220));
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);
  return (
    <pre className="ascii-name" aria-label="chance dority">
      {lines.slice(0, shown).join("\n")}
    </pre>
  );
}

Object.assign(window, { Topbar, Card, TerminalType, EchoLine, AsciiName, CountUp });
