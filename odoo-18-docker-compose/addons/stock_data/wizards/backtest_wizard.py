import logging
from odoo import _
from odoo.exceptions import UserError
from ssi_fc_data import model


_logger = logging.getLogger(__name__)


def fetch_backtest(wizard, client, sdk_config):
    if not wizard.symbol:
        raise UserError(_("Please enter symbol for backtest"))

    req = model.backtest(
        symbol=wizard.symbol,
        fromDate=wizard.from_date.strftime('%d/%m/%Y'),
        toDate=wizard.to_date.strftime('%d/%m/%Y'),
        pageIndex=wizard.page_index,
        pageSize=wizard.page_size
    )

    response = client.backtest(sdk_config, req)
    _logger.info("Backtest response: %s", response)

    if response.get('status') == 'Success' and response.get('data'):
        items = response['data'] if isinstance(response['data'], list) else []
        wizard.result_message = f"<p>Fetched {len(items)} backtest records for {wizard.symbol}</p>"
        wizard.last_count = len(items)
    else:
        raise UserError(_("Failed to fetch backtest data: %s") % response.get('message', 'Unknown error'))


