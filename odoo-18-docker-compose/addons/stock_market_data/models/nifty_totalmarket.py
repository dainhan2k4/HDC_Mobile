# -*- coding: utf-8 -*-
from odoo import api, fields, models
from requests.exceptions import RequestException
from .common_utils import COMMON_API_URL
from nsepython import nsefetch


class NiftyTotalMarket(models.TransientModel):
    _name = "nifty.totalmarket"
    _description = "NIFTY TOTAL MARKET"
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
        try:
            response = nsefetch(f"{COMMON_API_URL}NIFTY%20TOTAL%20MARKET")
            datas = response.get("data", [])
        except RequestException as e:
            print("Request Exception:", e)
            return
        except ValueError as e:
            print("JSON Decode Error:", e)
            return
        nifty_totalmarket = self.env["nifty.totalmarket"]
        for data in datas:
            symbol = data["symbol"]
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
            stock_indices = nifty_totalmarket.search([("symbol", "=", symbol)])
            if stock_indices:
                stock_indices.write(values)
            else:
                nifty_totalmarket.create(values)
        return datas
