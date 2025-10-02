# -*- coding: utf-8 -*-
from odoo import api, fields, models
from requests.exceptions import RequestException
from nsepython import nsefetch

MARKET_ALL_INDICES_SELECTION = [
    ("nifty_midcap50", "NIFTY MIDCAP 50"),
    ("nifty_midcap100", "NIFTY MIDCAP 100"),
    ("nifty_midcap150", "NIFTY MIDCAP 150"),
    ("nifty_smallcap50", "NIFTY SMALLCAP 50"),
    ("nifty_smallcap100", "NIFTY SMALLCAP 100"),
    ("nifty_smallcap250", "NIFTY SMALLCAP 250"),
    ("nifty_midsmallcap400", "NIFTY MIDSMALLCAP 400"),
    ("nifty_100", "NIFTY 100"),
    ("nifty_200", "NIFTY 200"),
    ("nifty_auto", "NIFTY AUTO"),
    ("nifty_next50", "NIFTY NEXT 50"),
    ("nifty_financial_services25", "NIFTY FINANCIAL SERVICES 25/50"),
    ("nifty_financial_services", "NIFTY FINANCIAL SERVICES"),
    ("nifty_it", "NIFTY IT"),
    ("nifty_fmcg", "NIFTY FMCG"),
    ("nifty_media", "NIFTY MEDIA"),
    ("nifty_metal", "NIFTY METAL"),
    ("nifty_pharma", "NIFTY PHARMA"),
    ("nifty_psubank", "NIFTY PSU BANK"),
    ("nifty_realty", "NIFTY REALTY"),
    ("nifty_privatebank", "NIFTY PRIVATE BANK"),
    ("nifty_healthcareindex", "NIFTY HEALTHCARE INDEX"),
    ("nifty_consumerdurables", "NIFTY CONSUMER DURABLES"),
    ("nifty_oilgas", "NIFTY OIL & GAS"),
    ("nifty_bank", "NIFTY BANK"),
    ("nifty_energy", "NIFTY ENERGY"),
    ("nifty_midcap_select", "nifty_midcap_select"),
]


class AllIndices(models.TransientModel):
    _name = "all.indices"
    _description = "All Indices"
    _rec_name = "index"

    key = fields.Char(string="Key", readonly=True, store=True)
    indexSymbol = fields.Char(string="Index Symbol", readonly=True, store=True)
    index = fields.Char(string="Index", readonly=True, store=True, tracking=True)
    last = fields.Float(string="Last", readonly=True, store=True, tracking=True)
    open = fields.Float(string="open", readonly=True, store=True)
    high = fields.Float(string="High", readonly=True, store=True)
    low = fields.Float(string="Low", readonly=True, store=True)
    previousClose = fields.Float(string="Previous Close", readonly=True, store=True)
    yearHigh = fields.Float(string="Year High", readonly=True, store=True)
    yearLow = fields.Float(string="Year Low", readonly=True, store=True)
    variation = fields.Float(
        string="Variation", readonly=True, store=True, tracking=True
    )
    percentChange = fields.Float(
        string="Percent Change", readonly=True, store=True, tracking=True
    )
    Curvalue = fields.Float(string="Current Value", readonly=True, store=True)
    Chg = fields.Float(string="Ch (pts)", readonly=True, store=True)
    Week52High = fields.Float(string="52 Wk High", readonly=True, store=True)
    Week52Low = fields.Float(string="52 Wk Low", readonly=True, store=True)
    date = fields.Date(string="Date", readonly=True, store=True)
    market_indices_state = fields.Selection(
        selection=MARKET_ALL_INDICES_SELECTION,
        string="Market Indices state",
        store=True,
        readonly=True,
        copy=False,
        tracking=True,
    )

    @api.model
    def fetch_all_indices_data(self):
        try:
            response = nsefetch("https://www.nseindia.com/api/allIndices")
            data_list = response.get("data", [])
            for data in data_list:
                index = data["index"]
                stock_index = self.search([("index", "=", index)])
                values = {
                    "key": data["key"],
                    "indexSymbol": data["indexSymbol"],
                    "index": index,
                    "last": data["last"],
                    "open": data["open"],
                    "high": data["high"],
                    "low": data["low"],
                    "previousClose": data["previousClose"],
                    "yearHigh": data["yearHigh"],
                    "yearLow": data["yearLow"],
                    "variation": data["variation"],
                    "percentChange": data["percentChange"],
                }

                if stock_index:
                    for value in MARKET_ALL_INDICES_SELECTION:
                        if index == value[1]:
                            values["market_indices_state"] = value[0]
                    stock_index.write(values)
                else:
                    for value in MARKET_ALL_INDICES_SELECTION:
                        if index == value[1]:
                            values["market_indices_state"] = value[0]
                    self.create(values)
            return data_list
        except (RequestException, ValueError) as e:
            print("Error:", e)

    def get_data_nifty(self):
        data_all_nifty = self.env["nifty.alldata"].search(
            [("market_type_state", "=", self.market_indices_state)]
        )
        xml_mapping = {
            "NIFTY 50": "stock_market_data.action_nifty_50",
            "NIFTY TOTAL MARKET": "stock_market_data.action_nifty_totalmarket",
        }
        for data in data_all_nifty:
            action = self.env["ir.actions.actions"]._for_xml_id(
                "stock_market_data.action_nifty_alldata"
            )
            action["domain"] = [("market_type_state", "=", data.market_type_state)]
        if data_all_nifty:
            return action
        elif self.index == "NIFTY 50" or self.index == "NIFTY TOTAL MARKET":
            return self.env["ir.actions.act_window"]._for_xml_id(
                xml_mapping.get(self.index)
            )
        else:
            return {
                "type": "ir.actions.client",
                "tag": "display_notification",
                "params": {
                    "type": "info",
                    "title": ("Info for Market Data"),
                    "message": ("There is no data for this Index"),
                    "sticky": False,
                },
            }


