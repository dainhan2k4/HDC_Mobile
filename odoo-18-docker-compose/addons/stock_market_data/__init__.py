# -*- coding: utf-8 -*-
from . import models


def _stock_market_data_post_hook(env):
    """
    Get stock market data from NSE
    """
    env["nifty.stockindices"].fetch_nifty_data()
    env["nifty.integration"].fetch_nifty_data()
    env["schedule.fetch.all"]._schedule_to_fetch()
