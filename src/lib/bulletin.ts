import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface BulletinParams {
  bareme: number;
  poids_composition: number;
  poids_devoir: number;
  afficher_rang: boolean;
  afficher_mention: boolean;
  seuil_excellent: number;
  seuil_bien: number;
  seuil_assez_bien: number;
  seuil_passable: number;
  nom_etablissement: string;
}

export interface MatiereLigne {
  matiere: string;
  coefficient: number;
  moyenne: number | null; // moyenne de la matière (devoirs+composition pondérés)
}

export interface BulletinData {
  eleve: { nom: string; prenom: string; matricule: string; sexe: string; date_naissance: string };
  classe: string;
  annee_scolaire: string;
  trimestre: "1" | "2" | "3";
  lignes: MatiereLigne[];
  rang?: number | null;
  effectif?: number;
}

export function calculerMoyenneMatiere(
  notes: { type: "devoir" | "composition"; valeur: number; bareme: number }[],
  params: BulletinParams
): number | null {
  if (!notes.length) return null;
  const norm = notes.map((n) => ({
    type: n.type,
    val: (n.valeur / n.bareme) * params.bareme,
  }));
  const devoirs = norm.filter((n) => n.type === "devoir");
  const compos = norm.filter((n) => n.type === "composition");
  let total = 0, poids = 0;
  if (devoirs.length) {
    const moy = devoirs.reduce((s, n) => s + n.val, 0) / devoirs.length;
    total += moy * params.poids_devoir;
    poids += params.poids_devoir;
  }
  if (compos.length) {
    const moy = compos.reduce((s, n) => s + n.val, 0) / compos.length;
    total += moy * params.poids_composition;
    poids += params.poids_composition;
  }
  return poids ? total / poids : null;
}

export function calculerMoyenneGenerale(lignes: MatiereLigne[]): number | null {
  const valides = lignes.filter((l) => l.moyenne != null);
  if (!valides.length) return null;
  const sum = valides.reduce((s, l) => s + (l.moyenne as number) * l.coefficient, 0);
  const totalCoef = valides.reduce((s, l) => s + l.coefficient, 0);
  return totalCoef ? sum / totalCoef : null;
}

export function mention(moy: number, p: BulletinParams): string {
  if (moy >= p.seuil_excellent) return "Excellent";
  if (moy >= p.seuil_bien) return "Bien";
  if (moy >= p.seuil_assez_bien) return "Assez bien";
  if (moy >= p.seuil_passable) return "Passable";
  return "Insuffisant";
}

export function genererBulletinPDF(data: BulletinData, params: BulletinParams) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Bandeau Côte d'Ivoire
  doc.setFillColor(255, 130, 0); // orange
  doc.rect(0, 0, w / 3, 6, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(w / 3, 0, w / 3, 6, "F");
  doc.setFillColor(0, 154, 68); // vert
  doc.rect((2 * w) / 3, 0, w / 3, 6, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(params.nom_etablissement, w / 2, 16, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("République de Côte d'Ivoire — Ministère de l'Éducation Nationale", w / 2, 22, { align: "center" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`BULLETIN DE NOTES — Trimestre ${data.trimestre}`, w / 2, 32, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Année scolaire ${data.annee_scolaire}`, w / 2, 38, { align: "center" });

  // Bloc élève
  doc.setFontSize(10);
  doc.text(`Élève : ${data.eleve.nom} ${data.eleve.prenom}`, 14, 50);
  doc.text(`Matricule : ${data.eleve.matricule}`, 14, 56);
  doc.text(`Né(e) le : ${data.eleve.date_naissance}  •  Sexe : ${data.eleve.sexe}`, 14, 62);
  doc.text(`Classe : ${data.classe}`, w - 14, 50, { align: "right" });
  if (params.afficher_rang && data.rang) {
    doc.text(`Rang : ${data.rang} / ${data.effectif ?? "-"}`, w - 14, 56, { align: "right" });
  }

  // Tableau
  autoTable(doc, {
    startY: 70,
    head: [["Matière", "Coef", `Moyenne /${params.bareme}`, `× Coef`]],
    body: data.lignes.map((l) => [
      l.matiere,
      String(l.coefficient),
      l.moyenne != null ? l.moyenne.toFixed(2) : "—",
      l.moyenne != null ? (l.moyenne * l.coefficient).toFixed(2) : "—",
    ]),
    headStyles: { fillColor: [255, 130, 0], textColor: 255 },
    styles: { fontSize: 9 },
  });

  const moyG = calculerMoyenneGenerale(data.lignes);
  const totalCoef = data.lignes.filter((l) => l.moyenne != null).reduce((s, l) => s + l.coefficient, 0);
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total coefficients : ${totalCoef}`, 14, finalY);
  doc.text(
    `Moyenne générale : ${moyG != null ? moyG.toFixed(2) : "—"} / ${params.bareme}`,
    w - 14,
    finalY,
    { align: "right" }
  );

  if (params.afficher_mention && moyG != null) {
    doc.setFontSize(10);
    doc.text(`Mention : ${mention(moyG, params)}`, w - 14, finalY + 7, { align: "right" });
  }

  // Pied de page
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
    w / 2,
    doc.internal.pageSize.getHeight() - 8,
    { align: "center" }
  );

  doc.save(`bulletin_${data.eleve.nom}_${data.eleve.prenom}_T${data.trimestre}.pdf`);
}
