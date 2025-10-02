from ..utils import mround
from odoo import http
from odoo.http import request
import json
import pandas as pd
import io
import random


class ImportExcelController(http.Controller):
    
    @http.route('/api/transaction-list/import-excel', type='http', auth='user', methods=['POST'], csrf=False)
    def import_excel_transactions(self, **kwargs):
        """Import transactions from Excel file"""
        print("=== IMPORT EXCEL TRANSACTIONS ===")
        
        try:
            # Lấy file từ request
            file = request.httprequest.files.get('file')
            if not file:
                return request.make_response(
                    json.dumps({
                        "success": False,
                        "message": "Không có file được upload"
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            # Đọc file Excel
            try:
                df = pd.read_excel(file)
            except Exception as e:
                return request.make_response(
                    json.dumps({
                        "success": False,
                        "message": f"Lỗi đọc file Excel: {str(e)}"
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            # Lấy danh sách fund có sẵn
            funds = request.env['portfolio.fund'].sudo().search([('status', '=', 'active')])
            if not funds:
                return request.make_response(
                    json.dumps({
                        "success": False,
                        "message": "Không có fund nào active để import"
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            # Tạo mapping fund theo ticker
            fund_mapping = {f.ticker: f for f in funds}
            
            transactions = []
            user_id = request.env.user.id
            
            # Xử lý từng dòng trong Excel
            for index, row in df.iterrows():
                try:
                    # Lấy thông tin từ Excel (giả sử có các cột: ticker, transaction_type, units, amount)
                    ticker = str(row.get('ticker', '')).strip()
                    transaction_type = str(row.get('transaction_type', 'purchase')).strip().lower()
                    units = float(row.get('units', 0))
                    amount = float(row.get('amount', 0))
                    
                    # Làm tròn số lượng CCQ về bội số của 50 (50, 100, 150, 200, 250, 300, ...)
                    if units > 0:
                        # MROUND(step=50) cho số CCQ
                        units = mround(units, 50)
                        if units < 50:  # Đảm bảo tối thiểu 50 CCQ
                            units = 50
                    
                    # Tìm fund theo ticker
                    fund = fund_mapping.get(ticker)
                    if not fund:
                        print(f"Không tìm thấy fund với ticker: {ticker}")
                        continue
                    
                    # Tạo NAV dao động ngẫu nhiên từ 10,000 trở lên (0% đến +20%)
                    base_nav = 10000  # Base là 10,000
                    variation_percent = random.uniform(0.0, 0.2)  # 0% đến +20%
                    current_nav = base_nav * (1 + variation_percent)  # Kết quả: 10,000 - 12,000
                    current_nav = round(current_nav, 2)  # Làm tròn 2 chữ số thập phân
                    
                    # Tính lại amount với NAV dao động
                    amount = units * current_nav
                    
                    # Tạo transaction
                    transaction = request.env['portfolio.transaction'].sudo().create({
                        'user_id': user_id,
                        'fund_id': fund.id,
                        'transaction_type': transaction_type,
                        'units': units,
                        'price': current_nav,  # Thêm trường price = current_nav
                        'amount': amount,
                        'current_nav': current_nav,  # Lưu NAV dao động vào transaction
                        'matched_units': 0,  # Khởi tạo số lượng khớp = 0
                        'status': 'pending',
                        'source': 'portfolio',
                        'contract_pdf_path': f"imported_{ticker}_{index+1}.pdf"
                    })
                    
                    transactions.append({
                        "id": transaction.id,
                        "fund_name": fund.name,
                        "fund_ticker": fund.ticker,
                        "transaction_type": transaction_type,
                        "units": units,
                        "price": current_nav,  # Thêm trường price
                        "base_nav": base_nav,
                        "current_nav": current_nav,
                        "variation_percent": round(variation_percent * 100, 2),
                        "amount": amount,
                        "created_at": transaction.create_date.strftime('%Y-%m-%d %H:%M:%S')
                    })
                    
                except Exception as e:
                    print(f"Lỗi xử lý dòng {index + 1}: {str(e)}")
                    continue
            
            return request.make_response(
                json.dumps({
                    "success": True,
                    "message": f"Đã import {len(transactions)} giao dịch từ Excel với NAV 10,000-12,000",
                    "transactions": transactions,
                    "funds_used": [{"id": f.id, "name": f.name, "ticker": f.ticker, "current_nav": f.current_nav} for f in funds],
                    "note": "NAV được tạo từ 10,000-12,000 để test khớp lệnh chính xác."
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")]
            )
            
        except Exception as e:
            print("LỖI IMPORT EXCEL:", str(e))
            import traceback
            traceback.print_exc()
            return request.make_response(
                json.dumps({"success": False, "message": str(e)}, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )
