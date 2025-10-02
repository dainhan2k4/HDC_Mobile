from odoo import models, _


class NavTransactionCalculator(models.AbstractModel):
    _name = 'nav.transaction.calculator'
    _description = 'Calculator cho NAV phiên giao dịch'

    def _compute_days(self, term_months=None, days=None):
        """Ưu tiên days từ dữ liệu; nếu không, ước lượng theo kỳ hạn tháng (x30).

        Tránh phụ thuộc now() ở tầng tính toán để đảm bảo tính idempotent cho 1 bản ghi.
        """
        try:
            days_int = int(days or 0)
        except Exception:
            days_int = 0
        if days_int > 0:
            return days_int
        try:
            m = int(term_months or 0)
        except Exception:
            m = 0
        if m > 0:
            # Chuẩn hoá: 1 tháng = 30 ngày để đồng nhất với Excel nếu không có days
            return max(1, m * 30)
        # fallback an toàn
        return 1

    def compute_sell_value(self, order_value, interest_rate_percent, term_months=None, days=None):
        """Giá trị bán = Giá trị lệnh * lãi suất / 365 * Số ngày + Giá trị lệnh"""
        order_value = float(order_value or 0.0)
        rate = float(interest_rate_percent or 0.0)
        d = self._compute_days(term_months=term_months, days=days)
        return order_value * (rate / 100.0) / 365.0 * d + order_value

    def compute_price1(self, sell_value, units):
        """Giá bán 1 = ROUND(Giá trị bán / Số lượng CCQ, 0)"""
        units = float(units or 0.0)
        if units <= 0:
            return 0.0
        return float(round(float(sell_value or 0.0) / units))

    def compute_price2(self, price1, step=50):
        """Giá bán 2 = MROUND(Giá bán 1, step) với step mặc định = 50"""
        step = float(step or 0.0)
        p1 = float(price1 or 0.0)
        if step <= 0:
            return p1
        return float(round(p1 / step) * step)

    def compute_converted_rate(self, price2, nav_value, days):
        """LS quy đổi = (Giá bán 2 / Giá mua/bán - 1) * 365 / Số ngày * 100

        Giá mua/bán ở đây là nav_value hiện tại của giao dịch.
        """
        nav = float(nav_value or 0.0)
        d = int(days or 0)
        if nav <= 0 or d <= 0:
            return 0.0
        return (float(price2 or 0.0) / nav - 1.0) * 365.0 / d * 100.0

    def compute_transaction_metrics(self, item):
        """Nhận dict giao dịch, trả về dict bổ sung các trường tính toán.

        Kỳ vọng item có các field: amount/trade_price, nav_value, interest_rate, units/remaining_units,
        term_months, days. Ưu tiên: trade_price -> amount -> units*nav_value.
        """
        if not isinstance(item, dict):
            return {}
        nav_value = float(item.get('nav_value') or 0.0)
        rate = float(item.get('interest_rate') or 0.0)
        units = float(item.get('remaining_units') or item.get('units') or 0.0)
        order_value = float(item.get('trade_price') or item.get('amount') or 0.0)
        if order_value <= 0 and nav_value > 0 and units > 0:
            order_value = units * nav_value

        d = self._compute_days(term_months=item.get('term_months'), days=item.get('days'))
        sell_value = self.compute_sell_value(order_value, rate, term_months=item.get('term_months'), days=d)
        price1 = self.compute_price1(sell_value, units)
        price2 = self.compute_price2(price1, step=50)
        r_new = self.compute_converted_rate(price2, nav_value, d)
        delta = r_new - rate

        return {
            'sell_value': sell_value,
            'price1': price1,
            'price2': price2,
            'interest_rate_new': r_new,
            'interest_delta': delta,
            'days_effective': d,
        }


