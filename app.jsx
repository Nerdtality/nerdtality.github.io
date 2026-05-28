// app.jsx — main composition

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "#7dd3e4",
  "nameStyle": "plain"
}/*EDITMODE-END*/;

function applyTokens(t) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.theme);
  root.style.setProperty("--accent", t.accent);
}

function App() {
  const [contactActive, setContactActive] = React.useState(false);

  React.useEffect(() => { applyTokens(TWEAK_DEFAULTS); }, []);
  React.useEffect(() => {
    document.body.classList.toggle("contact-active", contactActive);
  }, [contactActive]);

  return (
    <>
      <NetworkBg />
      <div className="backdrop"></div>
      <Topbar />
      <Card
        nameStyle={TWEAK_DEFAULTS.nameStyle}
        contactActive={contactActive}
        setContactActive={setContactActive}
      />
      <footer>
        <div>© {new Date().getFullYear()} · Chance Dority</div>
        <div className="stamp">CD.</div>
      </footer>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
