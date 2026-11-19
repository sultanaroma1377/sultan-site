import type jsPDF from 'jspdf';
import type { ConfirmedOrder } from './types';

export function drawAddress(pdf: jsPDF, order: ConfirmedOrder, site: { name: string; address: string; phone?: string }, x: number, y: number, qr?: string) {
  const width = qr ? 88 : 126;
  if (qr) pdf.addImage(qr, 'PNG', x + 92, y, 34, 34);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.text('TO:', x, y);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(12);
  const names = pdf.splitTextToSize(order.receiverName, width);
  pdf.text(names, x, y + 6);
  let cursor = y + 6 + names.length * 5;
  pdf.setFontSize(10); pdf.text(order.receiverPhone, x, cursor); cursor += 6;
  if (order.receiverWhatsapp) { pdf.text(`WhatsApp: ${order.receiverWhatsapp}`, x, cursor); cursor += 6; }
  const address = pdf.splitTextToSize(`${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`, width);
  pdf.text(address, x, cursor); cursor += address.length * 5 + 5;
  pdf.setFontSize(8); pdf.text(`Order #${order.orderNo ?? order.id}`, x, cursor);
  cursor = Math.max(y + 65, cursor + 12);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('FROM:', x, cursor);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); cursor += 6;
  const business = pdf.splitTextToSize(site.name, 126); pdf.text(business, x, cursor); cursor += business.length * 5;
  const senderAddress = pdf.splitTextToSize(site.address, 126); pdf.text(senderAddress, x, cursor); cursor += senderAddress.length * 5;
  if (site.phone) pdf.text(site.phone, x, cursor);
}