import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSession } from "@/auth/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ContractMismatchBanner } from "@/components/ContractMismatchBanner";

const NAV = [
  { to: "/conversations", label: "Conversas" },
  { to: "/leads", label: "Leads" },
  { to: "/consumption", label: "Consumo" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useSession();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ContractMismatchBanner />
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span className="font-semibold">Gestão do Bot</span>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loggingOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
