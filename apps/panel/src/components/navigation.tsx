import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  CircleDollarSign,
  FileUp,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  Megaphone,
  MessageSquareWarning,
  Settings,
  Target,
  TrendingUp,
  UserRoundSearch,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  preview?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function getNavigationGroups(previewEnabled: boolean): NavGroup[] {
  const future = <T extends NavItem>(item: T): T | null => (previewEnabled ? item : null);
  const compact = (items: Array<NavItem | null>): NavItem[] => items.filter(Boolean) as NavItem[];

  return [
    {
      label: "",
      items: [{ to: "/overview", label: "Visão geral", icon: LayoutDashboard }],
    },
    {
      label: "CRM",
      items: compact([
        future({ to: "/crm/pipeline", label: "Pipeline", icon: KanbanSquare, preview: true }),
        future({ to: "/crm/opportunities", label: "Oportunidades", icon: Target, preview: true }),
        { to: "/crm/leads", label: "Leads", icon: UserRoundSearch },
        future({ to: "/crm/companies", label: "Empresas", icon: Building2, preview: true }),
      ]),
    },
    {
      label: "Prospecção",
      items: compact([
        future({ to: "/prospecting/campaigns", label: "Campanhas", icon: Megaphone, preview: true }),
        { to: "/prospecting/imports", label: "Importações", icon: FileUp },
      ]),
    },
    {
      label: "Conversas",
      items: [
        { to: "/conversations/inbox", label: "Inbox", icon: Inbox },
        { to: "/conversations/handoff", label: "Aguardando humano", icon: MessageSquareWarning },
      ],
    },
    {
      label: "Analytics",
      items: compact([
        future({ to: "/analytics/funnel", label: "Funil", icon: TrendingUp, preview: true }),
        future({ to: "/analytics/campaigns", label: "Campanhas", icon: BarChart3, preview: true }),
        future({ to: "/analytics/conversions", label: "Conversões", icon: UsersRound, preview: true }),
        { to: "/analytics/costs", label: "Custos", icon: CircleDollarSign },
      ]),
    },
    {
      label: "",
      items: [{ to: "/settings", label: "Configurações", icon: Settings }],
    },
  ].filter((group) => group.items.length > 0);
}

export const PRODUCT_MARK = Bot;
