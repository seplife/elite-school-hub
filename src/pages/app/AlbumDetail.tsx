import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, Upload, Trash2, Inbox, Images } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/uploadMedia";

interface Album {
  id: string;
  titre: string;
  description: string | null;
  date_evenement: string | null;
  publie: boolean;
}
interface Photo {
  id: string;
  album_id: string;
  url: string;
  legende: string | null;
  ordre: number;
}

const AlbumDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Photo | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: a, error: e1 }, { data: p, error: e2 }] = await Promise.all([
      supabase.from("albums").select("*").eq("id", id).maybeSingle(),
      supabase.from("photos").select("*").eq("album_id", id).order("ordre").order("created_at"),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    setAlbum((a as Album) ?? null);
    setPhotos((p as Photo[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !id) return;
    setUploading(true);
    let success = 0; let failed = 0;
    for (const file of Array.from(files)) {
      try {
        const url = await uploadMedia(file, "albums");
        const { error } = await supabase.from("photos").insert({
          album_id: id, url, ordre: photos.length + success,
        });
        if (error) throw error;
        success++;
      } catch (e: any) {
        failed++;
        console.error(e);
      }
    }
    setUploading(false);
    if (success > 0) toast.success(`${success} photo${success > 1 ? "s" : ""} ajoutée${success > 1 ? "s" : ""}.`);
    if (failed > 0) toast.error(`${failed} échec${failed > 1 ? "s" : ""}.`);
    load();
  };

  const removePhoto = async (photo: Photo) => {
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) return toast.error(error.message);
    toast.success("Photo supprimée.");
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!album) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-muted-foreground">Album introuvable.</p>
        <Button asChild variant="outline"><Link to="/app/albums"><ArrowLeft className="h-4 w-4 mr-1" /> Retour</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/app/albums"><ArrowLeft className="h-4 w-4 mr-1" /> Tous les albums</Link>
      </Button>

      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-3xl font-bold">{album.titre}</h1>
          {!album.publie && <Badge variant="outline">Brouillon</Badge>}
        </div>
        {album.date_evenement && (
          <p className="text-sm text-muted-foreground">
            {new Date(album.date_evenement).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        {album.description && <p className="text-muted-foreground">{album.description}</p>}
      </header>

      {isAdmin && (
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Ajouter des photos</Label>
              <Input type="file" accept="image/*" multiple disabled={uploading}
                onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }} />
            </div>
            {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            <Upload className="h-5 w-5 text-muted-foreground hidden sm:block" />
          </CardContent>
        </Card>
      )}

      {photos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <Inbox className="h-10 w-10 mx-auto opacity-50" />
            <p>Aucune photo dans cet album.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((ph) => (
            <div key={ph.id} className="relative group aspect-square overflow-hidden rounded-lg bg-muted">
              <button onClick={() => setPreview(ph)} className="block w-full h-full">
                <img src={ph.url} alt={ph.legende ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              </button>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
                      <AlertDialogDescription>Action irréversible.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removePhoto(ph)}>Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreview(null)}
        >
          <img src={preview.url} alt={preview.legende ?? ""} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default AlbumDetail;
