# file: digital_sign_service.py
from io import BytesIO
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import requests
from PIL import Image
import fitz  # PyMuPDF
import time

from threading import Thread

app = Flask(__name__)
CORS(app)  # <-- bật CORS cho toàn bộ API


@app.route('/api/sign', methods=['POST'])
def sign_document():
    # Nhận file và metadata
    data = request.json
    document = data.get('document_base64')  # tài liệu mã hóa base64
    signer = data.get('signer')

    if not document or not signer:
        return jsonify({"success": False, "error": "Thiếu dữ liệu"}), 400

    # Mô phỏng xử lý ký số
    time.sleep(2)
    fake_signature = f"SignedBy:{signer}@{time.strftime('%Y-%m-%d %H:%M:%S')}"

    return jsonify({
        "success": True,
        "signature": fake_signature,
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
    })


@app.route('/api/append_signature', methods=['POST'])
def append_signature():
    print("📥 Nhận request /api/append_signature")

    data = request.json
    image_data_url = data.get("signature_image")
    pdf_url = data.get("pdf_url")

    print("🔍 Dữ liệu nhận được:")
    print(" - image_data_url: ", image_data_url[:30], "...")  # log ngắn
    print(" - pdf_url: ", pdf_url)

    name = data.get("name")
    email = data.get("email")
    print("👤 Người ký:")
    print(" - name:", name)
    print(" - email:", email)

    if not image_data_url or not pdf_url:
        print("❌ Thiếu dữ liệu đầu vào")
        return jsonify({"error": "Thiếu dữ liệu"}), 400

    try:
        # 🧠 Tách base64 ra khỏi prefix "data:image/png;base64,..."
        header, encoded = image_data_url.split(",", 1)
        signature_bytes = base64.b64decode(encoded)
        print("✅ Giải mã base64 chữ ký thành công")

        # 📥 Tải PDF từ URL
        full_pdf_url = "http://localhost:8069" + pdf_url
        print(f"🌐 Đang tải PDF từ: {full_pdf_url}")
        pdf_resp = requests.get(full_pdf_url)
        pdf_bytes = BytesIO(pdf_resp.content)
        print("✅ PDF tải thành công")

        # 🖋️ Mở PDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[-1]  # Trang cuối
        print(f"📄 Số trang: {len(doc)}, đang thêm vào trang {len(doc)}")

        # 📏 Tính toán vị trí ảnh
        rect = fitz.Rect(315, 692, 550, 742)
        rect_name = fitz.Rect(0, 272, 350, 420)
        rect_email = fitz.Rect(0, 349, 360, 460)  # Email dưới tên 30px
        print("📐 Vị trí chữ ký:", rect)
        print("📍 Vị trí name:", rect_name)
        print("📍 Vị trí email:", rect_email)
        # Giả sử bạn đã có biến `page` là 1 trang PDF
        text_name = f"{name}"
        text_email = f"{email}"
        print(f"Tên: {name}")
        print(f"Email: {email}")
        # 🖼️ Thêm ảnh vào PDF
        img_stream = BytesIO(signature_bytes)
        img = Image.open(img_stream)
        # Xử lý nền trong suốt: chuyển thành nền trắng
        if img.mode in ('RGBA', 'LA'):
            background = Image.new("RGB", img.size, (255, 255, 255))  # nền trắng
            background.paste(img, mask=img.split()[3])  # dán ảnh PNG lên nền trắng
            background.save("temp_signature.jpg")
        else:
            img.convert("RGB").save("temp_signature.jpg")

        print("🖼️ Lưu ảnh chữ ký tạm vào temp_signature.jpg")

        page.insert_image(rect, filename="temp_signature.jpg")
        print("✅ Đã chèn ảnh vào PDF")

        page.insert_textbox(rect_name, text_name, fontsize=13, color=(0, 0, 0), align=1)

        page.insert_textbox(rect_email, text_email, fontsize=13, color=(0, 0, 0), align=1)

        # 💾 Xuất file mới
        output = BytesIO()
        doc.save(output)
        output.seek(0)
        print("💾 PDF đã lưu vào memory stream")

        return send_file(output, mimetype="application/pdf", download_name="signed_hand.pdf")

    except Exception as e:
        print("❌ Lỗi khi xử lý PDF/chữ ký:", str(e))
        return jsonify({"error": str(e)}), 500

def get_center_rect(page, width, height, y_offset):
    """Tính toán Rect để đặt phần tử vào giữa trang theo chiều ngang"""
    page_width = page.rect.width
    x0 = (page_width - width) / 2
    x1 = x0 + width
    y0 = y_offset
    y1 = y0 + height
    return fitz.Rect(x0, y0, x1, y1)

def run_flask_server():
    def start():
        print("🚀 Flask ký số đang khởi động tại http://127.0.0.1:5000 ...")
        app.run(debug=False, port=5000, use_reloader=False)

    # Chạy Flask trên thread riêng để không chặn Odoo
    t = Thread(target=start)
    t.daemon = True
    t.start()
