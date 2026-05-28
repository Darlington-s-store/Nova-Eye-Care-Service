import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ScreeningData = {
  patientName: string;
  screeningDate: string;
  vaRight: string;
  vaLeft: string;
  iopRight: number;
  iopLeft: number;
  diagnosis: string;
  followup: string;
};

export const generateScreeningPDF = (data: ScreeningData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header - Clinic Branding
  doc.setFontSize(22);
  doc.setTextColor(10, 45, 100); // Nova Dark Blue
  doc.text("NOVA EYE CARE", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Professional Optometry & Clinical Excellence", pageWidth / 2, 27, { align: "center" });
  doc.line(20, 32, pageWidth - 20, 32);

  // Report Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("CLINICAL SCREENING REPORT", 20, 45);

  // Patient Info
  doc.setFontSize(11);
  doc.text(`Patient Name: ${data.patientName}`, 20, 55);
  doc.text(`Date of Examination: ${new Date(data.screeningDate).toLocaleDateString()}`, 20, 62);
  doc.text(`Report ID: NOVA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, pageWidth - 70, 55);

  // Clinical Table
  autoTable(doc, {
    startY: 75,
    head: [["Assessment Field", "Right Eye (OD)", "Left Eye (OS)"]],
    body: [
      ["Visual Acuity (V.A)", data.vaRight || "N/A", data.vaLeft || "N/A"],
      ["Intraocular Pressure (IOP)", `${data.iopRight || "N/A"} mmHg`, `${data.iopLeft || "N/A"} mmHg`],
    ],
    headStyles: { fillColor: [10, 45, 100], textColor: [255, 255, 255], fontStyle: 'bold' },
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // Diagnosis Section
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as Record<string, any>).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Clinical Diagnosis & Impressions:", 20, finalY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const diagnosisLines = doc.splitTextToSize(data.diagnosis || "No specific diagnosis recorded during this session.", pageWidth - 40);
  doc.text(diagnosisLines, 20, finalY + 7);

  // Recommendations
  const followUpY = finalY + 15 + (diagnosisLines.length * 5);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Recommended Follow-up / Plan:", 20, followUpY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const followupLines = doc.splitTextToSize(data.followup || "Regular annual review recommended.", pageWidth - 40);
  doc.text(followupLines, 20, followUpY + 7);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("This is a computer-generated medical record from the Nova Eye Care Portal.", 20, footerY);
  doc.text("www.novaeyecare.com | Specialized Eye Health Services", pageWidth - 20, footerY, { align: "right" });

  doc.save(`Nova_Screening_${data.patientName.replace(/\s+/g, '_')}.pdf`);
};
