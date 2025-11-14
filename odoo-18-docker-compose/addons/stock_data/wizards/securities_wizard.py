from odoo import fields, _
from odoo.exceptions import UserError
from datetime import timedelta
import logging
from ssi_fc_data import model
from ..utils.utils import normalize_market


_logger = logging.getLogger(__name__)


def fetch_securities_all(wizard, client, sdk_config):
    """Fetch all securities data including list and details"""
    fetch_securities(wizard, client, sdk_config)
    fetch_securities_details_all(wizard, client, sdk_config)


def fetch_securities(wizard, client, sdk_config):
    total_count = 0
    total_created = 0
    total_updated = 0

    securities_model = wizard.env['ssi.securities']
    fetched_any = False

    markets_to_fetch = ['HOSE', 'HNX', 'UPCOM'] if wizard.market == 'ALL' else [wizard.market]

    for market in markets_to_fetch:
        current_page = 1
        market_total = 0
        _logger.info("Fetching securities for market: %s", market)

        while True:
            req = model.securities(
                pageIndex=current_page,
                pageSize=1000,
                market=market
            )

            response = client.securities(sdk_config, req)
            _logger.info("Securities response page %d for %s: status=%s",
                       current_page, market, response.get('status'))

            if response.get('status') == 'Success' and response.get('data'):
                items = response['data'].get('items', []) if isinstance(response['data'], dict) else response['data']

                if not items:
                    _logger.info("No more items for market %s at page %d - stopping", market, current_page)
                    break

                _logger.info("Processing %d items from page %d for market %s", len(items), current_page, market)

                for item in items:
                    def _val(payload, *keys, default=None):
                        for k in keys:
                            if k in payload:
                                return payload.get(k)
                        return default
                    symbol = _val(item, 'symbol', 'Symbol', default='')
                    if not symbol:
                        continue

                    normalized = normalize_market(_val(item, 'market', 'Market', default=''))

                    # Search by both symbol and market for uniqueness
                    existing = securities_model.search([('symbol', '=', symbol), ('market', '=', normalized)], limit=1)
                    values = {
                        'symbol': symbol,
                        'market': normalized,
                        'stock_name_vn': _val(item, 'StockName', 'stockName', default=''),
                        'stock_name_en': _val(item, 'StockEnName', 'stockEnName', default=''),
                        'floor_code': _val(item, 'floorCode', 'FloorCode', 'floorCode', default=''),
                        'security_type': _val(item, 'securityType', 'SecurityType', 'securityType', default=''),
                        'is_active': _val(item, 'isActive', 'IsActive', 'isActive', default=True),
                    }

                    if existing:
                        existing.write(values)
                        total_updated += 1
                    else:
                        securities_model.create(values)
                        total_created += 1
                    total_count += 1
                    market_total += 1

                fetched_any = True
                current_page += 1

                try:
                    wizard.env.cr.commit()
                except Exception:
                    pass
            else:
                _logger.warning("Failed to fetch securities for market %s at page %d: %s",
                                 market, current_page, response.get('message', 'Unknown error'))
                break

        _logger.info("Completed fetching %d securities for market %s", market_total, market)

    if not fetched_any:
        raise UserError(_("Failed to fetch securities: %s") % response.get('message', 'Unknown error'))

    market_text = "all markets" if wizard.market == 'ALL' else f"market {wizard.market}"
    wizard.result_message = f"<p>Fetched {total_count} securities from {market_text} (Created: {total_created}, Updated: {total_updated})</p>"
    wizard.last_count = total_count


def fetch_securities_details_all(wizard, client, sdk_config):
    securities_model = wizard.env['ssi.securities']
    securities = securities_model.search([('is_active', '=', True)], limit=100)

    total_updated = 0
    error_count = 0

    for security in securities:
        try:
            to_date = fields.Date.today()
            from_date = to_date - timedelta(days=7)

            req = model.daily_stock_price(
                symbol=security.symbol,
                fromDate=from_date.strftime('%d/%m/%Y'),
                toDate=to_date.strftime('%d/%m/%Y'),
                pageIndex=1,
                pageSize=1,
                market=security.market
            )

            response = client.daily_stock_price(sdk_config, req)
            if response.get('status') == 'Success' and response.get('data'):
                items = response['data'] if isinstance(response['data'], list) else []
                if items:
                    latest_price = items[0]
                    def _val(payload, *keys, default=None):
                        for k in keys:
                            if k in payload:
                                return payload.get(k)
                        return default
                    ref_price = _val(latest_price, 'ReferencePrice', 'TC', default=security.reference_price)
                    ceil_price = _val(latest_price, 'CeilingPrice', 'Trần', default=security.ceiling_price)
                    floor_price = _val(latest_price, 'FloorPrice', 'Sàn', default=security.floor_price)
                    # Only update board prices (reference/ceiling/floor) from daily_stock_price API
                    # Let Daily OHLC propagate handle current_price, high_price, low_price, etc.
                    security.write({
                        'reference_price': ref_price,
                        'ceiling_price': ceil_price,
                        'floor_price': floor_price,
                        'last_update': fields.Datetime.now()
                    })
                    total_updated += 1
        except Exception as e:
            _logger.warning("Skip securities details for %s due to %s", security.symbol, str(e))
            error_count += 1

    wizard.result_message += f"<p>Updated details for {total_updated} securities (Errors: {error_count})</p>"
    wizard.last_count = total_updated


