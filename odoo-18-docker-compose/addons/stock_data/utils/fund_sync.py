from odoo import fields
import logging

_logger = logging.getLogger(__name__)


def _map_volume_to_inventory_qty(volume_value):
    try:
        return int(volume_value or 0)
    except Exception:
        return 0


def sync_fund_on_write(securities, vals):
    """Sync changed securities fields to fund.certificate.
    Mapping rules:
      - volume -> initial_certificate_quantity (int)
      - total_value/change/change_percent computed when price-related fields change
    """
    if not securities:
        return

    env = securities.env
    if env.context.get('skip_fund_sync'):
        return
    # module may not be installed
    if 'fund.certificate' not in env:
        return

    sync_fields = [
        'symbol', 'market',
        'stock_name_vn', 'stock_name_en',
        'reference_price', 'ceiling_price', 'floor_price',
        'last_trading_date', 'current_price', 'high_price',
        'low_price', 'volume', 'last_price', 'is_active'
    ]
    fields_to_sync = [f for f in sync_fields if f in vals]
    if not fields_to_sync:
        return

    fund_cert_model = env['fund.certificate']

    for rec in securities:
        if not rec.symbol or not rec.market:
            continue

        fund_cert = fund_cert_model.search([
            ('symbol', '=', rec.symbol),
            ('market', '=', rec.market)
        ], limit=1)
        if not fund_cert:
            continue

        fund_vals = {}
        for field in fields_to_sync:
            if hasattr(rec, field):
                if field == 'volume':
                    fund_vals['initial_certificate_quantity'] = _map_volume_to_inventory_qty(rec.volume)
                else:
                    if field == 'stock_name_vn':
                        fund_vals['short_name_vn'] = rec.stock_name_vn
                    elif field == 'stock_name_en':
                        fund_vals['short_name_en'] = rec.stock_name_en
                    else:
                        fund_vals[field] = rec[field]

        # compute dependent values if price-related changed
        if any(f in fields_to_sync for f in ['current_price', 'volume', 'reference_price']):
            current_price = rec.current_price or 0.0
            volume = rec.volume or 0.0
            reference_price = rec.reference_price or 0.0
            change = current_price - reference_price
            total_value = current_price * volume
            change_percent = (change / reference_price * 100.0) if reference_price > 0 else 0.0
            fund_vals.update({
                'total_value': total_value,
                'change': change,
                'change_percent': change_percent,
            })

        fund_vals['last_update'] = fields.Datetime.now()

        try:
            fund_cert.with_context(skip_fund_sync=True).write(fund_vals)
        except Exception as e:
            _logger.warning("Error writing fund certificate for %s(%s): %s", rec.symbol, rec.market, str(e))


def sync_fund_on_create(security):
    """Create fund.certificate when a security is created and has daily OHLC."""
    env = security.env
    if env.context.get('skip_fund_sync'):
        return
    if 'fund.certificate' not in env:
        return

    # only auto-create if there is at least one daily OHLC record
    if not security.daily_ohlc_ids:
        return

    fund_cert_model = env['fund.certificate']
    existing = fund_cert_model.search([
        ('symbol', '=', security.symbol),
        ('market', '=', security.market)
    ], limit=1)
    if existing:
        return

    current_price = security.current_price or 0.0
    volume = security.volume or 0.0
    reference_price = security.reference_price or 0.0
    change = current_price - reference_price
    change_percent = (change / reference_price * 100.0) if reference_price > 0 else 0.0
    total_value = current_price * volume

    vals = {
        'symbol': security.symbol,
        'market': security.market,
        'short_name_vn': getattr(security, 'stock_name_vn', '') or '',
        'short_name_en': getattr(security, 'stock_name_en', '') or '',
        'reference_price': reference_price,
        'ceiling_price': security.ceiling_price or 0.0,
        'floor_price': security.floor_price or 0.0,
        'last_trading_date': security.last_trading_date,
        'current_price': current_price,
        'high_price': security.high_price or 0.0,
        'low_price': security.low_price or 0.0,
        'initial_certificate_quantity': _map_volume_to_inventory_qty(volume),
        'total_value': total_value,
        'change': change,
        'change_percent': change_percent,
        'last_price': security.last_price or 0.0,
        'is_active': security.is_active,
        'last_update': fields.Datetime.now(),
        'fund_description': f"Tự động tạo từ {security.symbol} - {security.name or 'N/A'}",
    }
    try:
        fund_cert_model.with_context(skip_fund_sync=True).create(vals)
        _logger.info("Auto-created fund certificate for %s (%s)", security.symbol, security.market)
    except Exception as e:
        _logger.warning("Error auto-creating fund.certificate: %s", str(e))


