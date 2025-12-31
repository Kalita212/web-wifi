import React, { useRef, useEffect, useState } from 'react';
import { X, Printer, Download, Send, Wifi } from 'lucide-react';
import { Payment } from '../../types';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export function InvoiceModal({ isOpen, onClose, payment }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (payment) {
      generateQRCode();
    }
  }, [payment]);

  const generateQRCode = async () => {
    if (!payment) return;
    
    try {
      // Generate QRIS string - in real implementation, this would be from your payment provider
      const qrisData = `00020101021226580014ID.CO.QRIS.WWW0215ID20232912345670303UMI51440014ID.CO.QRIS.WWW02150000000000000000303UMI5204481253033605802ID5925WiFi Manager Indonesia6007Jakarta61051234062070703A016304${payment.nominal}`;
      
      const qrUrl = await QRCode.toDataURL(qrisData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  if (!isOpen || !payment) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const invoiceNumber = `INV${format(new Date(), 'ddMMMyyy').toUpperCase()}${payment.id.substring(0, 4).toUpperCase()}`;
  const isPaid = payment.status === 'Lunas';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    setLoading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    const message = `Halo ${payment.customers?.nama}, berikut adalah invoice pembayaran WiFi Anda untuk periode ${months[payment.bulan - 1]} ${payment.tahun}. Invoice: ${invoiceNumber}. Total: ${formatCurrency(payment.nominal)}. Terima kasih!`;
    const whatsappUrl = `https://wa.me/${payment.customers?.no_hp.replace(/^0/, '62')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendEmail = () => {
    const subject = `Invoice Pembayaran WiFi - ${invoiceNumber}`;
    const body = `Kepada Yth. ${payment.customers?.nama},

Berikut adalah invoice pembayaran WiFi untuk periode ${months[payment.bulan - 1]} ${payment.tahun}:

Invoice Number: ${invoiceNumber}
Periode: ${months[payment.bulan - 1]} ${payment.tahun}
Paket: ${payment.customers?.paket}
Total: ${formatCurrency(payment.nominal)}
Status: ${payment.status}

Terima kasih atas kepercayaan Anda menggunakan layanan WiFi kami.

Salam,
WiFi Manager Team`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Pembayaran</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {loading ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              <Send className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={handleSendEmail}
              className="inline-flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="p-8 bg-white print:p-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl">
                <Wifi className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WiFi Manager</h1>
                <p className="text-gray-600">Internet Service Provider</p>
                <p className="text-sm text-gray-500">Jl. Teknologi No. 123, Jakarta 12345</p>
                <p className="text-sm text-gray-500">Tel: (021) 1234-5678 | Email: info@wifimanager.id</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isPaid ? 'PAID' : 'UNPAID'}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-700">Invoice Number:</span> <span className="font-mono">{invoiceNumber}</span></p>
                <p><span className="font-medium text-gray-700">Issue Date:</span> {format(new Date(), 'dd MMMM yyyy')}</p>
                <p><span className="font-medium text-gray-700">Due Date:</span> {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'dd MMMM yyyy')}</p>
                <p><span className="font-medium text-gray-700">Period:</span> {months[payment.bulan - 1]} {payment.tahun}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{payment.customers?.nama}</p>
                <p className="text-gray-700">{payment.customers?.no_hp}</p>
                <p className="text-gray-700">Paket: {payment.customers?.paket}</p>
                {payment.tgl_bayar && (
                  <p className="text-green-600 font-medium">Paid on: {format(new Date(payment.tgl_bayar), 'dd MMMM yyyy')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Table */}
          <div className="mb-8">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Description
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-900">
                    Period
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-900">
                    Status
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-4 text-sm text-gray-900">
                    Internet Service - {payment.customers?.paket}
                  </td>
                  <td className="border border-gray-300 px-4 py-4 text-sm text-gray-900 text-center">
                    {months[payment.bulan - 1]} {payment.tahun}
                  </td>
                  <td className="border border-gray-300 px-4 py-4 text-sm text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.status === 'Lunas' ? 'bg-green-100 text-green-800' :
                      payment.status === 'Belum Lunas' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'Free' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-4 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(payment.nominal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-8">
            <div className="bg-gray-50 p-6 rounded-lg min-w-80">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(payment.nominal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (0%):</span>
                  <span className="text-gray-900">Rp 0</span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">{formatCurrency(payment.nominal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PAYMENT METHOD</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Bank Transfer</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>BCA</strong> A/C 5015181611 a/n Muhamad Irfan</p>
                    <p><strong>Mandiri</strong> A/C 9000028136415 a/n Muhamad Irfan</p>
                    <p><strong>BRI</strong> A/C 0423 0104 7121 504 a/n Muhamad Irfan</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <h4 className="font-medium text-green-900 mb-3">QRIS Payment</h4>
                  <p className="text-sm text-green-700 mb-3">Scan kode di bawah untuk membayar</p>
                  {qrCodeUrl && (
                    <div className="flex justify-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="QRIS Code" 
                        className="w-32 h-32 border-2 border-green-200 rounded-lg"
                      />
                    </div>
                  )}
                  <p className="text-xs text-green-600 mt-2">Berlaku untuk semua e-wallet dan mobile banking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Notes */}
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Terms & Conditions</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Pembayaran paling lambat tanggal 10 setiap bulan</li>
                  <li>• Layanan akan diputus jika terlambat bayar lebih dari 7 hari</li>
                  <li>• Biaya reconnect Rp 50.000 untuk pemutusan layanan</li>
                  <li>• Komplain layanan hubungi customer service</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Terima kasih telah menggunakan layanan WiFi Manager.</p>
                  <p>Untuk pertanyaan, hubungi: (021) 1234-5678</p>
                  <p>Email: support@wifimanager.id</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-8 pt-6 border-t border-gray-200">
            <p>Invoice ini digenerate secara otomatis oleh sistem WiFi Manager pada {format(new Date(), 'dd MMMM yyyy HH:mm')} WIB</p>
            <p className="mt-1">WiFi Manager - Connecting You to the World</p>
          </div>
        </div>
      </div>
    </div>
  );
}