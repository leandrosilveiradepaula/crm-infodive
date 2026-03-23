
import jsPDF from 'jspdf';

interface AcceptanceTermData {
    dealTitle: string;
    customerName: string;
    items?: { name: string; quantity: number; description?: string }[];
    technicalLeadName?: string;
    date: string;
    checklist: Record<string, boolean>;
}

export const generateAcceptanceTermPDF = (data: AcceptanceTermData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Termo de Aceite de Entrega", pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, pageWidth / 2, 38, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(margin, 45, pageWidth - margin, 45);

    // Project Info
    let yPos = 60;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    doc.setFont('helvetica', 'bold');
    doc.text("Dados do Projeto:", margin, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 10;
    doc.text(`Cliente: ${data.customerName}`, margin, yPos);
    yPos += 7;
    doc.text(`Projeto/Oportunidade: ${data.dealTitle}`, margin, yPos);
    yPos += 7;
    doc.text(`Data de Entrega: ${data.date}`, margin, yPos);

    yPos += 15;

    // Delivery Status (Checklist)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Checklist de Entrega Técnica:", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const checklistLabels: Record<string, string> = {
        'licenses_generated': 'Licenças Geradas',
        'hardware_shipped': 'Hardware Enviado / Entregue',
        'access_credentials_created': 'Credenciais de Acesso Criadas',
        'onboarding_scheduled': 'Onboarding Agendado',
        'documentation_sent': 'Documentação Técnica Enviada'
    };

    Object.entries(data.checklist).forEach(([key, value]) => {
        const label = checklistLabels[key] || key;
        const status = value ? "[OK]" : "[PENDENTE]";
        doc.text(`${status} ${label}`, margin + 5, yPos);
        yPos += 7;
    });

    // Project Items Table
    if (data.items && data.items.length > 0) {
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Itens e Serviços Entregues:", margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Item", margin, yPos);
        doc.text("Qtd", pageWidth - margin - 20, yPos, { align: 'right' });
        yPos += 2;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        data.items.forEach(item => {
            // Check for page overflow
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(item.name, margin, yPos);
            doc.text(String(item.quantity), pageWidth - margin - 20, yPos, { align: 'right' });
            yPos += 7;
        });
    }

    // Content Text
    yPos += 10;
    doc.setFontSize(10);
    doc.text("Declaramos para os devidos fins que os itens e serviços relacionados a este projeto foram entregues", margin, yPos);
    yPos += 5;
    doc.text("e configurados conforme as especificações técnicas acordadas.", margin, yPos);

    yPos += 10;
    doc.text("Ao assinar este documento, o cliente confirma o recebimento e o aceite técnico da solução.", margin, yPos);

    // Signatures
    yPos += 50;

    doc.line(margin, yPos, margin + 70, yPos); // Line 1
    doc.line(pageWidth - margin - 70, yPos, pageWidth - margin, yPos); // Line 2

    yPos += 5;
    doc.setFontSize(10);
    doc.text("Assinatura do Cliente", margin, yPos);
    doc.text("Assinatura do Responsável Técnico", pageWidth - margin - 70, yPos);

    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(data.customerName, margin, yPos);
    if (data.technicalLeadName) doc.text(String(data.technicalLeadName), pageWidth - margin - 70, yPos);

    doc.save(`termo_aceite_${data.dealTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};
