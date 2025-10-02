# -*- coding: utf-8 -*-
from odoo import api, fields, models
from requests.exceptions import RequestException
from .common_utils import COMMON_API_URL, MARKET_API_SELECTION
from nsepython import nsefetch


MARKET_TYPE_SELECTION = [
    ("nifty_midcap50", "nifty_midcap50"),
    ("nifty_midcap100", "nifty_midcap100"),
    ("nifty_midcap150", "nifty_midcap150"),
    ("nifty_smallcap50", "nifty_smallcap50"),
    ("nifty_smallcap100", "nifty_smallcap100"),
    ("nifty_smallcap250", "nifty_smallcap250"),
    ("nifty_midsmallcap400", "nifty_midsmallcap400"),
    ("nifty_100", "nifty_100"),
    ("nifty_200", "nifty_200"),
    ("nifty_auto", "nifty_auto"),
    ("nifty_next50", "nifty_next50"),
    ("nifty_financial_services25", "nifty_financial_services25"),
    ("nifty_financial_services", "nifty_financial_services"),
    ("nifty_it", "nifty_it"),
    ("nifty_fmcg", "nifty_fmcg"),
    ("nifty_media", "nifty_media"),
    ("nifty_metal", "nifty_metal"),
    ("nifty_pharma", "nifty_pharma"),
    ("nifty_psubank", "nifty_psubank"),
    ("nifty_realty", "nifty_realty"),
    ("nifty_privatebank", "nifty_privatebank"),
    ("nifty_healthcareindex", "nifty_healthcareindex"),
    ("nifty_consumerdurables", "nifty_consumerdurables"),
    ("nifty_oilgas", "nifty_oilgas"),
    ("nifty_bank", "nifty_bank"),
    ("nifty_energy", "nifty_energy"),
    ("nifty_midcap_select", "nifty_midcap_select"),
]