class NiftyIntegration(models.TransientModel):
    _name = "nifty.integration"
    _description = "Nifty Integration"

    market = fields.Char(string="Market", readonly=True, store=True)
    marketStatus = fields.Char(string="Market Status", readonly=True, store=True)
    index = fields.Char(string="Index", readonly=True, store=True, tracking=True)
    last = fields.Char(string="Last", readonly=True, store=True, tracking=True)
    variation = fields.Float(
        string="Variation", readonly=True, store=True, tracking=True
    )
    percentChange = fields.Float(
        string="Percent Change", readonly=True, store=True, tracking=True
    )
    tradeDate = fields.Char(string="Trade Date", readonly=True, store=True)

    @api.model
    def fetch_nifty_data(self):
        try:
            response = nsefetch("https://www.nseindia.com/api/marketStatus")
            api_data = response.get("marketState", [])[0]
            if api_data and "marketState" in api_data:
                data = api_data["marketState"][0]
                nifty_integration = self.search([])
                values = {
                    "marketStatus": data["marketStatus"],
                    "index": data["index"],
                    "last": data["last"],
                    "variation": data["variation"],
                    "percentChange": data["percentChange"],
                    "tradeDate": data["tradeDate"],
                }
                if nifty_integration:
                    nifty_integration.write(values)
                else:
                    self.create(values)

            return api_data
        except (RequestException, ValueError) as e:
            print("Error:", e)

    @api.model
    def get_nifty50_summary(self):
        """
        Lấy dữ liệu tổng quan cho NIFTY 50 từ all.indices
        """
        try:
            # Tìm NIFTY 50 trong all.indices
            nifty50_record = self.env["all.indices"].search([("index", "=", "NIFTY 50")], limit=1)
            
            if nifty50_record:
                return {
                    "market": "NSE",
                    "marketStatus": "Open",  # Giả định market luôn open
                    "index": "NIFTY 50",
                    "last": nifty50_record.last,
                    "variation": nifty50_record.variation,
                    "percentChange": nifty50_record.percentChange,
                    "tradeDate": nifty50_record.date.strftime('%d-%m-%Y') if nifty50_record.date else "",
                    "open": nifty50_record.open,
                    "high": nifty50_record.high,
                    "low": nifty50_record.low,
                    "previousClose": nifty50_record.previousClose,
                }
            else:
                # Fallback về dữ liệu cũ nếu không tìm thấy
                return self.fetch_nifty_data()
                
        except Exception as e:
            print(f"Error getting NIFTY 50 summary: {e}")
            # Fallback về dữ liệu cũ
            return self.fetch_nifty_data()

    @api.model
    def get_realtime_nifty50_data(self):
        """
        Lấy dữ liệu NIFTY 50 realtime từ NSE API
        """
        try:
            from nsepython import nsefetch
            from datetime import datetime
            
            # Lấy dữ liệu realtime từ NSE API cho NIFTY 50
            response = nsefetch("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050")
            datas = response.get("data", [])
            
            if not datas:
                print("No realtime data received for NIFTY 50")
                return None
            
            # Tính toán tổng quan từ dữ liệu realtime
            total_value = sum(data.get("lastPrice", 0) for data in datas if data.get("lastPrice"))
            total_change = sum(data.get("change", 0) for data in datas if data.get("change"))
            total_pchange = sum(data.get("pChange", 0) for data in datas if data.get("pChange"))
            count = len(datas)
            
            avg_value = total_value / count if count > 0 else 0
            avg_change = total_change / count if count > 0 else 0
            avg_pchange = total_pchange / count if count > 0 else 0
            
            return {
                "market": "NSE",
                "marketStatus": "Open",
                "index": "NIFTY 50",
                "last": avg_value,
                "variation": avg_change,
                "percentChange": avg_pchange,
                "tradeDate": datetime.now().strftime('%d-%m-%Y'),
                "open": datas[0].get("open", 0) if datas else 0,
                "high": max(data.get("dayHigh", 0) for data in datas) if datas else 0,
                "low": min(data.get("dayLow", 0) for data in datas) if datas else 0,
                "previousClose": datas[0].get("previousClose", 0) if datas else 0,
                "realtime": True,
                "timestamp": response.get("timestamp", ""),
                "lastUpdateTime": response.get("lastUpdateTime", "")
            }
        except Exception as e:
            print(f"Error getting realtime NIFTY 50 data: {e}")
            return None
