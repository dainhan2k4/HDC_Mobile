from odoo import http, fields, _
from odoo.http import request
import json


class ExchangeIntegrationController(http.Controller):
    """Controller gửi cặp lệnh đã khớp (transaction.matched.orders) lên sàn thông qua stock_trading.trading.order.

    Quy ước hiện tại:
    - Dùng phía MUA của cặp để tạo lệnh đặt (buy order), vì đã khớp mức giá/số lượng.
    - Map fund.ticker -> ssi.securities.symbol để tìm instrument.
    - order_type = 'stock', order_type_detail = 'MTL', market='VN', price=0 (theo API yêu cầu).
    - quantity = matched_quantity (làm tròn xuống số nguyên an toàn).
    - account sẽ lấy tự động từ trading.config của user (onchange trong trading.order), nếu có.
    """

    def _find_instrument_by_fund(self, fund):
        """Tìm instrument (ssi.securities) theo ticker của quỹ nếu có.
        Trả về record hoặc None.
        """
        try:
            if not fund:
                return None
            ticker = getattr(fund, 'ticker', None)
            if not ticker:
                return None
            Sec = request.env['ssi.securities'].sudo()
            return Sec.search([('symbol', '=', str(ticker).strip().upper())], limit=1)
        except Exception:
            return None

    def _create_trading_order_from_matched_pair(self, matched):
        """Tạo trading.order từ một bản ghi transaction.matched.orders.

        Args:
            matched: record của transaction.matched.orders
        Returns:
            trading.order record
        """
        Tx = request.env['portfolio.transaction'].sudo()
        TradingOrder = request.env['trading.order'].sudo()

        # Lấy buy order làm nguồn
        buy_tx = matched.buy_order_id
        if not buy_tx or not buy_tx.exists():
            raise http.JsonRPCException(message=_('Không tìm thấy lệnh mua trong cặp đã khớp'))

        # Xác định instrument theo fund
        fund = buy_tx.fund_id
        instrument = self._find_instrument_by_fund(fund)
        if not instrument:
            raise http.JsonRPCException(message=_('Không tìm thấy mã chứng khoán tương ứng với quỹ: %s') % (fund.name if fund else 'N/A'))

        # Suy ra user của lệnh mua
        user = buy_tx.user_id
        if not user:
            raise http.JsonRPCException(message=_('Lệnh mua không có thông tin người dùng'))

        # Số lượng
        try:
            qty = int(float(matched.matched_quantity or 0))
        except Exception:
            qty = 0
        if qty <= 0:
            raise http.JsonRPCException(message=_('Số lượng khớp không hợp lệ'))

        # Lấy account từ trading.config của user
        account_value = None
        try:
            Config = request.env['trading.config'].sudo()
            cfg = Config.search([('user_id', '=', user.id), ('active', '=', True)], limit=1)
            if cfg and cfg.account:
                account_value = str(cfg.account).strip().upper()
        except Exception:
            account_value = None

        if not account_value:
            raise http.JsonRPCException(message=_('Không tìm thấy tài khoản giao dịch trong API Configuration của người dùng. Vui lòng cấu hình `trading.config` (account) cho user này.'))

        # Tạo trading.order với account lấy từ config
        vals = {
            'user_id': user.id,
            'account': account_value,
            'order_type': 'stock',
            'market': 'VN',
            'buy_sell': 'B',
            'order_type_detail': 'MTL',
            'instrument_id': instrument.id,
            'quantity': qty,
            # account: để onchange theo user/config tự set; nếu không có, có thể fallback sau
        }

        order = TradingOrder.create(vals)

        return order

    def _coerce_id_list(self, raw):
        """Chuyển đổi nhiều kiểu input thành list[int].
        Hỗ trợ: list, tuple, set, số đơn, chuỗi CSV, hoặc dict có keys ids/matched_order_ids.
        """
        try:
            if raw is None:
                return []
            # Trường hợp dict bọc
            if isinstance(raw, dict):
                inner = raw.get('matched_order_ids') or raw.get('ids') or raw.get('data') or raw
                return self._coerce_id_list(inner)
            # Trường hợp đã là list-like
            if isinstance(raw, (list, tuple, set)):
                out = []
                for v in raw:
                    try:
                        out.append(int(v))
                    except Exception:
                        continue
                return out
            # Trường hợp số đơn
            if isinstance(raw, (int,)):
                return [int(raw)]
            # Trường hợp chuỗi: thử JSON trước, sau đó CSV
            if isinstance(raw, str):
                s = raw.strip()
                if not s:
                    return []
                # Thử parse JSON list
                try:
                    data = json.loads(s)
                    return self._coerce_id_list(data)
                except Exception:
                    pass
                # CSV: "1,2,3"
                parts = [p.strip() for p in s.split(',') if p.strip()]
                out = []
                for p in parts:
                    try:
                        out.append(int(p))
                    except Exception:
                        continue
                return out
        except Exception:
            return []
        return []

    @http.route('/api/transaction-list/send-to-exchange', type='json', auth='user')
    def send_pair_to_exchange(self, matched_order_id=None, auto_submit=True, **kwargs):
        """Gửi một cặp lệnh đã khớp lên sàn dưới dạng trading.order (dùng phía MUA).

        Params:
            matched_order_id: ID của transaction.matched.orders
            auto_submit: bool, mặc định True sẽ gọi action_submit_order ngay
        """
        try:
            if not matched_order_id:
                return {'success': False, 'message': _('Thiếu matched_order_id')}

            Matched = request.env['transaction.matched.orders'].sudo()
            matched = Matched.browse(int(matched_order_id))
            if not matched or not matched.exists():
                return {'success': False, 'message': _('Không tìm thấy cặp lệnh đã khớp')}

            order = self._create_trading_order_from_matched_pair(matched)

            # Tự động submit nếu yêu cầu
            submit_success = False
            if auto_submit:
                try:
                    order.action_submit_order()
                    submit_success = True
                except Exception as submit_err:
                    # Không chặn tạo order; trả về thông tin để người dùng tự xử lý OTP nếu cần
                    return {
                        'success': False,
                        'order_id': order.id,
                        'message': _('Đã tạo trading order nhưng submit thất bại: %s') % str(submit_err)
                    }

            # Cập nhật trạng thái đã gửi lên sàn vào matched order
            if submit_success or not auto_submit:
                matched.write({
                    'sent_to_exchange': True,
                    'sent_to_exchange_at': fields.Datetime.now()
                })

            return {
                'success': True,
                'order_id': order.id,
                'message': _('Đã tạo%s trading order thành công') % (' và submit' if auto_submit else ''),
            }
        except http.JsonRPCException as je:
            return {'success': False, 'message': str(je)}
        except Exception as e:
            return {'success': False, 'message': _('Lỗi: %s') % str(e)}

    @http.route('/api/transaction-list/send-many-to-exchange', type='json', auth='user')
    def send_many_pairs_to_exchange(self, matched_order_ids=None, auto_submit=True, **kwargs):
        """Gửi nhiều cặp lệnh đã khớp lên sàn.

        Params:
            matched_order_ids: list[int] các ID của transaction.matched.orders
            auto_submit: bool
        """
        try:
            # Chuẩn hóa danh sách IDs
            ids = self._coerce_id_list(matched_order_ids)
            if not ids:
                return {'success': False, 'message': _('Danh sách matched_order_ids không hợp lệ hoặc rỗng')}

            Matched = request.env['transaction.matched.orders'].sudo()
            recs = Matched.browse(ids).exists()
            results = []
            created = 0
            submitted = 0

            for rec in recs:
                try:
                    order = self._create_trading_order_from_matched_pair(rec)
                    created += 1
                    submit_ok = False
                    if auto_submit:
                        try:
                            order.action_submit_order()
                            submit_ok = True
                            submitted += 1
                        except Exception as submit_err:
                            results.append({'matched_id': rec.id, 'order_id': order.id, 'success': False, 'message': str(submit_err)})
                    
                    # Cập nhật trạng thái đã gửi lên sàn nếu thành công
                    if submit_ok or not auto_submit:
                        rec.write({
                            'sent_to_exchange': True,
                            'sent_to_exchange_at': fields.Datetime.now()
                        })
                    
                    results.append({'matched_id': rec.id, 'order_id': order.id, 'success': True if (not auto_submit or submit_ok) else False})
                except Exception as per_err:
                    results.append({'matched_id': rec.id, 'success': False, 'message': str(per_err)})

            return {
                'success': True,
                'created': created,
                'submitted': submitted if auto_submit else 0,
                'results': results,
                'message': _('Đã xử lý %s cặp, tạo %s order, submit %s order') % (len(ids), created, submitted if auto_submit else 0)
            }
        except Exception as e:
            return {'success': False, 'message': _('Lỗi: %s') % str(e)}

    # Alias để tương thích frontend: bulk-send-to-exchange
    @http.route('/api/transaction-list/bulk-send-to-exchange', type='json', auth='user')
    def bulk_send_pairs_alias(self, **kwargs):
        """Alias cho send_many_pairs_to_exchange để tương thích URL frontend hiện tại."""
        try:
            # Ưu tiên kwargs (JSON-RPC params)
            raw_ids = (
                kwargs.get('matched_order_ids') or
                kwargs.get('matchedOrderIds') or
                kwargs.get('ids') or
                kwargs.get('selected_ids')
            )
            auto_submit = kwargs.get('auto_submit', kwargs.get('autoSubmit', True))

            # Nếu không có trong kwargs, thử lấy từ request.jsonrequest (plain JSON)
            if not raw_ids:
                try:
                    payload = request.jsonrequest or {}
                    raw_ids = (
                        payload.get('matched_order_ids') or
                        payload.get('matchedOrderIds') or
                        payload.get('ids') or
                        payload.get('selected_ids') or
                        None
                    )
                    if 'auto_submit' in payload or 'autoSubmit' in payload:
                        auto_submit = payload.get('auto_submit', payload.get('autoSubmit', auto_submit))
                except Exception:
                    raw_ids = None

            # Nếu vẫn không có, thử đọc raw body
            if not raw_ids:
                try:
                    body = (request.httprequest.data or b'').decode('utf-8')
                    raw = json.loads(body) if body else {}
                    raw_ids = (
                        (raw.get('matched_order_ids') if isinstance(raw, dict) else None) or
                        (raw.get('matchedOrderIds') if isinstance(raw, dict) else None) or
                        (raw.get('ids') if isinstance(raw, dict) else None) or
                        (raw.get('selected_ids') if isinstance(raw, dict) else None) or
                        raw
                    )
                    if isinstance(raw, dict) and ('auto_submit' in raw or 'autoSubmit' in raw):
                        auto_submit = raw.get('auto_submit', raw.get('autoSubmit', auto_submit))
                except Exception:
                    raw_ids = None

            # Cuối cùng: nếu vẫn rỗng, thử coerce cả kwargs làm list ids
            ids = self._coerce_id_list(raw_ids if raw_ids is not None else kwargs)
            return self.send_many_pairs_to_exchange(matched_order_ids=ids, auto_submit=auto_submit)
        except Exception as e:
            return {'success': False, 'message': _('Lỗi: %s') % str(e)}


