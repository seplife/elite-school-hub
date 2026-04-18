import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { GraduationCap, ShieldCheck, BookOpenCheck, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero-school.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-md">
                Inscription en ligne
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
              Rentrée scolaire ouverte
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
              L'excellence à la portée de vos{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">enfants</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Le <strong>Cours Secondaire Elites Divo</strong> digitalise toute sa gestion : inscription en ligne,
              suivi pédagogique, paiements et communication, le tout sur une plateforme moderne et sécurisée.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow w-full sm:w-auto">
                  Inscrire mon enfant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Espace parent
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" /> Inscription 100% en ligne</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" /> Suivi en temps réel</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" /> Données sécurisées</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-hero opacity-20 blur-3xl rounded-full" aria-hidden="true" />
            <img
              src={heroImg}
              alt="Élèves du Cours Secondaire Elites Divo souriant devant l'établissement"
              className="relative rounded-2xl shadow-elev w-full object-cover aspect-[4/3]"
              width={1536}
              height={1024}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Une plateforme, tout le quotidien scolaire</h2>
          <p className="text-muted-foreground">
            Conçue pour les parents, les enseignants et l'administration de l'établissement.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: GraduationCap,
              title: "Inscription en ligne",
              desc: "Les parents inscrivent leurs enfants en quelques minutes, sans déplacement.",
              color: "from-primary to-primary-glow",
            },
            {
              icon: BookOpenCheck,
              title: "Suivi pédagogique",
              desc: "Notes, bulletins, absences et emploi du temps accessibles 24h/24.",
              color: "from-secondary to-secondary-glow",
            },
            {
              icon: ShieldCheck,
              title: "Sécurisé & traçable",
              desc: "Vos données sont protégées et chaque action est journalisée.",
              color: "from-primary to-secondary",
            },
          ].map((f) => (
            <article
              key={f.title}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-elev transition-smooth"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} text-white mb-4`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="bg-gradient-hero rounded-3xl p-8 md:p-14 text-center text-white shadow-elev">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Prêt à rejoindre Elites Divo ?</h2>
          <p className="opacity-90 mb-6 max-w-xl mx-auto">
            Créez votre compte parent en quelques clics et commencez l'inscription de votre enfant dès aujourd'hui.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Créer mon compte parent
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} Cours Secondaire Elites Divo. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
