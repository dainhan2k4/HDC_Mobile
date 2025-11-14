from odoo import fields, _
import logging
from datetime import datetime
from ssi_fc_data import model


_logger = logging.getLogger(__name__)


def fetch_all_ohlc(wizard, client, sdk_config):
    securities_model = wizard.env['ssi.securities']
    daily_ohlc_model = wizard.env['ssi.daily.ohlc']
    intraday_ohlc_model = wizard.env['ssi.intraday.ohlc']

    # Chỉ lấy OHLC cho các symbol cụ thể: HDB, ACB, FPT, AAM
    target_symbols = ['HDB', 'ACB', 'FPT', 'AAM']
    securities = securities_model.search([
        ('symbol', 'in', target_symbols),
        ('is_active', '=', True)
    ], order='symbol asc')
    
    if not securities:
        _logger.warning("Không tìm thấy các mã chứng khoán HDB, ACB, FPT, AAM trong hệ thống")
        return
    
    _logger.info("Bắt đầu fetch OHLC cho các mã: %s (%d mã)", ', '.join(target_symbols), len(securities))

    total_count = len(securities)
    daily_success = 0
    intraday_success = 0
    error_count = 0

    to_date = fields.Date.today()
    from_date = to_date

    for security in securities:
        try:
            _logger.info("Fetching OHLC for symbol: %s (ID: %s)", security.symbol, security.id)

            daily_req = model.daily_ohlc(
                symbol=security.symbol,
                fromDate=from_date.strftime('%d/%m/%Y'),
                toDate=to_date.strftime('%d/%m/%Y'),
                pageIndex=1,
                pageSize=10,
                ascending=True
            )
            daily_response = client.daily_ohlc(sdk_config, daily_req)
            if daily_response.get('status') == 'Success' and daily_response.get('data'):
                daily_items = daily_response['data'] if isinstance(daily_response['data'], list) else []
                for item in daily_items:
                        date_str = item.get('Date', '')
                        if date_str:
                            try:
                                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                            except Exception:
                                date_obj = from_date
                        else:
                            date_obj = from_date

                        existing = daily_ohlc_model.search([
                            ('security_id', '=', security.id),
                            ('date', '=', date_obj)
                        ], limit=1)

                        values = {
                            'security_id': security.id,
                            'date': date_obj,
                            'open_price': item.get('Open', 0.0),
                            'high_price': item.get('High', 0.0),
                            'low_price': item.get('Low', 0.0),
                            'close_price': item.get('Close', 0.0),
                            'volume': item.get('Volume', 0.0),
                            'value': item.get('TotalValue', 0.0),
                            'change': item.get('Change', 0.0),
                            'change_percent': item.get('ChangePercent', 0.0),
                            'previous_close': item.get('PreviousClose', 0.0),
                            'last_update': fields.Datetime.now(),
                        }

                        if existing:
                            existing.write(values)
                            daily_success += 1
                        else:
                            total_daily = daily_ohlc_model.search_count([('security_id', '=', security.id)])
                            if total_daily >= 10:
                                latest_daily = daily_ohlc_model.search([('security_id', '=', security.id)], order='date desc', limit=1)
                                if latest_daily:
                                    latest_daily.write(values)
                                else:
                                    daily_ohlc_model.create(values)
                            else:
                                daily_ohlc_model.create(values)
                            daily_success += 1

            # Fetch đầy đủ intraday bars trong ngày theo đúng nghiệp vụ
            _today = fields.Date.today()
            current_page = 1
            page_size = getattr(wizard, 'page_size', None) or 500
            total_saved = 0
            while True:
                intraday_req = model.intraday_ohlc(
                    symbol=security.symbol,
                    fromDate=_today.strftime('%d/%m/%Y'),
                    toDate=_today.strftime('%d/%m/%Y'),
                    pageIndex=current_page,
                    pageSize=page_size,
                    ascending=True,
                    resolution=1
                )
                intraday_response = client.intraday_ohlc(sdk_config, intraday_req)
                if intraday_response.get('status') != 'Success' or not intraday_response.get('data'):
                    break
                intraday_items = intraday_response['data'] if isinstance(intraday_response['data'], list) else []
                if not intraday_items:
                    break
                for item in intraday_items:
                    date_str = item.get('Date', '')
                    time_str = item.get('Time', '') or '00:00'
                    if date_str:
                        try:
                            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                        except Exception:
                            date_obj = from_date
                    else:
                        date_obj = from_date

                    existing = intraday_ohlc_model.search([
                        ('security_id', '=', security.id),
                        ('date', '=', date_obj),
                        ('time', '=', time_str)
                    ], limit=1)

                    values = {
                        'security_id': security.id,
                        'date': date_obj,
                        'time': time_str,
                        'open_price': item.get('Open', 0.0),
                        'high_price': item.get('High', 0.0),
                        'low_price': item.get('Low', 0.0),
                        'close_price': item.get('Close', 0.0),
                        'volume': item.get('Volume', 0.0),
                        'total_value': item.get('TotalValue', 0.0),
                        'resolution': item.get('Resolution', 1),
                    }

                    if existing:
                        existing.write(values)
                    else:
                        intraday_ohlc_model.create(values)
                    total_saved += 1

                current_page += 1
                try:
                    wizard.env.cr.commit()
                except Exception:
                    pass

            if total_saved:
                intraday_success += 1
                _logger.info("Intraday OHLC saved for %s: %d records", security.symbol, total_saved)

            # Removed: Intraday OHLC update to security - let Daily OHLC propagate handle price updates
            # Daily OHLC automatically propagates to security fields via _propagate_to_security()

            try:
                price_req = model.daily_stock_price(
                    symbol=security.symbol,
                    fromDate=from_date.strftime('%d/%m/%Y'),
                    toDate=to_date.strftime('%d/%m/%Y'),
                    pageIndex=1,
                    pageSize=1,
                    market=security.market
                )
                price_resp = client.daily_stock_price(sdk_config, price_req)
                if price_resp.get('status') == 'Success' and price_resp.get('data'):
                    price_items = price_resp['data'] if isinstance(price_resp['data'], list) else []
                    if price_items:
                        p = price_items[0]
                        security.write({
                            'reference_price': p.get('ReferencePrice', security.reference_price),
                            'ceiling_price': p.get('CeilingPrice', security.ceiling_price),
                            'floor_price': p.get('FloorPrice', security.floor_price),
                        })
            except Exception as e:
                _logger.debug('Skip stock price enrichment for %s: %s', security.symbol, e)

            try:
                wizard.env.cr.commit()
            except Exception:
                pass

        except Exception as e:
            _logger.error("Error fetching OHLC for %s (ID: %s): %s", security.symbol, security.id, str(e))
            error_count += 1

    try:
        wizard.sudo().write({'last_count': total_count})
    except Exception:
        _logger.debug("Skip writing last_count due to transaction state", exc_info=True)

    try:
        wizard._push_notice('Auto Fetch', _('OHLC fetched for %s symbols (daily: %s, intraday: %s, errors: %s)') % (
            total_count, daily_success, intraday_success, error_count
        ), 'success')
    except Exception:
        pass


