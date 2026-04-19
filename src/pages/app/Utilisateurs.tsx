import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, UserCog, X, Plus } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super admin",
  admin: "Administrateur",
  enseignant: "Enseignant",
  comptable: "Comptable",
  educateur: "Éducateur",
  parent: "Parent",
  eleve: "Élève",
};

const ASSIGNABLE_ROLES: AppRole[] = ["admin", "enseignant", "comptable", "educateur", "parent"];

interface Profile {
  user_id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

interface RoleRow {
  id: string;
  user_id: string;
  role: AppRole;
}

const Utilisateurs = () => {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<Record<string, AppRole | "">>({});

  const load = async () => {
    setLoading(true);
    const [{ data: p, error: e1 }, { data: r, error: e2 }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, phone, created_at").order("full_name"),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setProfiles((p as any) ?? []);
    setRoles((r as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!authLoading && !isAdmin) return <Navigate to="/app" replace />;

  const rolesOf = (uid: string) => roles.filter((r) => r.user_id === uid);

  const addRole = async (uid: string) => {
    const role = adding[uid];
    if (!role) return;
    if (rolesOf(uid).some((r) => r.role === role)) {
      toast.error("Cet utilisateur a déjà ce rôle.");
      return;
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) return toast.error(error.message);
    toast.success("Rôle ajouté.");
    setAdding((s) => ({ ...s, [uid]: "" }));
    load();
  };

  const removeRole = async (roleRow: RoleRow) => {
    if (roleRow.user_id === user?.id && roleRow.role === "admin") {
      const others = roles.filter((r) => r.role === "admin" && r.user_id !== user?.id);
      if (others.length === 0) {
        toast.error("Impossible de retirer votre propre rôle admin (dernier admin).");
        return;
      }
    }
    const { error } = await supabase.from("user_roles").delete().eq("id", roleRow.id);
    if (error) return toast.error(error.message);
    toast.success("Rôle retiré.");
    load();
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.full_name.toLowerCase().includes(q) || (p.phone ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Utilisateurs et rôles</h1>
        <p className="text-muted-foreground">Gérez les rôles des comptes inscrits sur la plateforme.</p>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou téléphone…" className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground space-y-2">
            <UserCog className="h-10 w-10 mx-auto opacity-50" />
            <p>Aucun utilisateur trouvé.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const userRoles = rolesOf(p.user_id);
            const available = ASSIGNABLE_ROLES.filter((r) => !userRoles.some((ur) => ur.role === r));
            return (
              <Card key={p.user_id} className="border-border">
                <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-display font-bold shrink-0">
                      {p.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-semibold truncate">{p.full_name}</div>
                      <div className="text-xs text-muted-foreground">{p.phone || "—"}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {userRoles.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">Aucun rôle</span>
                    ) : (
                      userRoles.map((r) => (
                        <Badge key={r.id} variant="secondary" className="gap-1 pr-1">
                          {ROLE_LABELS[r.role]}
                          <button
                            onClick={() => removeRole(r)}
                            className="hover:bg-destructive/20 rounded p-0.5 transition-colors"
                            aria-label="Retirer le rôle"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>

                  {available.length > 0 && (
                    <div className="flex gap-2">
                      <Select
                        value={adding[p.user_id] || ""}
                        onValueChange={(v) => setAdding((s) => ({ ...s, [p.user_id]: v as AppRole }))}
                      >
                        <SelectTrigger className="w-44"><SelectValue placeholder="Ajouter un rôle" /></SelectTrigger>
                        <SelectContent>
                          {available.map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="icon" onClick={() => addRole(p.user_id)} disabled={!adding[p.user_id]}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Utilisateurs;