class Nifty200(models.TransientModel):
    _name = "nifty.alldata"
    _description = "NIFTY All Data"
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
    market_type_state = fields.Selection(
        selection=MARKET_TYPE_SELECTION,
        string="Market Type state",
        store=True,
        readonly=True,
        copy=False,
        tracking=True,
    )

    @api.model
    def fetch_nifty_data(self):
        for api_data_key in MARKET_API_SELECTION:
            try:
                response = nsefetch(
                    f"{COMMON_API_URL}{MARKET_API_SELECTION[api_data_key]}"
                )
                datas = response.get("data", [])
                nifty_alldata = self.env["nifty.alldata"]
                for data in datas:
                    symbol = data["symbol"]
                    values = {
                        "symbol": symbol,
                        "market_type_state": api_data_key,
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
                    stock_indices = nifty_alldata.search(
                        [
                            ("symbol", "=", symbol),
                            ("market_type_state", "=", api_data_key),
                        ]
                    )

                    if stock_indices:
                        stock_indices.write(values)
                    else:
                        stock_indices.create(values)

            except (RequestException, ValueError) as e:
                print("Error:", e)

    @api.model
    def fetch_nifty_data_for_index(self, market_type):
        """
        Fetch dữ liệu cho một index cụ thể từ NSE API
        """
        try:
            from .common_utils import COMMON_API_URL, MARKET_API_SELECTION
            from nsepython import nsefetch
            
            if market_type not in MARKET_API_SELECTION:
                print(f"Market type {market_type} not found in API selection")
                return False
            
            # Xóa dữ liệu cũ cho market type này
            old_records = self.search([("market_type_state", "=", market_type)])
            if old_records:
                old_records.unlink()
                print(f"Deleted {len(old_records)} old records for {market_type}")
            
            # Lấy dữ liệu mới từ API
            api_url = f"{COMMON_API_URL}{MARKET_API_SELECTION[market_type]}"
            print(f"Fetching data from: {api_url}")
            
            response = nsefetch(api_url)
            datas = response.get("data", [])
            
            if not datas:
                print(f"No data received for {market_type}")
                return False
            
            # Tạo records mới
            for data in datas:
                self.create({
                    "symbol": data.get("symbol", ""),
                    "open": data.get("open", 0),
                    "dayHigh": data.get("dayHigh", 0),
                    "dayLow": data.get("dayLow", 0),
                    "previousClose": data.get("previousClose", 0),
                    "lastPrice": data.get("lastPrice", 0),
                    "change": data.get("change", 0),
                    "pChange": data.get("pChange", 0),
                    "totalTradedVolume": data.get("totalTradedVolume", 0),
                    "totalTradedValue": data.get("totalTradedValue", 0),
                    "yearHigh": data.get("yearHigh", 0),
                    "yearLow": data.get("yearLow", 0),
                    "market_type_state": market_type,
                })
            
            print(f"Created {len(datas)} records for {market_type}")
            return True
            
        except Exception as e:
            print(f"Error fetching data for {market_type}: {e}")
            return False

    @api.model
    def get_top_indices(self, market_type, order_field, limit=5):
        """
        Lấy top gainers/losers cho một market type cụ thể
        """
        try:
            print(f"Getting top indices for: {market_type}, order: {order_field}, limit: {limit}")
            
            # Lấy tất cả records của market type này
            records = self.search([("market_type_state", "=", market_type)])
            print(f"Found {len(records)} records in database for {market_type}")
            
            if not records:
                print(f"No records found in database for {market_type}, trying API fallback")
                # Nếu không có dữ liệu trong DB, thử fetch từ API
                try:
                    from .common_utils import COMMON_API_URL, MARKET_API_SELECTION
                    from nsepython import nsefetch
                    
                    if market_type in MARKET_API_SELECTION:
                        api_url = f"{COMMON_API_URL}{MARKET_API_SELECTION[market_type]}"
                        print(f"Fetching from API: {api_url}")
                        response = nsefetch(api_url)
                        datas = response.get("data", [])
                        print(f"API returned {len(datas)} records for {market_type}")
                        
                        if datas:
                            # Sắp xếp theo pChange
                            if "desc" in order_field:
                                datas.sort(key=lambda x: x.get("pChange", 0), reverse=True)
                            else:
                                datas.sort(key=lambda x: x.get("pChange", 0))
                            
                            # Lấy top records
                            top_datas = datas[:limit]
                            
                            data = []
                            for data_item in top_datas:
                                data.append({
                                    "symbol": data_item.get("symbol", ""),
                                    "open": data_item.get("open", 0),
                                    "dayHigh": data_item.get("dayHigh", 0),
                                    "dayLow": data_item.get("dayLow", 0),
                                    "previousClose": data_item.get("previousClose", 0),
                                    "lastPrice": data_item.get("lastPrice", 0),
                                    "change": data_item.get("change", 0),
                                    "pChange": data_item.get("pChange", 0),
                                    "totalTradedVolume": data_item.get("totalTradedVolume", 0),
                                    "totalTradedValue": data_item.get("totalTradedValue", 0),
                                    "yearHigh": data_item.get("yearHigh", 0),
                                    "yearLow": data_item.get("yearLow", 0),
                                })
                            
                            print(f"API top indices result for {market_type}: {len(data)} records")
                            return data
                except Exception as api_error:
                    print(f"Error fetching from API for {market_type}: {api_error}")
                
                return []
            
            data = []
            for record in records:
                data.append({
                    "symbol": record.symbol,
                    "open": record.open,
                    "dayHigh": record.dayHigh,
                    "dayLow": record.dayLow,
                    "previousClose": record.previousClose,
                    "lastPrice": record.lastPrice,
                    "change": record.change,
                    "pChange": record.pChange,
                    "totalTradedVolume": record.totalTradedVolume,
                    "totalTradedValue": record.totalTradedValue,
                    "yearHigh": record.yearHigh,
                    "yearLow": record.yearLow,
                })
            
            # Sắp xếp theo pChange
            if "desc" in order_field:
                data.sort(key=lambda x: x.get("pChange", 0), reverse=True)
            else:
                data.sort(key=lambda x: x.get("pChange", 0))
            
            # Lấy top records
            top_data = data[:limit]
            print(f"Database top indices result for {market_type}: {len(top_data)} records")
            return top_data
        except Exception as e:
            print(f"Error getting top indices for {market_type}: {e}")
            return []

    @api.model
    def get_index_summary(self, market_type):
        """
        Lấy tổng quan của một index cụ thể (tổng giá trị, thay đổi, etc.)
        """
        try:
            print(f"Getting index summary for: {market_type}")
            
            # Lấy tất cả records của market type này
            records = self.search([("market_type_state", "=", market_type)])
            print(f"Found {len(records)} records in database for {market_type}")
            
            if not records:
                print(f"No records found in database for {market_type}, trying API fallback")
                # Nếu không có dữ liệu trong DB, thử fetch từ API
                try:
                    from .common_utils import COMMON_API_URL, MARKET_API_SELECTION
                    from nsepython import nsefetch
                    
                    if market_type in MARKET_API_SELECTION:
                        api_url = f"{COMMON_API_URL}{MARKET_API_SELECTION[market_type]}"
                        print(f"Fetching from API: {api_url}")
                        response = nsefetch(api_url)
                        datas = response.get("data", [])
                        print(f"API returned {len(datas)} records for {market_type}")
                        
                        if datas:
                            # Tính tổng từ dữ liệu API
                            total_value = sum(data.get("lastPrice", 0) for data in datas if data.get("lastPrice"))
                            total_change = sum(data.get("change", 0) for data in datas if data.get("change"))
                            total_pchange = sum(data.get("pChange", 0) for data in datas if data.get("pChange"))
                            count = len(datas)
                            
                            avg_value = total_value / count if count > 0 else 0
                            avg_change = total_change / count if count > 0 else 0
                            avg_pchange = total_pchange / count if count > 0 else 0
                            
                            result = {
                                "total_value": total_value,
                                "avg_value": avg_value,
                                "total_change": total_change,
                                "avg_change": avg_change,
                                "total_pchange": total_pchange,
                                "avg_pchange": avg_pchange,
                                "count": count,
                                "market_type": market_type
                            }
                            print(f"API summary result for {market_type}: {result}")
                            return result
                    else:
                        print(f"Market type {market_type} not found in API selection")
                except Exception as api_error:
                    print(f"Error fetching from API for {market_type}: {api_error}")
                
                # Fallback nếu không lấy được dữ liệu
                print(f"Using fallback data for {market_type}")
                return {
                    "total_value": 0,
                    "avg_value": 0,
                    "total_change": 0,
                    "avg_change": 0,
                    "total_pchange": 0,
                    "avg_pchange": 0,
                    "count": 0,
                    "market_type": market_type
                }
            
            # Tính tổng các giá trị từ database
            total_value = sum(record.lastPrice for record in records if record.lastPrice)
            total_change = sum(record.change for record in records if record.change)
            total_pchange = sum(record.pChange for record in records if record.pChange)
            count = len(records)
            
            # Tính giá trị trung bình
            avg_value = total_value / count if count > 0 else 0
            avg_change = total_change / count if count > 0 else 0
            avg_pchange = total_pchange / count if count > 0 else 0
            
            result = {
                "total_value": total_value,
                "avg_value": avg_value,
                "total_change": total_change,
                "avg_change": avg_change,
                "total_pchange": total_pchange,
                "avg_pchange": avg_pchange,
                "count": count,
                "market_type": market_type
            }
            print(f"Database summary result for {market_type}: {result}")
            return result
        except Exception as e:
            print(f"Error getting index summary for {market_type}: {e}")
            return {
                "total_value": 0,
                "avg_value": 0,
                "total_change": 0,
                "avg_change": 0,
                "total_pchange": 0,
                "avg_pchange": 0,
                "count": 0,
                "market_type": market_type
            }

    @api.model
    def get_realtime_index_data(self, market_type):
        """
        Lấy dữ liệu realtime từ NSE API cho một index cụ thể
        """
        try:
            from .common_utils import COMMON_API_URL, MARKET_API_SELECTION
            from nsepython import nsefetch
            
            if market_type not in MARKET_API_SELECTION:
                print(f"Market type {market_type} not found in API selection")
                return None
            
            # Lấy dữ liệu realtime từ NSE API
            api_url = f"{COMMON_API_URL}{MARKET_API_SELECTION[market_type]}"
            response = nsefetch(api_url)
            datas = response.get("data", [])
            
            if not datas:
                print(f"No data received from API for {market_type}")
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
                "total_value": total_value,
                "avg_value": avg_value,
                "total_change": total_change,
                "avg_change": avg_change,
                "total_pchange": total_pchange,
                "avg_pchange": avg_pchange,
                "count": count,
                "market_type": market_type,
                "realtime": True,
                "timestamp": response.get("timestamp", ""),
                "lastUpdateTime": response.get("lastUpdateTime", "")
            }
        except Exception as e:
            print(f"Error getting realtime data for {market_type}: {e}")
            return None

    @api.model
    def get_realtime_top_indices(self, market_type, order_field, limit=5):
        """
        Lấy top gainers/losers realtime từ NSE API cho một market type cụ thể
        """
        try:
            from .common_utils import COMMON_API_URL, MARKET_API_SELECTION
            from nsepython import nsefetch
            
            if market_type not in MARKET_API_SELECTION:
                print(f"Market type {market_type} not found in API selection")
                return []
            
            # Lấy dữ liệu realtime từ NSE API
            api_url = f"{COMMON_API_URL}{MARKET_API_SELECTION[market_type]}"
            response = nsefetch(api_url)
            datas = response.get("data", [])
            
            if not datas:
                print(f"No data received from API for {market_type}")
                return []
            
            # Sắp xếp theo pChange
            if "desc" in order_field:
                datas.sort(key=lambda x: x.get("pChange", 0), reverse=True)
            else:
                datas.sort(key=lambda x: x.get("pChange", 0))
            
            # Lấy top records
            top_datas = datas[:limit]
            
            data = []
            for data_item in top_datas:
                data.append({
                    "symbol": data_item.get("symbol", ""),
                    "open": data_item.get("open", 0),
                    "dayHigh": data_item.get("dayHigh", 0),
                    "dayLow": data_item.get("dayLow", 0),
                    "previousClose": data_item.get("previousClose", 0),
                    "lastPrice": data_item.get("lastPrice", 0),
                    "change": data_item.get("change", 0),
                    "pChange": data_item.get("pChange", 0),
                    "totalTradedVolume": data_item.get("totalTradedVolume", 0),
                    "totalTradedValue": data_item.get("totalTradedValue", 0),
                    "yearHigh": data_item.get("yearHigh", 0),
                    "yearLow": data_item.get("yearLow", 0),
                    "realtime": True,
                    "timestamp": response.get("timestamp", ""),
                    "lastUpdateTime": response.get("lastUpdateTime", "")
                })
            
            return data
        except Exception as e:
            print(f"Error getting realtime top indices for {market_type}: {e}")
            return []

    @api.model
    def get_realtime_index_headline(self, market_type):
        """
        Lấy thông tin headline (Last, %Change, Open/High/Low/Prev) realtime của Index từ API allIndices
        """
        try:
            from .common_utils import MARKET_API_SELECTION
            from urllib.parse import unquote
            from nsepython import nsefetch

            if market_type not in MARKET_API_SELECTION:
                print(f"Market type {market_type} not found in API selection for headline")
                return None

            pretty_name = unquote(MARKET_API_SELECTION[market_type])

            response = nsefetch("https://www.nseindia.com/api/allIndices")
            data_list = response.get("data", [])

            for item in data_list:
                if item.get("index") == pretty_name:
                    return {
                        "index": item.get("index", ""),
                        "last": item.get("last", 0),
                        "variation": item.get("variation", 0),
                        "percentChange": item.get("percentChange", 0),
                        "open": item.get("open", 0),
                        "high": item.get("high", 0),
                        "low": item.get("low", 0),
                        "previousClose": item.get("previousClose", 0),
                        "tradeDate": response.get("timestamp", ""),
                        "lastUpdateTime": response.get("lastUpdateTime", ""),
                        "realtime": True,
                    }

            print(f"Headline not found in allIndices for: {pretty_name}")
            return None
        except Exception as e:
            print(f"Error getting realtime index headline for {market_type}: {e}")
            return None
