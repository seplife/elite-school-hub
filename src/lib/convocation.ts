import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExamenConvocation {
  titre: string;
  type: string;
  matiere: string;
  date_debut: string;
  duree_minutes: number;
  salle: string | null;
  surveillant_nom: string | null;
  instructions: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  composition: "Composition",
  devoir_surveille: "Devoir surveillé",
  examen_blanc: "Examen blanc",
  bac_blanc: "BAC blanc",
};

export function genererConvocationPDF(opts: {
  nom_etablissement: string;
  classe: string;
  annee_scolaire: string;
  trimestre?: string | null;
  examens: ExamenConvocation[];
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Bande tricolore Côte d'Ivoire
  doc.setFillColor(255, 130, 0); doc.rect(0, 0, pageW / 3, 6, "F");
  doc.setFillColor(255, 255, 255); doc.rect(pageW / 3, 0, pageW / 3, 6, "F");
  doc.setFillColor(0, 158, 96); doc.rect((pageW / 3) * 2, 0, pageW / 3, 6, "F");

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", pageW / 2, 14, { align: "center" });
  doc.setFontSize(9);
  doc.text("Union — Discipline — Travail", pageW / 2, 19, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(opts.nom_etablissement, pageW / 2, 30, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(0, 90, 160);
  doc.text("CONVOCATION AUX EXAMENS", pageW / 2, 42, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.text(`Classe : ${opts.classe}`, 15, 55);
  doc.text(`Année scolaire : ${opts.annee_scolaire}`, 15, 62);
  if (opts.trimestre) doc.text(`Trimestre : ${opts.trimestre}`, 15, 69);

  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(
    "Les élèves de la classe ci-dessus sont convoqués aux épreuves suivantes. Présence obligatoire 15 minutes avant le début de chaque épreuve, munis d'une pièce d'identité.",
    15, 80, { maxWidth: pageW - 30 }
  );

  const rows = opts.examens
    .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())
    .map((e) => {
      const d = new Date(e.date_debut);
      return [
        d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }),
        d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        `${e.duree_minutes} min`,
        e.matiere,
        TYPE_LABEL[e.type] || e.type,
        e.salle || "—",
        e.surveillant_nom || "—",
      ];
    });

  autoTable(doc, {
    startY: 95,
    head: [["Date", "Heure", "Durée", "Matière", "Type", "Salle", "Surveillant"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [0, 90, 160], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    margin: { left: 15, right: 15 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 110;

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("Recommandations :", 15, finalY + 12);
  doc.setFontSize(8);
  const recos = [
    "• Téléphones portables et montres connectées strictement interdits.",
    "• Apporter le matériel autorisé pour chaque épreuve.",
    "• Toute fraude entraînera l'annulation des épreuves concernées.",
    "• Tenue scolaire correcte exigée.",
  ];
  recos.forEach((r, i) => doc.text(r, 15, finalY + 18 + i * 5));

  doc.setFontSize(9);
  doc.setTextColor(0);
  const sigY = finalY + 50;
  doc.text(`Fait à Abidjan, le ${new Date().toLocaleDateString("fr-FR")}`, pageW - 15, sigY, { align: "right" });
  doc.text("La Direction", pageW - 15, sigY + 8, { align: "right" });

  doc.setFontSize(7);
  doc.setTextColor(120);
  doc.text(`Document généré le ${new Date().toLocaleString("fr-FR")}`, pageW / 2, 290, { align: "center" });

  doc.save(`convocation_${opts.classe.replace(/\s+/g, "_")}_${opts.annee_scolaire}.pdf`);
}
