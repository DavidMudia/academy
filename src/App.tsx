import { StoreProvider } from "./store";
import { useRoute } from "./router";
import { Shell } from "./components/Layout";
import Home from "./pages/Home";
import { Programmes, ProgrammeDetail } from "./pages/Programmes";
import Schedule from "./pages/Schedule";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import Payment from "./pages/Payment";
import Portal from "./pages/Portal";
import Admin from "./pages/Admin";
import ApplicationSubmitted from "./pages/ApplicationSubmitted";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import { Button, Container } from "./components/ui";
import { useStore } from "./store";

function Routes() {
  const { path, params } = useRoute();
  const seg = path.split("/").filter(Boolean);

  switch (seg[0]) {
    case undefined:
      return <Home />;
    case "about":
      return <About />;
    case "programmes":
      return seg[1] ? <ProgrammeDetail slug={seg[1]} /> : <Programmes />;
    case "schedule":
      return <Schedule />;
    case "contact":
      return <Contact />;
    case "login":
      return <Auth />;
    case "register":
      return <Register key={params.toString()} />;
    case "application-submitted":
      return <ApplicationSubmitted />;
    case "admin":
      return <Admin />;
    case "payment":
      if (seg[1] === "success") return <PaymentSuccess />;
      if (seg[1] === "failed") return <PaymentFailed />;
      return seg[1] ? <Payment id={seg[1]} token={params.get("token") ?? undefined} /> : <Register />;
    case "portal":
      return <Portal />;
    default:
      return (
        <Container className="py-44 text-center">
          <div className="font-display text-9xl font-extrabold text-brand-red">404</div>
          <h1 className="text-4xl font-extrabold uppercase text-navy-900">Page not found</h1>
          <div className="mt-6"><Button to="/" arrow>Back to home</Button></div>
        </Container>
      );
  }
}

function ApiNotice() {
  const { apiError, clearApiError } = useStore();
  if (!apiError) return null;
  return (
    <div role="alert" className="fixed inset-x-4 top-20 z-[60] mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-lg">
      <span>Backend: {apiError}</span>
      <button onClick={clearApiError} className="shrink-0 rounded px-2 py-1 hover:bg-red-100" aria-label="Dismiss backend error">Dismiss</button>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell>
        <ApiNotice />
        <Routes />
      </Shell>
    </StoreProvider>
  );
}
