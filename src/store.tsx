import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { batches as defaultBatches, REGISTRATION_FEE, EARLY_BIRD_PERCENT, PROMO_CODES, type Batch } from "./data";
import { apiRequest } from "./api";

export type User = { id: number; name: string; email: string; phone: string; role: "admin" | "student" };

export type Personal = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  city: string;
  education: string;
  nextOfKin: string;
  nextOfKinPhone: string;
};

export type Breakdown = {
  registration: number;
  tuition: number;
  earlyBird: number;
  promo: number;
  promoCode?: string;
  total: number;
};

export type Payment = {
  reference: string;
  method: string;
  amount: number;
  paidAt: string;
  breakdown: Breakdown;
};

export type Application = {
  id: string;
  email: string;
  programme: string;
  batch: string;
  personal: Personal;
  docs: Record<string, string>;
  status: "Submitted" | "Approved" | "Rejected" | "Paid";
  createdAt: string;
  payment?: Payment;
};

export type BatchWithCounts = Batch & { seatsTaken?: number };

export const computeBreakdown = (tuition: number, earlyBirdDiscount: boolean, promoCode?: string): Breakdown => {
  const earlyBird = earlyBirdDiscount ? Math.round((tuition * EARLY_BIRD_PERCENT) / 100) : 0;
  const code = promoCode?.toUpperCase();
  const percent = code ? PROMO_CODES[code] ?? 0 : 0;
  const promo = percent ? Math.round(((tuition - earlyBird) * percent) / 100) : 0;
  return {
    registration: REGISTRATION_FEE,
    tuition,
    earlyBird,
    promo,
    promoCode: percent ? code : undefined,
    total: REGISTRATION_FEE + tuition - earlyBird - promo,
  };
};

type NewApplication = Omit<Application, "id" | "createdAt" | "status" | "payment">;

type Store = {
  user: User | null;
  authReady: boolean;
  apiError: string;
  applications: Application[];
  myApplications: Application[];
  batches: BatchWithCounts[];
  clearApiError: () => void;
  logIn: (email: string, password: string) => Promise<{ ok: true; role: User["role"] } | { ok: false; error: string }>;
  logOut: () => Promise<void>;
  saveApplication: (application: NewApplication, files: Record<string, File>) => Promise<Application>;
  seatsLeft: (batch: BatchWithCounts) => number;
  refreshBatches: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [batches, setBatches] = useState<BatchWithCounts[]>(defaultBatches);
  const [authReady, setAuthReady] = useState(false);
  const [apiError, setApiError] = useState("");

  const refreshApplications = useCallback(async () => {
    const result = await apiRequest<{ applications: Application[] }>("/applications/mine");
    setApplications(result.applications);
  }, []);

  const refreshBatches = useCallback(async () => {
    try {
      const result = await apiRequest<{ batches: BatchWithCounts[] }>("/batches");
      setBatches(result.batches);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load training batches.";
      setApiError(message);
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;
    void refreshBatches().catch(() => undefined);
    void apiRequest<{ user: User | null }>("/auth/me")
      .then(async (result) => {
        if (!active) return;
        setUser(result.user);
        if (result.user?.role === "student") await refreshApplications();
      })
      .catch((error: unknown) => {
        if (active) setApiError(error instanceof Error ? error.message : "The backend is unavailable.");
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, [refreshApplications, refreshBatches]);

  const logIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await apiRequest<{ user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setUser(result.user);
        setApiError("");
        if (result.user.role === "student") await refreshApplications();
        else setApplications([]);
        return { ok: true as const, role: result.user.role };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to log in.";
        setApiError(message);
        return { ok: false as const, error: message };
      }
    },
    [refreshApplications],
  );

  const logOut = useCallback(async () => {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
      setUser(null);
      setApplications([]);
      setApiError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out.";
      setApiError(message);
      throw error;
    }
  }, []);

  const saveApplication = useCallback(
    async (application: NewApplication, files: Record<string, File>) => {
      if (user?.role === "admin") {
        throw new Error("Administrators cannot submit applications. Log out to apply as a student.");
      }
      const body = new FormData();
      body.set("application", JSON.stringify(application));
      for (const [kind, file] of Object.entries(files)) body.set(kind, file, file.name);
      const result = await apiRequest<{ application: Application }>("/applications", { method: "POST", body });
      if (user?.role === "student" && user.email.toLowerCase() === application.email.toLowerCase()) {
        setApplications((previous) => [result.application, ...previous]);
      }
      void refreshBatches().catch(() => undefined);
      return result.application;
    },
    [user, refreshBatches],
  );

  const myApplications = useMemo(
    () => [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [applications],
  );

  const seatsLeft = useCallback(
    (batch: BatchWithCounts) => Math.max(
      0,
      batch.seats -
        batch.taken -
        (batch.seatsTaken ?? applications.filter((application) => application.batch === batch.id && application.status === "Paid").length),
    ),
    [applications],
  );

  const value: Store = {
    user,
    authReady,
    apiError,
    applications,
    myApplications,
    batches,
    clearApiError: () => setApiError(""),
    logIn,
    logOut,
    saveApplication,
    seatsLeft,
    refreshBatches,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const context = useContext(Ctx);
  if (!context) throw new Error("StoreProvider missing");
  return context;
};
