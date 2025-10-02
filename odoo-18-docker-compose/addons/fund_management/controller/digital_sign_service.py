# file: digital_sign_service.py
import os
from io import BytesIO
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import requests
from PIL import Image
import fitz  # PyMuPDF
import time
import datetime, uuid


from threading import Thread

# Cấu hình URL Odoo
ODOO_BASE_URL = "http://localhost:8069"

app = Flask(__name__)
CORS(app)  # <-- bật CORS cho toàn bộ API

@app.route('/')
def home():
    return jsonify({"message": "Digital Signature Service is running!"})



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

    try:
        image_data_url, pdf_url, name, email, phone, id_number, birth_date = extract_input_data()

        print("👤 Người ký:")
        print(" - name:", name)
        print(" - email:", email)
        print(" - phone:", phone)


        signature_bytes = decode_signature_image(image_data_url)
        print("✅ Giải mã base64 chữ ký thành công")

        pdf_bytes = download_pdf(pdf_url)
        print("✅ PDF tải thành công")

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[-1]  # Trang cuối
        print(f"📄 Số trang: {len(doc)}, đang thêm vào trang {len(doc)}")

        rect_signature, rect_name, rect_email, rect_birth, rect_cccd, rect_phone = get_signature_positions()

        # Lưu ảnh tạm và chèn vào PDF
        signature_path = save_temp_signature(signature_bytes)
        page.insert_image(rect_signature, filename=signature_path)
        page.insert_textbox(rect_name, name, fontsize=13, color=(0, 0, 0), align=0)
        page.insert_textbox(rect_email, email, fontsize=13, color=(0, 0, 0), align=0)
        page.insert_textbox(rect_birth, birth_date, fontsize=13, color=(0, 0, 0), align=0)
        page.insert_textbox(rect_cccd, id_number, fontsize=13, color=(0, 0, 0), align=0)
        page.insert_textbox(rect_phone, phone, fontsize=13, color=(0, 0, 0), align=0)

        output = BytesIO()
        doc.save(output)
        output.seek(0)
        print("💾 PDF đã lưu vào memory stream")

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:6]
        filename = f"signed_{name.replace(' ', '_')}_{timestamp}_{unique_id}.pdf"

        file_path = save_pdf_to_disk(output, filename)

        # Gửi sang Odoo lưu vào session
        save_file_path_to_odoo_session(file_path)

        return send_file(output, mimetype="application/pdf", download_name="signed_hand.pdf")

    except ValueError as ve:
        print("❌ Dữ liệu thiếu:", str(ve))
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print("❌ Lỗi khi xử lý PDF/chữ ký:", str(e))
        return jsonify({"error": str(e)}), 500



# Hàm lấy dữ liệu đầu vào từ frontend
def extract_input_data():
    data = request.json
    image_data_url = data.get("signature_image")
    pdf_url = data.get("pdf_url")
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    id_number = data.get("id_number")
    birth_date = data.get("birth_date")

    if not image_data_url or not pdf_url:
        raise ValueError("Thiếu dữ liệu đầu vào")

    return image_data_url, pdf_url, name, email, phone, id_number, birth_date


# Hàm decode ảnh base64
def decode_signature_image(image_data_url):
    header, encoded = image_data_url.split(",", 1)
    return base64.b64decode(encoded)


# Hàm tải PDF từ URL
def download_pdf(url_path):
    full_url = ODOO_BASE_URL + url_path
    resp = requests.get(full_url)
    return BytesIO(resp.content)


# Hàm xử lý và lưu ảnh chữ ký tạm
def save_temp_signature(signature_bytes):
    img = Image.open(BytesIO(signature_bytes))
    if img.mode in ('RGBA', 'LA'):
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        background.save("temp_signature.jpg")
    else:
        img.convert("RGB").save("temp_signature.jpg")
    return "temp_signature.jpg"

# Hàm xác định vị trí text/ảnh
def get_signature_positions():
    rect_signature = fitz.Rect(315, 662, 550, 700)
    rect_name = fitz.Rect(180, 272, 600, 420)
    rect_birth = fitz.Rect(180, 298, 600, 340)
    rect_cccd = fitz.Rect(180, 324, 600, 370)
    rect_email = fitz.Rect(180, 349, 600, 470)
    rect_phone = fitz.Rect(180, 374, 600, 430)
    return rect_signature, rect_name, rect_email,rect_birth, rect_cccd, rect_phone

# Hàm lưu PDF ra thư mục
def save_pdf_to_disk(output_stream, filename):
    folder_path = "signed_pdfs"
    os.makedirs(folder_path, exist_ok=True)  # Tạo thư mục nếu chưa tồn tại

    file_path = os.path.join(folder_path, filename)
    with open(file_path, "wb") as f:
        f.write(output_stream.getbuffer())  # Ghi nội dung từ memory stream ra file

    print(f"💾 Đã lưu PDF vào: {file_path}")
    return file_path

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
        app.run(debug=True, port=5000, use_reloader=False, host='0.0.0.0')

    # Chạy Flask trên thread riêng để không chặn Odoo
    t = Thread(target=start)
    t.daemon = True
    t.start()

# Thêm main block để có thể chạy trực tiếp
if __name__ == '__main__':
    print("🚀 Khởi động Digital Signature Service...")
    print("📍 Service sẽ chạy trên: http://localhost:5000")
    print("✍️ Signature endpoint: http://localhost:5000/api/append_signature")
    app.run(debug=True, port=5000, host='0.0.0.0')


def save_file_path_to_odoo_session(file_path):
    odoo_url = f"{ODOO_BASE_URL}/save_signed_pdf_path"

    print("file_path lấy được:", file_path)

    session_id = request.cookies.get('session_id')
    cookies = {"session_id": session_id} if session_id else {}

    data = {"file_path": file_path}
    resp = requests.post(odoo_url, data=data, cookies=cookies)
    print("📤 Gửi file_path sang Odoo:", resp.status_code, resp.text)