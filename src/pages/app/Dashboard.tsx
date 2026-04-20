import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, School, Users, ArrowRight, BookUser, Wallet, ShieldCheck, ClipboardList, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlanningEnseignant } from "@/components/dashboard/PlanningEnseignant";

const Dashboard = () => {
  const { user, isAdmin, isParent, roles } = useAuth();
  const isEnseignant = roles.includes("enseignant");
  const [stats, setStats] = useState({
    elevesActifs: 0,
    elevesAttente: 0,
    classes: 0,
    admins: 0,
    enseignants: 0,
    educateurs: 0,
    comptables: 0,
    parents: 0,
  });
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    const load = async () => {
      const elevesActifs = supabase.from("eleves").select("*", { count: "exact", head: true }).eq("statut", "actif");
      const elevesAttente = supabase.from("eleves").select("*", { count: "exact", head: true }).eq("statut", "en_attente");
      const classesQ = supabase.from("classes").select("*", { count: "exact", head: true });
      const profileQ = user
        ? supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null });

      const roleCount = (role: "admin" | "enseignant" | "educateur" | "comptable" | "parent") =>
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", role);

      const [a, b, c, p, ra, re, red, rc, rp] = await Promise.all([
        elevesActifs, elevesAttente, classesQ, profileQ,
        roleCount("admin"), roleCount("enseignant"), roleCount("educateur"), roleCount("comptable"), roleCount("parent"),
      ]);

      setStats({
        elevesActifs: a.count ?? 0,
        elevesAttente: b.count ?? 0,
        classes: c.count ?? 0,
        admins: ra.count ?? 0,
        enseignants: re.count ?? 0,
        educateurs: red.count ?? 0,
        comptables: rc.count ?? 0,
        parents: rp.count ?? 0,
      });
      if ((p as any)?.data?.full_name) setProfileName((p as any).data.full_name);
    };
    load();
  }, [user]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold">
          Bonjour {profileName.split(" ")[0] || "👋"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Vue d'ensemble de l'établissement." : isParent ? "Suivez la scolarité de vos enfants." : "Bienvenue sur la plateforme."}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-muted-foreground">Élèves & classes</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={GraduationCap}
            label={isParent && !isAdmin ? "Mes enfants actifs" : "Élèves actifs"}
            value={stats.elevesActifs}
            gradient="from-primary to-primary-glow"
          />
          {isAdmin && (
            <StatCard
              icon={ClipboardList}
              label="Inscriptions en attente"
              value={stats.elevesAttente}
              gradient="from-warning to-primary"
            />
          )}
          {isAdmin && (
            <StatCard icon={School} label="Classes ouvertes" value={stats.classes} gradient="from-secondary to-secondary-glow" />
          )}
          <StatCard
            icon={Users}
            label="Année scolaire"
            value={`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
            gradient="from-primary to-secondary"
          />
        </div>
      </section>

      {isEnseignant && <PlanningEnseignant />}

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-muted-foreground">Communauté éducative</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={ShieldCheck} label="Administrateurs" value={stats.admins} gradient="from-primary to-secondary" />
            <StatCard icon={BookUser} label="Enseignants" value={stats.enseignants} gradient="from-secondary to-secondary-glow" />
            <StatCard icon={UserCheck} label="Éducateurs" value={stats.educateurs} gradient="from-primary to-primary-glow" />
            <StatCard icon={Wallet} label="Comptables" value={stats.comptables} gradient="from-secondary to-primary" />
            <StatCard icon={Users} label="Parents" value={stats.parents} gradient="from-primary-glow to-secondary-glow" />
          </div>
        </section>
      )}

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-display">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {isParent && (
            <QuickAction to="/app/eleves/nouveau" icon={GraduationCap} title="Inscrire un enfant" subtitle="Démarrer une nouvelle inscription" tone="primary" />
          )}
          {isAdmin && stats.elevesAttente > 0 && (
            <QuickAction
              to="/app/inscriptions"
              icon={ClipboardList}
              title={`Valider ${stats.elevesAttente} inscription${stats.elevesAttente > 1 ? "s" : ""}`}
              subtitle="Traiter les demandes en attente"
              tone="primary"
            />
          )}
          <QuickAction to="/app/eleves" icon={Users} title="Voir les élèves" subtitle="Liste et fiches détaillées" tone="secondary" />
          {isAdmin && (
            <>
              <QuickAction to="/app/classes" icon={School} title="Gérer les classes" subtitle="Créer / modifier les classes" tone="primary" />
              <QuickAction to="/app/utilisateurs" icon={ShieldCheck} title="Utilisateurs et rôles" subtitle="Gérer les accès et permissions" tone="secondary" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const QuickAction = ({ to, icon: Icon, title, subtitle, tone }: { to: string; icon: any; title: string; subtitle: string; tone: "primary" | "secondary" }) => (
  <Link to={to}>
    <Button variant="outline" className="w-full justify-between h-auto py-4">
      <span className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${tone === "primary" ? "text-primary" : "text-secondary"}`} />
        <span className="text-left">
          <span className="block font-semibold">{title}</span>
          <span className="block text-xs text-muted-foreground">{subtitle}</span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4" />
    </Button>
  </Link>
);

const StatCard = ({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: number | string; gradient: string }) => (
  <Card className="border-border shadow-sm hover:shadow-elev transition-smooth overflow-hidden">
    <CardContent className="p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md shrink-0`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground font-medium truncate">{label}</div>
        <div className="font-display text-2xl font-bold">{value}</div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
