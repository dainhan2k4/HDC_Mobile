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
    return `
      <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8" />
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
            .signature img {
              margin-top: 20px;
              max-height: 100px;
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
              <img src="${data.signatureImage}" alt="Chữ ký khách hàng"/>
            </div>
          </div>

        </body>
        </html>

    `;
  }



} 