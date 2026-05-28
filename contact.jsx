// contact.jsx — inline contact flow that lives inside the hero terminal.
// Renders below the motto when activated; auto-types `mail chance`,
// then walks name → email → message → captcha, then "✓ delivered" and exits.

function ContactFlow({ active, onClose, Prompt }) {
  // phase: cmd → form → sending → sent → exiting
  const [phase, setPhase] = React.useState("cmd");
  const [stepIdx, setStepIdx] = React.useState(0); // 0=name,1=email,2=message,3=captcha
  const [answers, setAnswers] = React.useState({ name: "", email: "", message: "" });
  const [draft, setDraft] = React.useState("");
  const [stepError, setStepError] = React.useState("");
  const [status, setStatus] = React.useState("idle"); // idle|sending|sent|error
  const [errorMsg, setErrorMsg] = React.useState("");

  const STEPS = ["name", "email", "message", "captcha"];
  const inputRef = React.useRef(null);
  const captchaMountRef = React.useRef(null);
  const widgetIdRef = React.useRef(null);

  // ── advance phase from cmd → form after the typed command finishes ────
  const onCmdTyped = () => {
    setTimeout(() => setPhase("form"), 240);
  };

  // ── focus active input on step change ─────────────────────────────────
  React.useEffect(() => {
    if (phase !== "form") return;
    setDraft("");
    setStepError("");
    const t = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 40);
    return () => clearTimeout(t);
  }, [stepIdx, phase]);

  // ── mount hCaptcha when we reach it ───────────────────────────────────
  React.useEffect(() => {
    if (phase !== "form" || STEPS[stepIdx] !== "captcha") return;
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return;
      if (window.hcaptcha && captchaMountRef.current && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.hcaptcha.render(captchaMountRef.current, {
            sitekey: "50b2fe65-b00b-4b9e-ad62-3ba471098be2",
            theme: "dark",
            size: "compact",
            callback: (token) => transmit(token),
          });
        } catch (err) {
          console.warn("hCaptcha render failed:", err);
        }
        return;
      }
      setTimeout(tryRender, 100);
    };
    tryRender();
    return () => {
      cancelled = true;
      if (window.hcaptcha && widgetIdRef.current !== null) {
        try { window.hcaptcha.reset(widgetIdRef.current); } catch {}
      }
    };
  }, [stepIdx, phase]);

  // ── exit sequence after successful send ───────────────────────────────
  React.useEffect(() => {
    if (status !== "sent") return;
    const t = setTimeout(() => setPhase("exiting"), 3200);
    return () => clearTimeout(t);
  }, [status]);

  // ── validation + advance ──────────────────────────────────────────────
  const validate = (key, val) => {
    if (!val.trim()) return "this can't be empty";
    if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "that doesn't look like a valid email";
    return "";
  };
  const commit = () => {
    const key = STEPS[stepIdx];
    if (key === "captcha") return;
    const err = validate(key, draft);
    if (err) { setStepError(err); return; }
    setAnswers((a) => ({ ...a, [key]: draft.trim() }));
    setStepIdx((s) => s + 1);
  };
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // ── transmit ──────────────────────────────────────────────────────────
  const transmit = async (token) => {
    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: PROFILE.contactKey,
          name: answers.name,
          email: answers.email,
          message: answers.message,
          subject: "chancedority.com contact form",
          from_name: "chancedority.com",
          botcheck: "",
          "h-captcha-response": token,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Send failed");
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  // ── render helpers ────────────────────────────────────────────────────
  const renderAnswerLine = (key) => {
    const val = answers[key];
    if (!val) return null;
    return (
      <div key={`answered-${key}`} className="t-line cm-line-answered">
        <Prompt scope={key} />
        <span className="cm-answer">{val}</span>
      </div>
    );
  };

  const renderActiveFormStep = () => {
    if (status === "sent" || status === "sending") return null;
    const key = STEPS[stepIdx];
    if (key === "captcha") {
      return (
        <>
          <div className="t-line">
            <Prompt scope="verify" />
            <span>verify you're human</span>
          </div>
          <div className="cm-captcha-mount" ref={captchaMountRef}></div>
          {status === "error" && (
            <div className="t-line cm-line-err">
              <span className="cm-x-mark">✗</span>
              <span>&nbsp;{errorMsg}</span>
              <button
                type="button"
                className="btn cm-retry"
                onClick={() => {
                  setStatus("idle");
                  if (window.hcaptcha && widgetIdRef.current !== null) window.hcaptcha.reset(widgetIdRef.current);
                }}>
                <span>retry</span>
              </button>
            </div>
          )}
        </>
      );
    }
    const placeholder = {
      name:    "your name",
      email:   "you@domain",
      message: "a few sentences. shift+enter for newline.",
    }[key];
    return (
      <>
        <div className="t-line cm-line-active">
          <Prompt scope={key} />
          {key === "message" ? (
            <textarea
              ref={inputRef}
              className="cm-cli-input cm-cli-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder={placeholder}
              rows={3}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          ) : (
            <input
              ref={inputRef}
              type={key === "email" ? "email" : "text"}
              className="cm-cli-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder={placeholder}
              autoComplete={key === "email" ? "email" : "name"}
              autoCapitalize="off"
              spellCheck={false}
            />
          )}
        </div>
        {stepError && (
          <div className="t-line cm-line-err">
            <span className="cm-x-mark">!</span>
            <span>&nbsp;{stepError}</span>
          </div>
        )}
        <div className="cm-hint">
          {key === "message" ? "enter to send · shift+enter for newline · esc to cancel" : "enter to continue · esc to cancel"}
        </div>
      </>
    );
  };

  return (
    <>
      {/* line 1: typed command */}
      <div className="t-line">
        <Prompt />
        <TerminalType
          tokens={[{ type: "type", text: "mail chance" }]}
          charDelay={55}
          startDelay={120}
          onDone={onCmdTyped}
          caret={phase === "cmd"}
          caretClass="tt-caret tt-mono"
        />
      </div>

      {/* form rows: answered lines + active step */}
      {(phase === "form" || phase === "sending" || phase === "sent" || phase === "exiting") && (
        <>
          {STEPS.slice(0, stepIdx).map((k) => renderAnswerLine(k))}
          {renderActiveFormStep()}
          {status === "sending" && (
            <div className="t-line">
              <Prompt />
              <span>transmitting</span>
              <span className="cm-dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
          )}
          {status === "sent" && (
            <>
              <div className="t-line">
                <Prompt scope="verify" />
                <span>captcha solved</span>
              </div>
              <div className="t-line cm-line-ok">
                <span className="cm-ok">✓</span>
                <span>&nbsp;message delivered. expect a reply within a day or two.</span>
              </div>
            </>
          )}
        </>
      )}

      {/* exit sequence */}
      {phase === "exiting" && (
        <div className="t-line">
          <Prompt />
          <TerminalType
            tokens={[{ type: "type", text: "exit" }]}
            charDelay={90}
            startDelay={0}
            onDone={() => setTimeout(onClose, 900)}
            caret
            caretClass="tt-caret tt-mono"
          />
        </div>
      )}
    </>
  );
}

Object.assign(window, { ContactFlow });
