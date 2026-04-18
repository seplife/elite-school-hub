import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, School, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, isAdmin, isParent } = useAuth();
  const [stats, setStats] = useState({ eleves: 0, classes: 0 });
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ count: elevesCount }, { count: classesCount }, { data: profile }] = await Promise.all([
        supabase.from("eleves").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        user ? supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setStats({ eleves: elevesCount ?? 0, classes: classesCount ?? 0 });
      if (profile?.full_name) setProfileName(profile.full_name);
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={GraduationCap}
          label={isParent && !isAdmin ? "Mes enfants" : "Élèves inscrits"}
          value={stats.eleves}
          gradient="from-primary to-primary-glow"
        />
        {(isAdmin) && (
          <StatCard
            icon={School}
            label="Classes ouvertes"
            value={stats.classes}
            gradient="from-secondary to-secondary-glow"
          />
        )}
        <StatCard
          icon={Users}
          label="Année scolaire"
          value={`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
          gradient="from-primary to-secondary"
        />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-display">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {isParent && (
            <Link to="/app/eleves/nouveau">
              <Button variant="outline" className="w-full justify-between h-auto py-4">
                <span className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="text-left">
                    <span className="block font-semibold">Inscrire un enfant</span>
                    <span className="block text-xs text-muted-foreground">Démarrer une nouvelle inscription</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link to="/app/eleves">
            <Button variant="outline" className="w-full justify-between h-auto py-4">
              <span className="flex items-center gap-3">
                <Users className="h-5 w-5 text-secondary" />
                <span className="text-left">
                  <span className="block font-semibold">Voir les élèves</span>
                  <span className="block text-xs text-muted-foreground">Liste et fiches détaillées</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/app/classes">
              <Button variant="outline" className="w-full justify-between h-auto py-4">
                <span className="flex items-center gap-3">
                  <School className="h-5 w-5 text-primary" />
                  <span className="text-left">
                    <span className="block font-semibold">Gérer les classes</span>
                    <span className="block text-xs text-muted-foreground">Créer / modifier les classes</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: number | string; gradient: string }) => (
  <Card className="border-border shadow-sm hover:shadow-elev transition-smooth overflow-hidden">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
        <div className="font-display text-2xl font-bold">{value}</div>
      </div>
    </CardContent>
  </Card>
);

export default Dashboard;
