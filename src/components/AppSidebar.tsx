import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, GraduationCap, School, Users, LogOut, UserCircle2 } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("admin" | "parent" | "staff")[];
}

const items: NavItem[] = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin", "parent", "staff"] },
  { to: "/app/eleves", label: "Élèves", icon: GraduationCap, roles: ["admin", "parent", "staff"] },
  { to: "/app/classes", label: "Classes", icon: School, roles: ["admin", "staff"] },
  { to: "/app/utilisateurs", label: "Utilisateurs", icon: Users, roles: ["admin"] },
];

export const AppSidebar = () => {
  const { isAdmin, isParent, isStaff, signOut, user } = useAuth();
  const navigate = useNavigate();

  const visible = items.filter((it) => {
    if (it.roles.includes("admin") && isAdmin) return true;
    if (it.roles.includes("staff") && isStaff) return true;
    if (it.roles.includes("parent") && isParent) return true;
    return false;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <Logo textColor="light" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-smooth font-medium text-sm",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 text-sm">
          <UserCircle2 className="h-5 w-5 text-sidebar-foreground/60" />
          <div className="truncate">
            <div className="font-medium truncate">{user?.email}</div>
            <div className="text-xs text-sidebar-foreground/60">
              {isAdmin ? "Administrateur" : isParent ? "Parent" : "Utilisateur"}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </aside>
  );
};
