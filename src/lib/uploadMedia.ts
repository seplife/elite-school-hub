import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to the public media-school bucket.
 * Returns the public URL on success.
 */
export async function uploadMedia(file: File, folder: "annonces" | "albums"): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media-school").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("media-school").getPublicUrl(path);
  return data.publicUrl;
}
