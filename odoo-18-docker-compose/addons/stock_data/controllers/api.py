from odoo import http
from odoo.http import request


class StockDataApiController(http.Controller):
    @http.route('/stock_data/api/securities', type='json', auth='none', methods=['POST'], csrf=False)
    def list_securities(self, **kwargs):
        # Simple shared-secret header for internal consumption
        icp = request.env['ir.config_parameter'].sudo()
        api_secret = icp.get_param('stock_data.api.secret', default='')
        provided = request.httprequest.headers.get('X-Api-Key', '')
        if not api_secret or provided != api_secret:
            return {'status': 'Error', 'message': 'Unauthorized'}

        market = (kwargs.get('market') or '').strip().upper()
        page_index = int(kwargs.get('pageIndex') or 1)
        page_size = int(kwargs.get('pageSize') or 200)

        domain = []
        if market:
            domain.append(('market', '=', market))

        offset = max((page_index - 1), 0) * page_size
        recs = request.env['ssi.securities'].sudo().search(domain, offset=offset, limit=page_size, order='symbol asc')

        def _vals(rec):
            return {
                'symbol': rec.symbol,
                'market': rec.market,
                'StockName': getattr(rec, 'stock_name_vn', '') or '',
                'StockEnName': getattr(rec, 'stock_name_en', '') or '',
                'floorCode': rec.floor_code or '',
                'securityType': rec.security_type or '',
                'ReferencePrice': rec.reference_price or 0.0,
                'CeilingPrice': rec.ceiling_price or 0.0,
                'FloorPrice': rec.floor_price or 0.0,
                'Price': rec.current_price or 0.0,
                'HighPrice': rec.high_price or 0.0,
                'LowPrice': rec.low_price or 0.0,
                'Volume': rec.volume or 0.0,
                'TotalValue': rec.total_value or 0.0,
                'Change': rec.change or 0.0,
                'ChangePercent': rec.change_percent or 0.0,
                'LastPrice': rec.last_price or 0.0,
                'last_update': rec.last_update.isoformat() if rec.last_update else None,
            }

        return {
            'status': 'Success',
            'data': {
                'items': [_vals(r) for r in recs],
                'pageIndex': page_index,
                'pageSize': page_size,
                'count': len(recs),
            }
        }


