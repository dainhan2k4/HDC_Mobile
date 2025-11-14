from odoo import http, fields
from odoo.http import request, Response
from psycopg2 import IntegrityError
import json
import logging

from ..utils import mround, fee_utils, investment_utils, constants

_logger = logging.getLogger(__name__)


class InvestmentController(http.Controller):

    @http.route('/save_signed_pdf_path', type='http', auth='public', csrf=False, methods=['POST'])
    def save_signed_pdf_path(self, **kwargs):
        """Save signed PDF path to session"""
        file_path = kwargs.get("file_path")
        if file_path:
            request.session["signed_pdf_path"] = file_path
        return Response(
            json.dumps({"success": True}),
            content_type="application/json"
        )

    @http.route('/create_investment', type='http', auth='user', methods=['POST'], csrf=False)
    def create_investment(self, **kwargs):
        """Create investment transaction"""
        try:
            # Get form data
            fund_id = kwargs.get('fund_id')
            units = kwargs.get('units')
            amount = kwargs.get('amount')
            term_months = kwargs.get('term_months')
            interest_rate = kwargs.get('interest_rate')

            if not fund_id or not units or not amount:
                return self._json_response({"success": False, "message": "Missing required information"})

            user_id = request.env.user.id
            fund = request.env['portfolio.fund'].sudo().browse(int(fund_id))
            if not fund.exists():
                return self._json_response({"success": False, "message": "Fund not found"})

            # Calculate values
            units_float = float(units)
            calculated_amount = float(amount)
            effective_unit_price = calculated_amount / units_float if units_float > 0 else 0
            fee = fee_utils.calculate_fee(calculated_amount)
            total_amount = calculated_amount + fee

            # Get PDF path from session
            pdf_path = request.session.get("signed_pdf_path")

            # Create transaction
            tx_vals = {
                'user_id': user_id,
                'fund_id': fund.id,
                'transaction_type': constants.TRANSACTION_TYPE_PURCHASE,
                'status': constants.STATUS_PENDING,
                'units': units_float,
                'amount': calculated_amount,
                'fee': fee,
                'price': effective_unit_price,
                'contract_pdf_path': pdf_path,
            }
            
            # Add optional fields
            if term_months:
                try:
                    tx_vals['term_months'] = int(term_months)
                except Exception:
                    pass
            if interest_rate:
                try:
                    tx_vals['interest_rate'] = float(interest_rate)
                except Exception:
                    pass

            tx = request.env['portfolio.transaction'].sudo().create(tx_vals)

            return self._json_response({
                "success": True,
                "message": "Investment order created successfully",
                "tx_id": tx.id
            })

        except Exception as e:
            return self._json_response({"success": False, "message": str(e)})

    def _json_response(self, data):
        """Helper để trả về JSON response"""
        return request.make_response(
            json.dumps(data),
            [('Content-Type', 'application/json')]
        )

    @http.route('/data_investment', type='http', auth='user', cors='*')
    def get_user_investments(self):
        """Get user investments"""
        try:
            user_id = request.env.user.id
            investments = request.env['portfolio.investment'].sudo().search([
                ('user_id', '=', user_id)
            ])

            result = [
                {
                    "id": inv.id,
                    "fund_id": inv.fund_id.id,
                    "fund_name": inv.fund_id.name,
                    "fund_ticker": inv.fund_id.ticker,
                    "units": inv.units,
                    "amount": inv.amount,
                    "current_nav": inv.fund_id.current_nav,
                    "investment_type": inv.fund_id.investment_type,
                }
                for inv in investments
            ]

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
            debug_mode = kwargs.get('debug', 'false').lower() in ('true', '1', 'yes')  # Debug mode flag

            print("✔️ investment_id:", investment_id)
            print("✔️ quantity:", quantity)
            print("✔️ estimated_value (from JS - ignored):", estimated_value_from_js)
            print("✔️ debug_mode:", debug_mode)

            investment = request.env['portfolio.investment'].sudo().browse(investment_id)

            if not investment.exists():
                return http.Response(
                    '{"success": false, "message": "Không tìm thấy investment."}',
                    content_type='application/json',
                    status=404
                )

            user_id = request.env.user.id
            fund = investment.fund_id
            
            # DEBUG MODE: Bypass check số lượng sở hữu
            if debug_mode:
                import logging
                _logger = logging.getLogger(__name__)
                _logger.warning(f'[Fund Sell DEBUG MODE] User {user_id} - Bypassing quantity check. Requested: {quantity}, Available: {investment.units}')
                print(f"🔧 DEBUG MODE ENABLED - Bypassing quantity check. Requested: {quantity}, Available: {investment.units}")
            else:
                # Kiểm tra số lượng sở hữu (chỉ khi không phải debug mode)
                if quantity > investment.units:
                    return http.Response(
                        '{"success": false, "message": "Số lượng bán vượt quá số lượng sở hữu."}',
                        content_type='application/json',
                        status=400
                    )

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
            investment = investment_utils.InvestmentHelper.upsert_investment(
                request.env,
                user_id=user_id,
                fund_id=fund.id,
                units_change=quantity,
                transaction_type=constants.TRANSACTION_TYPE_SELL
            )

            # Tạo transaction bán
            request.env['portfolio.transaction'].sudo().create({
                'user_id': user_id,
                'fund_id': fund.id,
                'transaction_type': constants.TRANSACTION_TYPE_SELL,
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
        return investment_utils.InvestmentHelper.upsert_investment(
            request.env,
            user_id=user_id,
            fund_id=fund_id,
            units_change=units_change,
            amount_change=amount_change,
            transaction_type=transaction_type
        )

    def upsert_investment(self, user_id, fund_id, units_change, transaction_type):
        """Tạo hoặc cập nhật investment"""
        return investment_utils.InvestmentHelper.upsert_investment(
            request.env,
            user_id=user_id,
            fund_id=fund_id,
            units_change=units_change,
            transaction_type=transaction_type
        )


    @http.route('/match_transactions', type='http', auth='user', methods=['POST'], csrf=False)
    def match_transactions(self, **kwargs):
        print("=== MATCH TRANSACTIONS ===")

        try:
            Transaction = request.env['portfolio.transaction'].sudo()

            # Lấy các lệnh pending
            pending_purchases = Transaction.search([
                ('transaction_type', '=', constants.TRANSACTION_TYPE_PURCHASE),
                ('status', '=', constants.STATUS_PENDING)
            ])
            pending_sells = Transaction.search([
                ('transaction_type', '=', constants.TRANSACTION_TYPE_SELL),
                ('status', '=', constants.STATUS_PENDING)
            ])

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
        return investment_utils.InvestmentHelper._get_ccq_price_from_inventory(request.env, fund_id)

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

    @http.route('/api/check_profitability', type='json', auth='user', methods=['POST'])
    def check_profitability(self, **kwargs):
        """API endpoint để kiểm tra lãi/lỗ của transaction/investment"""
        try:
            fund_id = kwargs.get('fund_id')
            amount = float(kwargs.get('amount', 0))
            units = float(kwargs.get('units', 0))
            interest_rate = float(kwargs.get('interest_rate', 0))
            term_months = int(kwargs.get('term_months', 0))
            
            if not fund_id or amount <= 0 or units <= 0 or interest_rate <= 0 or term_months <= 0:
                return {
                    'success': False,
                    'message': 'Thiếu thông tin cần thiết'
                }
            
            # Lấy fund để lấy current_nav
            fund = request.env['portfolio.fund'].sudo().browse(int(fund_id))
            if not fund.exists():
                return {
                    'success': False,
                    'message': 'Fund không tồn tại'
                }
            
            nav_value = float(fund.current_nav or 0.0)
            if nav_value <= 0:
                return {
                    'success': False,
                    'message': 'Không có NAV hiện tại'
                }
            
            # Tính toán theo logic nav_management
            days = max(1, int(term_months * 30))
            sell_value = amount * (interest_rate / 100.0) / 365.0 * days + amount
            price1 = round(sell_value / units) if units > 0 else 0
            price2 = round(price1 / 50) * 50 if price1 > 0 else 0
            r_new = ((price2 / nav_value - 1) * 365 / days * 100) if nav_value > 0 and days > 0 and price2 > 0 else 0
            delta = r_new - interest_rate
            
            # Lấy cấu hình chặn trên/dưới
            cap_config = request.env['nav.cap.config'].sudo().search([('active', '=', True)], limit=1)
            cap_upper = float(cap_config.cap_upper or 2.0) if cap_config else 2.0
            cap_lower = float(cap_config.cap_lower or 0.1) if cap_config else 0.1
            
            is_profitable = cap_lower <= delta <= cap_upper
            
            return {
                'success': True,
                'data': {
                    'sell_value': sell_value,
                    'price1': price1,
                    'price2': price2,
                    'interest_rate_new': r_new,
                    'interest_delta': delta,
                    'days_effective': days,
                    'is_profitable': is_profitable,
                    'cap_upper': cap_upper,
                    'cap_lower': cap_lower
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': str(e)
            }

    def _json_response(self, data, status=200):
        return Response(
            json.dumps(data, ensure_ascii=False),
            status=status,
            content_type='application/json'
        )

    @http.route('/api/otp/config', type='json', auth='user', methods=['POST'], csrf=False)
    def api_otp_config(self, **kwargs):
        """Lấy thông tin cấu hình OTP của user hiện tại và kiểm tra write token còn hiệu lực không."""
        import logging
        _logger = logging.getLogger(__name__)
        
        try:
            current_user = request.env.user
            config = request.env['trading.config'].sudo().search([
                ('user_id', '=', current_user.id),
                ('active', '=', True)
            ], limit=1)
            
            if not config:
                return {
                    'success': False,
                    'otp_type': 'smart',  # Default
                    'has_valid_write_token': False,
                    'message': 'Chưa liên kết tài khoản giao dịch'
                }
            
            otp_type = config.otp_type or 'smart'
            
            # Kiểm tra write token còn hiệu lực không
            has_valid_token = False
            token_expires_in = ''
            if config.write_access_token:
                try:
                    from odoo.addons.stock_trading.models.utils import (
                        is_token_expired,
                        get_token_expires_in,
                        TokenConstants
                    )
                    has_valid_token = not is_token_expired(
                        config.write_access_token,
                        buffer_seconds=TokenConstants.EXPIRATION_BUFFER_SECONDS
                    )
                    if has_valid_token:
                        token_expires_in = get_token_expires_in(config.write_access_token)
                except Exception as e:
                    _logger.warning(f'[OTP Config] Error checking token validity: {e}')
            
            _logger.info(f'[OTP Config] User: {current_user.id}, OTP type: {otp_type}, Has valid token: {has_valid_token}')
            
            return {
                'success': True,
                'otp_type': otp_type,
                'has_valid_write_token': has_valid_token,
                'write_token_expires_in': token_expires_in
            }
        except Exception as e:
            _logger.error(f'[OTP Config] Error: {str(e)}')
            return {
                'success': False,
                'otp_type': 'smart',  # Default
                'has_valid_write_token': False,
                'message': str(e)
            }

    @http.route('/api/otp/verify', type='json', auth='user', methods=['POST'], csrf=False)
    def api_otp_verify(self, **kwargs):
        """Xác thực OTP, trả về success nếu code đúng (lưu write token như stock_trading)."""
        import logging
        import traceback
        _logger = logging.getLogger(__name__)
        
        try:
            # Với type='json', Odoo tự động parse JSON body vào kwargs
            code = (kwargs.get('otp') or kwargs.get('code') or '').strip()
            debug_mode = kwargs.get('debug', False)  # Debug mode flag
            
            if not code:
                _logger.warning('[OTP Verify] Missing OTP code')
                return {
                    'success': False, 
                    'message': 'Thiếu mã OTP. Vui lòng nhập mã OTP 6 chữ số.'
                }

            current_user = request.env.user
            _logger.info(f'[OTP Verify] User: {current_user.id} ({current_user.login}), OTP: {code[:2]}**, Debug: {debug_mode}')
            
            # DEBUG MODE: Bypass validation nếu debug mode được bật
            if debug_mode:
                _logger.warning(f'[OTP Verify] DEBUG MODE ENABLED - Bypassing OTP validation for user {current_user.id}')
                # Lấy config để lấy otp_type
                config = request.env['trading.config'].sudo().search([
                    ('user_id', '=', current_user.id),
                    ('active', '=', True)
                ], limit=1)
                otp_type = config.otp_type or 'smart' if config else 'smart'
                
                return {
                    'success': True, 
                    'message': 'OTP đã được xác thực thành công (DEBUG MODE).',
                    'write_token': 'DEBUG_TOKEN_' + str(current_user.id),  # Fake token cho debug
                    'otp_type': otp_type,
                    'debug': True
                }
            
            config = request.env['trading.config'].sudo().search([
                ('user_id', '=', current_user.id),
                ('active', '=', True)
            ], limit=1)
            
            if not config:
                _logger.warning(f'[OTP Verify] No active trading config found for user {current_user.id}')
                return {
                    'success': False, 
                    'message': 'Chưa liên kết tài khoản giao dịch. Vui lòng cấu hình tài khoản giao dịch trước.'
                }

            # Lấy thông tin loại OTP từ config
            otp_type = config.otp_type or 'smart'  # Default là smart OTP
            
            from odoo.addons.stock_trading.models.trading_api_client import TradingAPIClient
            from odoo.exceptions import UserError
            
            try:
                client = TradingAPIClient(config)
                token = client.verify_code(code)
                
                # Write token đã được lưu tự động trong verify_code()
                # Token này có thể dùng cho nhiều giao dịch trong thời gian còn hiệu lực (thường 8 giờ)
                _logger.info(f'[OTP Verify] Success for user {current_user.id}, write token đã được lưu')
                return {
                    'success': True, 
                    'message': 'OTP đã được xác thực thành công.',
                    'write_token': token,
                    'otp_type': otp_type
                }
            except UserError as ue:
                error_msg = str(ue)
                _logger.error(f'[OTP Verify] UserError: {error_msg}')
                
                # Xử lý các lỗi đặc biệt
                if 'Out of synchronization' in error_msg or 'synchronization' in error_msg.lower():
                    return {
                        'success': False,
                        'message': 'Mã OTP đã hết hạn hoặc không còn hợp lệ. Vui lòng kiểm tra mã Smart OTP mới trên ứng dụng SSI Iboard Pro và thử lại.'
                    }
                elif 'Wrong OTP' in error_msg or 'wrong' in error_msg.lower():
                    return {
                        'success': False,
                        'message': 'Mã OTP không chính xác. Vui lòng kiểm tra lại mã Smart OTP trên ứng dụng SSI Iboard Pro.'
                    }
                else:
                    return {
                        'success': False, 
                        'message': error_msg
                    }
            except Exception as api_error:
                error_msg = str(api_error)
                _logger.error(f'[OTP Verify] API Error: {error_msg}')
                _logger.error(traceback.format_exc())
                
                # Xử lý các lỗi đặc biệt
                if 'Out of synchronization' in error_msg or 'synchronization' in error_msg.lower():
                    return {
                        'success': False,
                        'message': 'Mã OTP đã hết hạn hoặc không còn hợp lệ. Vui lòng kiểm tra mã Smart OTP mới trên ứng dụng SSI Iboard Pro và thử lại.'
                    }
                elif 'Wrong OTP' in error_msg or 'wrong' in error_msg.lower():
                    return {
                        'success': False,
                        'message': 'Mã OTP không chính xác. Vui lòng kiểm tra lại mã Smart OTP trên ứng dụng SSI Iboard Pro.'
                    }
                else:
                    return {
                        'success': False, 
                        'message': f'Mã OTP không hợp lệ hoặc đã hết hạn: {error_msg}'
                    }
                
        except Exception as e:
            _logger.error(f'[OTP Verify] Unexpected error: {str(e)}')
            _logger.error(traceback.format_exc())
            return {
                'success': False, 
                'message': f'Lỗi hệ thống: {str(e)}'
            }
