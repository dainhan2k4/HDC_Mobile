def mround(value, step=50):
    try:
        step = float(step or 0)
        if step <= 0:
            return float(value or 0)
        return round(float(value or 0) / step) * step
    except Exception:
        return value
from odoo import http, fields
from odoo.http import request, Response

import json

# Ở đầu file controller
last_signed_pdf_path = None

class InvestmentController(http.Controller):

    @http.route('/save_signed_pdf_path', type='http', auth='public', csrf=False, methods=['POST'])
    def save_signed_pdf_path(self, **kwargs):
        global last_signed_pdf_path  # ⬅ khai báo để sửa biến toàn cục
        print("Kwargs:", kwargs)
        file_path = kwargs.get("file_path")
        request.session["signed_pdf_path"] = file_path
        last_signed_pdf_path = file_path
        print("💾 Đã lưu file_path vào session:", file_path)
        return Response(
            json.dumps({"success": True}),
            content_type="application/json"
        )

    @http.route('/create_investment', type='http', auth='user', methods=['POST'], csrf=False)
    def create_investment(self, **kwargs):
        print("=== CREATE INVESTMENT ===")
        print("Kwargs:", kwargs)
        print("Request method:", request.httprequest.method)
        print("Content type:", request.httprequest.content_type)

        try:
            # Lấy dữ liệu từ form
            fund_id = kwargs.get('fund_id')
            units = kwargs.get('units')

            print("fund_id:", fund_id)
            print("units:", units)

            if not fund_id or not units:
                return self._json_response({"success": False, "message": "Thiếu thông tin"})

            user_id = request.env.user.id
            print("user_id:", user_id)

            # Truy vấn fund để lấy current_nav
            fund = request.env['portfolio.fund'].sudo().browse(int(fund_id))
            if not fund.exists():
                return self._json_response({"success": False, "message": "Fund không tồn tại"})

            current_nav = fund.current_nav
            units_float = float(units)
            # Làm tròn current_nav cho bội số 50
            current_nav_rounded = mround(current_nav, 50)
            calculated_amount = units_float * current_nav_rounded       # Tổng giá trị của CCQ

            fee = self.calculate_fee(calculated_amount)         # Tính fee

            total_amount = calculated_amount + fee

            print("current_nav:", current_nav)
            print("calculated_amount:", calculated_amount)
            print("total_amount:", total_amount)

            # Tạo investment
            investment = self.upsert_investment(user_id, int(fund_id), float(units), 'purchase')

            # Lấy file_path từ session
            print("📄 File path từ session:", last_signed_pdf_path)

            # Ghi lại transaction
            request.env['portfolio.transaction'].sudo().create({
                'user_id': user_id,
                'fund_id': fund.id,
                'transaction_type': 'purchase',
                'units': units_float,
                'amount': total_amount,
                'created_at': fields.Datetime.now(),
                'contract_pdf_path': last_signed_pdf_path
            })

            print("Tạo thành công investment ID:", investment.id)
            return self._json_response({
                "success": True,
                "message": "Đã tạo investment thành công",
                "id": investment.id
            })

        except Exception as e:
            print("LỖI:", str(e))
            import traceback
            traceback.print_exc()
            return self._json_response({"success": False, "message": str(e)})

    def _json_response(self, data):
        """Helper để trả về JSON response"""
        return request.make_response(
            json.dumps(data),
            [('Content-Type', 'application/json')]
        )

    @http.route('/data_investment', type='http', auth='user', cors='*')
    def get_user_investments(self):
        try:
            user_id = request.env.user.id
            print("🔍 Lấy investment cho user:", user_id)

            # Lấy tất cả investment của user hiện tại
            investments = request.env['portfolio.investment'].sudo().search([
                ('user_id', '=', user_id)
            ])

            result = []
            for inv in investments:
                result.append({
                    "id": inv.id,
                    "fund_id": inv.fund_id.id,
                    "fund_name": inv.fund_id.name,
                    "fund_ticker": inv.fund_id.ticker,
                    "units": inv.units,
                    "amount": inv.amount,
                    "current_nav": inv.fund_id.current_nav,
                    "investment_type": inv.fund_id.investment_type,
                })

            return Response(
                json.dumps(result),
                content_type='application/json'
            )

        except Exception as e:
            print("❌ Lỗi khi lấy dữ liệu investment:", str(e))
            return Response(
                json.dumps({"success": False, "error": str(e)}),
                content_type='application/json'
            )

    @http.route('/submit_fund_sell', type='http', auth='user', methods=['POST'], csrf=False)
    def submit_fund_sell(self, **kwargs):
        print("=== 📩 NHẬN DỮ LIỆU BÁN FUND ===")
        print("Kwargs:", kwargs)
        print("Request method:", request.httprequest.method)
        print("Content type:", request.httprequest.content_type)

        try:
            investment_id = int(kwargs.get('investment_id'))
            quantity = float(kwargs.get('quantity'))
            estimated_value_from_js = float(kwargs.get('estimated_value'))  # vẫn log ra để debug

            print("✔️ investment_id:", investment_id)
            print("✔️ quantity:", quantity)
            print("✔️ estimated_value (from JS - ignored):", estimated_value_from_js)

            investment = request.env['portfolio.investment'].sudo().browse(investment_id)

            if not investment.exists():
                return http.Response(
                    '{"success": false, "message": "Không tìm thấy investment."}',
                    content_type='application/json',
                    status=404
                )

            user_id = request.env.user.id
            fund = investment.fund_id

            # Tính lại estimated_value theo current NAV
            current_nav = fund.current_nav
            # Làm tròn current_nav cho bội số 50
            current_nav_rounded = mround(current_nav, 50)
            estimated_value = quantity * current_nav_rounded

            print("🔄 current_nav:", current_nav)
            print("📌 Tính lại estimated_value:", estimated_value)

            # Tính toán units/amount mới
            investment = self.upsert_investment(user_id=user_id, fund_id=fund.id, units_change=quantity, transaction_type='sell')

            # Tạo transaction bán
            request.env['portfolio.transaction'].sudo().create({
                'user_id': user_id,
                'fund_id': fund.id,
                'transaction_type': 'sell',
                'units': quantity,
                'amount': estimated_value_from_js,
                'created_at': fields.Datetime.now()
            })

            return http.Response(
                '{"success": true, "message": "Cập nhật investment thành công."}',
                content_type='application/json',
                status=200
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return http.Response(
                '{"success": false, "message": "' + str(e) + '"}',
                content_type='application/json',
                status=500
            )

    def upsert_investment(self,user_id, fund_id, units_change, transaction_type):
        Investment = request.env['portfolio.investment'].sudo()
        Fund = request.env['portfolio.fund'].sudo().browse(fund_id)
        current_nav = Fund.current_nav

        investment = Investment.search([
            ('user_id', '=', user_id),
            ('fund_id', '=', fund_id)
        ], limit=1)

        if not investment:
            if transaction_type == 'purchase':
                # Mua lần đầu → tạo mới
                return Investment.create({
                    'user_id': user_id,
                    'fund_id': fund_id,
                    'units': units_change,
                    'amount': units_change * current_nav_rounded
                })

        # Nếu đã có, cập nhật
        old_units = investment.units
        new_units = old_units + units_change if transaction_type == 'purchase' else old_units - units_change
        new_units = max(new_units, 0)
        new_amount = new_units * current_nav_rounded

        investment.write({
            'units': new_units,
            'amount': new_amount
        })

        return investment

    def calculate_fee(self, amount):
        fee = 0
        if amount < 10000000:
            fee = amount * 0.003
        elif amount < 20000000:
            fee = amount * 0.002
        else:
            fee = amount * 0.001

        return fee