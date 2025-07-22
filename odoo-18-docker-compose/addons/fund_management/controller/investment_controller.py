from odoo import http
from odoo.http import request, Response

import json
from odoo import fields


class InvestmentController(http.Controller):

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
            amount = kwargs.get('amount')  # Vẫn in ra để debug, nhưng không dùng

            print("fund_id:", fund_id)
            print("units:", units)
            print("amount (from js - ignored):", amount)

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
            calculated_amount = units_float * current_nav

            print("current_nav:", current_nav)
            print("calculated_amount:", calculated_amount)

            # Tạo investment
            investment = self.upsert_investment(user_id, int(fund_id), float(units), 'purchase')

            # Ghi lại transaction
            request.env['portfolio.transaction'].sudo().create({
                'user_id': user_id,
                'fund_id': fund.id,
                'transaction_type': 'purchase',
                'units': units_float,
                'amount': amount,
                'created_at': fields.Datetime.now()
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
            estimated_value = quantity * current_nav

            print("🔄 current_nav:", current_nav)
            print("📌 Tính lại estimated_value:", estimated_value)

            # Tính toán units/amount mới
            investment = self.upsert_investment(user_id=user_id, fund_id=fund.id, units_change=quantity, transaction_type='sell')

            # Ghi log transaction bán
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
                    'amount': units_change * current_nav
                })

        # Nếu đã có, cập nhật
        old_units = investment.units
        new_units = old_units + units_change if transaction_type == 'purchase' else old_units - units_change
        new_units = max(new_units, 0)
        new_amount = new_units * current_nav

        investment.write({
            'units': new_units,
            'amount': new_amount
        })

        return investment
