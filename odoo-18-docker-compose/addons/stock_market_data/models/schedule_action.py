# -*- coding: utf-8 -*-
from odoo import api, models
import logging

_logger = logging.getLogger(__name__)

class CustomCronJob(models.AbstractModel):
    _name = "schedule.fetch.all"

    @api.model
    def _schedule_to_fetch(self):
        try:
            # Cập nhật dữ liệu NIFTY 50
            self.env["nifty.stockindices"].fetch_nifty_data()
            
            # Cập nhật dữ liệu tất cả indices
            self.env["nifty.alldata"].fetch_nifty_data()
            
            # Cập nhật dữ liệu total market
            self.env["nifty.totalmarket"].fetch_nifty_data()
            
            # Cập nhật thông tin indices
            self.env["all.indices"].fetch_all_indices_data()
            
            # Fetch dữ liệu cho từng index cụ thể
            from .common_utils import MARKET_API_SELECTION
            for market_type in MARKET_API_SELECTION.keys():
                try:
                    print(f"Fetching data for index: {market_type}")
                    self.env["nifty.alldata"].fetch_nifty_data_for_index(market_type)
                except Exception as e:
                    print(f"Error fetching data for {market_type}: {e}")
                    continue
            
            _logger.info("Stock market data updated successfully")
            return "Cron job executed successfully"
        except Exception as e:
            _logger.error(f"Error in stock market data update: {e}")
            return f"Error: {e}"
