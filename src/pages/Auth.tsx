import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis (2 caractères min)").max(100),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide").max(20),
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(1, "Mot de passe requis").max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(params.get("mode") === "signup" ? "signup" : "login");

  useEffect(() => {
    if (!loading && user) navigate("/app", { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Identifiants incorrects" : error.message);
      return;
    }
    toast.success("Connexion réussie");
    navigate("/app");
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Un compte existe déjà avec cet email" : error.message);
      return;
    }
    toast.success("Compte créé ! Vous pouvez maintenant vous connecter.");
    setTab("login");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Left: brand panel */}
      <div className="hidden md:flex bg-gradient-hero text-white p-12 flex-col justify-between">
        <Logo textColor="light" size="lg" />
        <div className="space-y-4">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Bienvenue sur la plateforme Elites Divo
          </h2>
          <p className="text-white/85 text-lg">
            L'inscription, le suivi des notes, les paiements — tout au même endroit, depuis votre téléphone ou votre ordinateur.
          </p>
        </div>
        <p className="text-white/70 text-sm">© {new Date().getFullYear()} Cours Secondaire Elites Divo</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="md:hidden">
            <Logo size="md" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Espace personnel</h1>
            <p className="text-muted-foreground mt-1">Connectez-vous ou créez un compte parent.</p>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Créer un compte</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" />
                </div>
                <div>
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input id="login-password" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md"
                >
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input id="signup-name" name="fullName" required placeholder="Kouassi N'Guessan" />
                </div>
                <div>
                  <Label htmlFor="signup-phone">Téléphone</Label>
                  <Input id="signup-phone" name="phone" type="tel" required placeholder="+225 07 00 00 00 00" />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" />
                </div>
                <div>
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input id="signup-password" name="password" type="password" required autoComplete="new-password" minLength={8} />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 8 caractères</p>
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md"
                >
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Créer mon compte parent
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-smooth">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
