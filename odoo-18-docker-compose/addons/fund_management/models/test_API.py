import requests

url = 'http://localhost:8069/some_url2'

try:
    response = requests.get(url)
    response.raise_for_status()  # Gây lỗi nếu HTTP status code là 4xx/5xx

    data = response.json()
    print("✅ Dữ liệu nhận được:")
    for item in data:
        print(f"- {item['name']}: {item['description']}")

except requests.exceptions.RequestException as e:
    print("❌ Lỗi khi gọi API:", e)