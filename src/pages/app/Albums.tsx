import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Images, Pencil, Trash2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/uploadMedia";

interface Album {
  id: string;
  titre: string;
  description: string | null;
  date_evenement: string | null;
  couverture_url: string | null;
  publie: boolean;
  created_at: string;
}

const Albums = () => {
  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Album | null>(null);
  const [busy, setBusy] = useState(false);

  // form
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [dateEvent, setDateEvent] = useState("");
  const [publie, setPublie] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .order("date_evenement", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data as Album[]) ?? [];
    setAlbums(list);

    // photo counts
    if (list.length > 0) {
      const ids = list.map((a) => a.id);
      const { data: photos } = await supabase.from("photos").select("album_id").in("album_id", ids);
      const c: Record<string, number> = {};
      (photos ?? []).forEach((p: any) => { c[p.album_id] = (c[p.album_id] ?? 0) + 1; });
      setCounts(c);
    } else {
      setCounts({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditing(null);
    setTitre(""); setDescription(""); setDateEvent("");
    setPublie(true); setCoverFile(null); setCoverUrl(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const openEdit = (a: Album) => {
    setEditing(a);
    setTitre(a.titre); setDescription(a.description ?? "");
    setDateEvent(a.date_evenement ?? ""); setPublie(a.publie);
    setCoverFile(null); setCoverUrl(a.couverture_url);
    setOpen(true);
  };

  const submit = async () => {
    if (!titre.trim()) { toast.error("Titre requis."); return; }
    if (!user) return;
    setBusy(true);
    try {
      let finalCover = coverUrl;
      if (coverFile) finalCover = await uploadMedia(coverFile, "albums");
      const payload = {
        titre: titre.trim(),
        description: description.trim() || null,
        date_evenement: dateEvent || null,
        publie,
        couverture_url: finalCover,
        auteur_id: user.id,
      };
      const { error } = editing
        ? await supabase.from("albums").update(payload).eq("id", editing.id)
        : await supabase.from("albums").insert(payload);
      if (error) throw error;
      toast.success(editing ? "Album mis à jour." : "Album créé.");
      setOpen(false); resetForm(); load();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: Album) => {
    const { error } = await supabase.from("albums").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Album supprimé.");
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Images className="h-7 w-7 text-primary" /> Albums photos
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Créez et gérez les albums de l'école." : "Souvenirs et événements de l'école."}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nouvel album</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier l'album" : "Nouvel album"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex: Fête de fin d'année" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de l'événement</Label>
                    <Input type="date" value={dateEvent} onChange={(e) => setDateEvent(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Couverture (optionnel)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={publie} onCheckedChange={setPublie} />
                  <span className="text-sm">Publié</span>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Annuler</Button>
                <Button onClick={submit} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editing ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : albums.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <Inbox className="h-10 w-10 mx-auto opacity-50" />
            <p>Aucun album pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map((a) => (
            <Card key={a.id} className="overflow-hidden group hover:shadow-lg transition-smooth">
              <Link to={`/app/albums/${a.id}`} className="block">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {a.couverture_url ? (
                    <img src={a.couverture_url} alt={a.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Images className="h-12 w-12 opacity-30" />
                    </div>
                  )}
                  {!a.publie && <Badge variant="outline" className="absolute top-2 left-2 bg-background">Brouillon</Badge>}
                  <Badge variant="secondary" className="absolute bottom-2 right-2">
                    {counts[a.id] ?? 0} photo{(counts[a.id] ?? 0) > 1 ? "s" : ""}
                  </Badge>
                </div>
              </Link>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/app/albums/${a.id}`} className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold truncate hover:text-primary transition-smooth">{a.titre}</h3>
                    {a.date_evenement && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.date_evenement).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                  </Link>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer "{a.titre}" ?</AlertDialogTitle>
                            <AlertDialogDescription>L'album et toutes ses photos seront supprimés.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(a)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                {a.description && <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Albums;
