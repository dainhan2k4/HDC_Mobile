from ..utils import mround
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
            amount = kwargs.get('amount')  # Lấy giá trị lệnh thực tế từ form
            term_months = kwargs.get('term_months')
            interest_rate = kwargs.get('interest_rate')

            print("fund_id:", fund_id)
            print("units:", units)
            print("amount:", amount)

            if not fund_id or not units or not amount:
                return self._json_response({"success": False, "message": "Thiếu thông tin"})

            user_id = request.env.user.id
            print("user_id:", user_id)

            # Truy vấn fund để lấy current_nav
            fund = request.env['portfolio.fund'].sudo().browse(int(fund_id))
            if not fund.exists():
                return self._json_response({"success": False, "message": "Fund không tồn tại"})

            # Sử dụng giá trị lệnh thực tế từ form (đã được MROUND 50)
            units_float = float(units)
            calculated_amount = float(amount)  # Sử dụng giá trị lệnh từ form

            # Tính đơn giá thực tế từ amount và units
            effective_unit_price = calculated_amount / units_float if units_float > 0 else 0

            fee = self.calculate_fee(calculated_amount)         # Tính fee

            # MROUND 50 cho tất cả giá trị
            calculated_amount = mround(calculated_amount, 50)
            effective_unit_price = mround(effective_unit_price, 50)
            fee = mround(fee, 50)

            # Tổng thanh toán = giá trị lệnh + phí
            total_amount = mround(calculated_amount + fee, 50)

            print("calculated_amount:", calculated_amount)
            print("fee:", fee)
            print("total_amount:", total_amount)

            # Tạo investment với giá trị lệnh thực tế
            investment = self.upsert_investment_with_amount(user_id, int(fund_id), float(units), calculated_amount, 'purchase')

            # Lấy file_path từ session
            print("📄 File path từ session:", last_signed_pdf_path)

            # Idempotent guard: nếu đã tồn tại giao dịch tương tự rất gần thời gian (chống double-click)
            try:
                from datetime import datetime, timedelta
                cutoff = fields.Datetime.to_string(fields.Datetime.now() - timedelta(minutes=2))
                existing_tx = request.env['portfolio.transaction'].sudo().search([
                    ('user_id', '=', user_id),
                    ('fund_id', '=', fund.id),
                    ('transaction_type', '=', 'purchase'),
                    ('units', '=', units_float),
                    ('price', '=', effective_unit_price),
                    ('amount', '=', calculated_amount),  # Sử dụng giá trị lệnh thực tế (không bao gồm phí)
                    ('fee', '=', fee),  # Kiểm tra phí mua
                    ('create_date', '>=', cutoff),
                ], order='id desc', limit=1)
                if existing_tx:
                    print("[Idempotent] Found existing recent transaction, skip create:", existing_tx.id)
                    return self._json_response({
                        "success": True,
                        "message": "Giao dịch đã được ghi nhận (idempotent)",
                        "id": investment.id,
                        "tx_id": existing_tx.id
                    })
            except Exception as _e:
                print("[Idempotent] Guard check error:", _e)

            # Ghi lại transaction
            tx_vals = {
                'user_id': user_id,
                'fund_id': fund.id,
                'transaction_type': 'purchase',
                'units': units_float,
                'amount': calculated_amount,  # Sử dụng giá trị lệnh thực tế (không bao gồm phí)
                'fee': fee,  # Phí mua riêng biệt
                'price': effective_unit_price,  # Đơn giá đã bao gồm chi phí vốn (MROUND 50)
                'created_at': fields.Datetime.now(),
                'contract_pdf_path': last_signed_pdf_path,
            }
            # Kỳ hạn/lãi suất từ frontend (nếu có) - chỉ add khi có dữ liệu hợp lệ
            if term_months not in (None, '', False):
                try:
                    tx_vals['term_months'] = int(term_months)
                except Exception:
                    pass
            if interest_rate not in (None, '', False):
                try:
                    tx_vals['interest_rate'] = float(interest_rate)
                except Exception:
                    pass

            print('[CREATE TX] term_months:', term_months, 'interest_rate:', interest_rate)
            request.env['portfolio.transaction'].sudo().create(tx_vals)

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

            # Tính lại estimated_value theo giá CCQ từ tồn kho đầu ngày
            # Lấy giá CCQ đúng từ giá tồn kho đầu ngày
            ccq_price = self._get_ccq_price_from_inventory(fund.id)
            if ccq_price <= 0:
                # Fallback về current_nav nếu không lấy được giá CCQ
                ccq_price = fund.current_nav
                
            # MROUND(step=50)
            ccq_price_rounded = mround(ccq_price, 50)
            estimated_value = quantity * ccq_price_rounded
            
            # Tính chi phí vốn cho giao dịch bán
            capital_cost = self._calculate_capital_cost(fund.id, estimated_value)

            print("🔄 ccq_price:", ccq_price)
            print("🔄 ccq_price_rounded:", ccq_price_rounded)
            print("📌 Tính lại estimated_value:", estimated_value)
            print("📌 Chi phí vốn:", capital_cost)

            # Tính toán units/amount mới
            investment = self.upsert_investment(user_id=user_id, fund_id=fund.id, units_change=quantity, transaction_type='sell')

            # Tạo transaction bán
            request.env['portfolio.transaction'].sudo().create({
                'user_id': user_id,
                'fund_id': fund.id,
                'transaction_type': 'sell',
                'units': quantity,
                'amount': estimated_value_from_js,
                'price': ccq_price_rounded,  # Giá CCQ đã được làm tròn (step=50)
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

    def upsert_investment_with_amount(self, user_id, fund_id, units_change, amount_change, transaction_type):
        """Tạo hoặc cập nhật investment với giá trị amount thực tế từ form"""
        Investment = request.env['portfolio.investment'].sudo()
        
        # MROUND 50 cho amount_change
        amount_change = mround(amount_change, 50)
        
        investment = Investment.search([
            ('user_id', '=', user_id),
            ('fund_id', '=', fund_id)
        ], limit=1)

        if not investment:
            if transaction_type == 'purchase':
                # Mua lần đầu → tạo mới với giá trị amount thực tế
                return Investment.create({
                    'user_id': user_id,
                    'fund_id': fund_id,
                    'units': units_change,
                    'amount': amount_change  # Sử dụng giá trị amount thực tế từ form (đã MROUND 50)
                })

        # Nếu đã có, cập nhật
        old_units = investment.units
        old_amount = investment.amount
        
        new_units = old_units + units_change if transaction_type == 'purchase' else old_units - units_change
        new_units = max(new_units, 0)
        
        # Cập nhật amount dựa trên tỷ lệ units
        if old_units > 0:
            unit_price = old_amount / old_units
            new_amount = new_units * unit_price
        else:
            new_amount = amount_change if transaction_type == 'purchase' else 0

        # MROUND 50 cho new_amount
        new_amount = mround(new_amount, 50)

        investment.write({
            'units': new_units,
            'amount': new_amount
        })

        return investment

    def upsert_investment(self,user_id, fund_id, units_change, transaction_type):
        Investment = request.env['portfolio.investment'].sudo()
        Fund = request.env['portfolio.fund'].sudo().browse(fund_id)
        # Dùng giá đầu ngày từ tồn kho thay vì current_nav
        price_from_inventory = self._get_ccq_price_from_inventory(fund_id)
        if price_from_inventory <= 0:
            price_from_inventory = Fund.current_nav or 0.0
        # MROUND(step=50)
        current_nav_rounded = mround(price_from_inventory, 50)

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

        # MROUND 50 cho phí
        return mround(fee, 50)


    @http.route('/match_transactions', type='http', auth='user', methods=['POST'], csrf=False)
    def match_transactions(self, **kwargs):
        print("=== MATCH TRANSACTIONS ===")

        try:
            Transaction = request.env['portfolio.transaction'].sudo()

            # Lấy các lệnh pending
            pending_purchases = Transaction.search([('transaction_type', '=', 'purchase'), ('status', '=', 'pending')])
            pending_sells = Transaction.search([('transaction_type', '=', 'sell'), ('status', '=', 'pending')])

            if not pending_purchases or not pending_sells:
                return self._json_response({
                    "success": False,
                    "message": "Không có lệnh mua/bán nào pending để khớp"
                })

            # Sử dụng Order Matching Engine từ module mới
            matching_engine = request.env['fund.order.matching'].create({
                'name': f"Khớp lệnh - {request.env.user.name} - {request.env.cr.now()}",
            })

            # Thực hiện khớp lệnh
            result = matching_engine.match_orders(pending_purchases, pending_sells)

            return self._json_response({
                "success": True,
                "message": f"Đã khớp {len(result['matched_pairs'])} cặp lệnh",
                "matching_id": matching_engine.id,
                "matched_pairs": result['matched_pairs'],
                "remaining": {
                    "buys": [{"id": b.id, "nav": b.current_nav, "amount": b.amount} for b in result['remaining_buys']],
                    "sells": [{"id": s.id, "nav": s.current_nav, "amount": s.amount} for s in result['remaining_sells']]
                },
                "summary": matching_engine.get_matching_summary()
            })

        except Exception as e:
            print("LỖI:", str(e))
            import traceback
            traceback.print_exc()
            return self._json_response({"success": False, "message": str(e)})

    def _get_ccq_price_from_inventory(self, fund_id):
        """Lấy giá CCQ từ giá tồn kho đầu ngày"""
        try:
            from datetime import datetime
            today = datetime.now().date()
            
            # Tìm bản ghi tồn kho cho ngày hiện tại
            Inventory = request.env['nav.daily.inventory'].sudo()
            inv = Inventory.search([
                ('fund_id', '=', fund_id), 
                ('inventory_date', '=', today)
            ], limit=1)
            
            if inv and inv.opening_avg_price:
                print(f"Lấy giá CCQ từ tồn kho: {inv.opening_avg_price}")
                return inv.opening_avg_price
            else:
                print(f"Không tìm thấy tồn kho cho fund {fund_id} ngày {today}")
                return 0.0
                
        except Exception as e:
            print(f"Lỗi lấy giá CCQ từ tồn kho: {e}")
            return 0.0

    def _calculate_capital_cost(self, fund_id, amount):
        """Tính chi phí vốn từ nav.fund.config"""
        try:
            # Lấy cấu hình quỹ
            FundConfig = request.env['nav.fund.config'].sudo()
            config = FundConfig.search([
                ('fund_id', '=', fund_id),
                ('active', '=', True)
            ], limit=1)
            
            if config and config.capital_cost_percent:
                capital_cost = amount * (config.capital_cost_percent / 100)
                print(f"Chi phí vốn: {amount} × {config.capital_cost_percent}% = {capital_cost}")
                return capital_cost
            else:
                print(f"Không tìm thấy cấu hình chi phí vốn cho fund {fund_id}")
                return 0.0
                
        except Exception as e:
            print(f"Lỗi tính chi phí vốn: {e}")
            return 0.0

    def _json_response(self, data, status=200):
        return Response(
            json.dumps(data, ensure_ascii=False),
            status=status,
            content_type='application/json'
        )