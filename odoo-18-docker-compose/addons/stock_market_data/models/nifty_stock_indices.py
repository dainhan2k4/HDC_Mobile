# -*- coding: utf-8 -*-
from odoo import api, fields, models
from requests.exceptions import RequestException
from .common_utils import COMMON_API_URL
from nsepython import nsefetch


class NiftyStockIndices(models.TransientModel):
    _name = "nifty.stockindices"
    _description = "Nifty Stock Indices"
    _rec_name = "symbol"

    symbol = fields.Char(string="Symbol", readonly=True, store=True)
    open = fields.Float(string="Open", readonly=True, store=True)
    dayHigh = fields.Float(string="Day High", readonly=True, store=True)
    dayLow = fields.Float(string="Day Low", readonly=True, store=True)
    previousClose = fields.Float(string="PREV. CLOSE", readonly=True, store=True)
    lastPrice = fields.Float(string="LAST PRICE", readonly=True, store=True)
    change = fields.Float(string="CHANGE", readonly=True, store=True)
    pChange = fields.Float(string="% CHANGE", readonly=True, store=True)
    totalTradedVolume = fields.Float(
        string="TOTAL TRADED VOLUME", readonly=True, store=True
    )
    totalTradedValue = fields.Float(
        string="TOTAL TRADED VALUE", readonly=True, store=True
    )
    yearHigh = fields.Float(string="52W H", readonly=True, store=True)
    yearLow = fields.Float(string="52W L", readonly=True, store=True)

    @api.model
    def fetch_nifty_data(self):
        datas = []
        try:
            response = nsefetch(f"{COMMON_API_URL}NIFTY%2050")
            datas = response.get("data", [])
        except (RequestException, ValueError) as e:
            print("Error:", e)
            return
        StockIndices = self.env["nifty.stockindices"]

        for data in datas:
            symbol = data["symbol"]
            stock_indices = StockIndices.search([("symbol", "=", symbol)])
            values = {
                "symbol": symbol,
                "open": data["open"],
                "dayHigh": data["dayHigh"],
                "dayLow": data["dayLow"],
                "previousClose": data["previousClose"],
                "lastPrice": data["lastPrice"],
                "change": data["change"],
                "pChange": data["pChange"],
                "totalTradedVolume": data["totalTradedVolume"],
                "totalTradedValue": data["totalTradedValue"],
                "yearHigh": data["yearHigh"],
                "yearLow": data["yearLow"],
            }
            if stock_indices:
                stock_indices.write(values)
            else:
                StockIndices.create(values)
        return datas

    @api.model
    def get_top_nifty_indices(self, order_field, limit):
        data = []
        stock_indices = self.search([], order=order_field, limit=limit)
        for stock_data in stock_indices:
            data.append(
                {
                    "symbol": stock_data.symbol,
                    "open": stock_data.open,
                    "dayHigh": stock_data.dayHigh,
                    "dayLow": stock_data.dayLow,
                    "previousClose": stock_data.previousClose,
                    "lastPrice": stock_data.lastPrice,
                    "change": stock_data.change,
                    "pChange": stock_data.pChange,
                    "totalTradedVolume": stock_data.totalTradedVolume,
                    "totalTradedValue": stock_data.totalTradedValue,
                    "yearHigh": stock_data.yearHigh,
                    "yearLow": stock_data.yearLow,
                }
            )
        return data

    @api.model
    def gainer_nifty50(self):
        return self.get_top_nifty_indices(order_field="pChange desc", limit=5)

    @api.model
    def losser_nifty50(self):
        return self.get_top_nifty_indices(order_field="pChange asc", limit=5)
