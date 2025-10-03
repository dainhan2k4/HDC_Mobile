import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';


export interface PdfSignatureData {
  signatureImage: string;
  investorName: string;
  investorBirthday: string;
  investorIdCard: string;
  investorEmail: string;
  investorPhone: string;
  isDigitalSignature?: boolean; // Flag để phân biệt ký số
}

export class PdfService {
  /**
   * Thêm chữ ký vào PDF có sẵn
   */
  static async appendSignatureToPdf(data: PdfSignatureData): Promise<string> {
    try {
      const htmlWithPdf = this.createHtmlWithPdf(data);
      return htmlWithPdf;
    } catch (error) {
      console.error('❌ [PdfService] Append signature error:', error);
      return '';
    }
  }

  /**
   * Tạo HTML với PDF embedded và thông tin động
   */
  private static createHtmlWithPdf(data: PdfSignatureData): string {
    const escapeHtml = (value: string): string => {
      if (!value) return '';
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    console.log('📝 [PdfService] Creating HTML with data:', {
      isDigitalSignature: data.isDigitalSignature,
      signatureImageLength: data.signatureImage?.length,
      signaturePreview: data.signatureImage?.substring(0, 50)
    });

    const signatureText = escapeHtml(data.signatureImage || '');

    const signatureHtml = data.isDigitalSignature 
      ? `<div style="margin-top: 20px; padding: 15px; background: #f8f9fe; border: 2px solid #2B4BFF; border-radius: 8px; text-align: left;">
          <div style="margin-bottom: 10px; display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; width:10px; height:10px; background:#2B4BFF; border-radius:50%;"></span>
            <strong style="color: #2B4BFF; font-size: 16px;">ĐÃ KÝ SỐ ĐIỆN TỬ</strong>
          </div>
          <div style="color:#333; font-size:12px; margin-bottom:6px;"><strong>Mã chữ ký số:</strong></div>
          <pre style="font-family: 'Courier New', monospace; background: #fff; padding: 12px; border-radius: 6px; white-space: pre-wrap; word-break: break-word; font-size: 12px; border: 1px solid #cdd6f4; color: #111; margin:0;">${signatureText || '(Không nhận được mã chữ ký)'}</pre>
        </div>`
      : `<img src="${data.signatureImage}" alt="Chữ ký khách hàng" style="max-height: 100px; margin-top: 20px;"/>`;

    console.log('🎨 [PdfService] Generated signature HTML length:', signatureHtml.length);

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hợp Đồng Mua Bán CCQ</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px; 
      line-height: 1.6;
    }
    h2 {
      text-align: center;
      text-transform: uppercase;
      color: #333;
    }
    .section {
      margin-top: 20px;
    }
    .signature-box {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
    }
    .signature {
      width: 45%;
      text-align: center;
    }
  </style>
</head>
<body>  
  <h2>Hợp Đồng Mua Bán CCQ</h2>

  <div class="section">
    <strong>Thông tin Bên A – Công ty quản lý quỹ</strong><br/>
    Tên công ty: Công ty ABC<br/>
    Địa chỉ: 19 Nguyễn Đình Chiểu, Phường Sài Gòn, TP.HCM<br/>
    MST: 999999999<br/>
    Người đại diện: ....................................................
  </div>

  <div class="section">
    <strong>Thông tin Bên B – Nhà đầu tư</strong><br/>
    Họ và tên: ${data.investorName}<br/>
    Ngày sinh: ${data.investorBirthday}<br/>
    Số CCCD: ${data.investorIdCard}<br/>
    Email: ${data.investorEmail}<br/>
    Số điện thoại: ${data.investorPhone}
  </div>

  <div class="section">
    <strong>1. Cam kết hiểu biết và chấp nhận rủi ro:</strong><br/>
    Người mua xác nhận rằng họ đã đọc, hiểu và đồng ý với bản cáo bạch, điều lệ quỹ và các tài liệu liên quan được cung cấp bởi Công ty Quản lý Quỹ. Nhà đầu tư hoàn toàn nhận thức được rằng việc đầu tư vào CCQ có thể chịu ảnh hưởng bởi biến động của thị trường và không có bất kỳ đảm bảo nào về lợi nhuận hoặc hoàn trả vốn đầu tư.
  </div>

  <div class="section">
    <strong>2. Thời hạn giao dịch và thanh toán:</strong><br/>
    Nhà đầu tư đồng ý rằng mọi giao dịch mua CCQ sẽ chỉ được xử lý khi Công ty nhận đủ tiền đầu tư trong thời hạn quy định. Nếu quá thời hạn chuyển khoản, lệnh mua có thể bị hủy bỏ mà không cần thông báo trước. Mọi chi phí chuyển tiền (nếu có) do nhà đầu tư chịu trách nhiệm.
  </div>

  <div class="signature-box">
    <div class="signature">
      <strong>Xác nhận chữ ký công ty</strong><br/>
      (Ký tên, đóng dấu)
    </div>
    <div class="signature">
      <strong>Xác nhận chữ ký khách hàng</strong><br/>
      (Ký và ghi rõ họ tên)<br/>
      ${signatureHtml}
    </div>
  </div>

</body>
</html>`;
  }



} 