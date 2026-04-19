import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pin, PinOff, Pencil, Trash2, Megaphone, Inbox } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/uploadMedia";

type Categorie = "generale" | "pedagogique" | "administrative" | "evenement" | "urgence";

interface Annonce {
  id: string;
  titre: string;
  contenu: string;
  categorie: Categorie;
  image_url: string | null;
  epingle: boolean;
  publie: boolean;
  auteur_id: string;
  created_at: string;
}

const CATEGORIE_LABELS: Record<Categorie, string> = {
  generale: "Générale",
  pedagogique: "Pédagogique",
  administrative: "Administrative",
  evenement: "Événement",
  urgence: "Urgence",
};

const CATEGORIE_VARIANT: Record<Categorie, "default" | "secondary" | "destructive" | "outline"> = {
  generale: "secondary",
  pedagogique: "default",
  administrative: "outline",
  evenement: "default",
  urgence: "destructive",
};

const Annonces = () => {
  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Annonce | null>(null);
  const [busy, setBusy] = useState(false);

  // form
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [categorie, setCategorie] = useState<Categorie>("generale");
  const [epingle, setEpingle] = useState(false);
  const [publie, setPublie] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("annonces")
      .select("*")
      .order("epingle", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAnnonces((data as Annonce[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditing(null);
    setTitre(""); setContenu(""); setCategorie("generale");
    setEpingle(false); setPublie(true); setImageFile(null); setImageUrl(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (a: Annonce) => {
    setEditing(a);
    setTitre(a.titre); setContenu(a.contenu); setCategorie(a.categorie);
    setEpingle(a.epingle); setPublie(a.publie);
    setImageFile(null); setImageUrl(a.image_url);
    setOpen(true);
  };

  const submit = async () => {
    if (!titre.trim() || !contenu.trim()) {
      toast.error("Titre et contenu requis.");
      return;
    }
    if (!user) return;
    setBusy(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadMedia(imageFile, "annonces");
      }
      const payload = {
        titre: titre.trim(),
        contenu: contenu.trim(),
        categorie,
        epingle,
        publie,
        image_url: finalImageUrl,
        auteur_id: user.id,
      };
      const { error } = editing
        ? await supabase.from("annonces").update(payload).eq("id", editing.id)
        : await supabase.from("annonces").insert(payload);
      if (error) throw error;
      toast.success(editing ? "Annonce mise à jour." : "Annonce publiée.");
      setOpen(false);
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const togglePin = async (a: Annonce) => {
    const { error } = await supabase.from("annonces").update({ epingle: !a.epingle }).eq("id", a.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (a: Annonce) => {
    const { error } = await supabase.from("annonces").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Annonce supprimée.");
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" /> Annonces
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Publiez et gérez les annonces de l'école." : "Actualités et communications de l'école."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nouvelle annonce</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Rentrée scolaire 2025" />
                </div>
                <div className="space-y-2">
                  <Label>Contenu</Label>
                  <Textarea rows={6} value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder="Détails de l'annonce..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={categorie} onValueChange={(v) => setCategorie(v as Categorie)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORIE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Image (optionnel)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                    {imageUrl && !imageFile && (
                      <p className="text-xs text-muted-foreground truncate">Image actuelle conservée</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={epingle} onCheckedChange={setEpingle} />
                    <span className="text-sm">Épingler</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={publie} onCheckedChange={setPublie} />
                    <span className="text-sm">Publié</span>
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Annuler</Button>
                <Button onClick={submit} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editing ? "Enregistrer" : "Publier"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : annonces.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <Inbox className="h-10 w-10 mx-auto opacity-50" />
            <p>Aucune annonce pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {annonces.map((a) => (
            <Card key={a.id} className={a.epingle ? "border-primary shadow-md" : ""}>
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {a.epingle && <Pin className="h-4 w-4 text-primary" />}
                    <Badge variant={CATEGORIE_VARIANT[a.categorie]}>{CATEGORIE_LABELS[a.categorie]}</Badge>
                    {!a.publie && <Badge variant="outline">Brouillon</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <CardTitle className="font-display text-xl">{a.titre}</CardTitle>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => togglePin(a)} title={a.epingle ? "Désépingler" : "Épingler"}>
                      {a.epingle ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette annonce ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(a)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {a.image_url && (
                  <img src={a.image_url} alt={a.titre} className="rounded-lg w-full max-h-80 object-cover" loading="lazy" />
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{a.contenu}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Annonces;
