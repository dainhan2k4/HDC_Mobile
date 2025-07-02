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
            # Lấy dữ liệu từ form hoặc JSON
            fund_id = kwargs.get('fund_id')
            amount = kwargs.get('amount')
            units = kwargs.get('units')

            print("fund_id:", fund_id)
            print("amount:", amount)
            print("units:", units)

            if not fund_id or not amount or not units:
                return self._json_response({"success": False, "message": "Thieu thong tin"})

            user_id = request.env.user.id
            print("user_id:", user_id)

            # Tạo investment
            investment = request.env['portfolio.investment'].sudo().create({
                'user_id': user_id,
                'fund_id': int(fund_id),
                'amount': float(amount),
                'units': float(units)
            })

            # Hoặc dùng create() trực tiếp:
            request.env['portfolio.transaction'].sudo().create({
                'user_id': user_id,
                'fund_id': int(fund_id),
                'transaction_type': 'purchase',
                'units': float(units),
                'amount': float(amount),
                'created_at': fields.Datetime.now()
            })

            print("Tao thanh cong investment ID:", investment.id)
            return self._json_response({
                "success": True,
                "message": "Da tao investment thanh cong",
                "id": investment.id
            })

        except Exception as e:
            print("LOI:", str(e))
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
            estimated_value = float(kwargs.get('estimated_value'))

            investment = request.env['portfolio.investment'].sudo().browse(investment_id)

            user_id = request.env.user.id
            fund_id = investment.fund_id.id

            print("✔️ investment_id:", investment_id)
            print("✔️ quantity:", quantity)
            print("✔️ estimated_value:", estimated_value)

            investment = request.env['portfolio.investment'].sudo().browse(investment_id)

            if not investment.exists():
                return http.Response(
                    '{"success": false, "message": "Không tìm thấy investment."}',
                    content_type='application/json',
                    status=404
                )

            # Tính toán mới
            new_units = max(0, investment.units - quantity)
            new_amount = max(0, investment.amount - estimated_value)

            print("🔧 Đang cập nhật investment:")
            print("- Units cũ:", investment.units, "=> mới:", new_units)
            print("- Amount cũ:", investment.amount, "=> mới:", new_amount)

            # Cập nhật bản ghi
            investment.write({
                'units': new_units,
                'amount': new_amount
            })

            request.env['portfolio.transaction'].sudo().create({
                'user_id': user_id,
                'fund_id': fund_id,
                'transaction_type': 'sale',
                'units': quantity,
                'amount': estimated_value,
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

