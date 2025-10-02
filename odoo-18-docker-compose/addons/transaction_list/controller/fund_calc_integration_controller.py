from odoo import http, fields
from odoo.http import request
from ..utils import mround
import json
from datetime import datetime

class OrderMatchingEngine:
    """Engine khớp lệnh riêng cho transaction_list"""
    
    def __init__(self, env):
        self.env = env
    
    def match_orders(self, buy_orders, sell_orders, use_time_priority=False):
        """
        Khớp lệnh mua và bán
        
        Args:
            buy_orders: List các lệnh mua (portfolio.transaction records)
            sell_orders: List các lệnh bán (portfolio.transaction records)
            use_time_priority: True = FIFO, False = Best Price First
        
        Returns:
            dict: {
                'matched_pairs': list,
                'remaining_buys': list,
                'remaining_sells': list,
                'algorithm_used': str
            }
        """
        try:
            # Copy để không ảnh hưởng original
            pending_purchases = list(buy_orders)
            pending_sells = list(sell_orders)
            
            matched_pairs = []
            warnings = []  # Thêm list để thu thập warnings
            
            # Xây sổ lệnh trong bộ nhớ để xử lý phần khớp từng phần nhiều lần như StockExchangeApp
            def _price(o):
                return (o.current_nav or 0.0)
            
            def _dt(o):
                if hasattr(o, 'create_date') and o.create_date:
                    return o.create_date
                if hasattr(o, 'created_at') and o.created_at:
                    return o.created_at
                return datetime.now()

            buy_book = [
                {
                    'rec': b,
                    'remaining': float(
                        getattr(b, 'remaining_units', 0) or 0
                    ),
                    'price': _price(b),
                    'time': _dt(b),
                }
                for b in pending_purchases 
                if float(getattr(b, 'remaining_units', 0) or 0) > 0
            ]
            sell_book = [
                {
                    'rec': s,
                    'remaining': float(
                        getattr(s, 'remaining_units', 0) or 0
                    ),
                    'price': _price(s),
                    'time': _dt(s),
                }
                for s in pending_sells 
                if float(getattr(s, 'remaining_units', 0) or 0) > 0
            ]
            print(f"[DEBUG] Initial buy_book: {len(buy_book)} orders")
            for item in buy_book:
                print(f"[DEBUG] Buy {item['rec'].id}: remaining={item['remaining']}, price={item['price']}, fund={getattr(item['rec'], 'fund_id', None)}")
            
            print(f"[DEBUG] Initial sell_book: {len(sell_book)} orders")
            for item in sell_book:
                print(f"[DEBUG] Sell {item['rec'].id}: remaining={item['remaining']}, price={item['price']}, fund={getattr(item['rec'], 'fund_id', None)}")

            def select_best_buy():
                if not buy_book:
                    return None
                if use_time_priority:
                    best_price = max(item['price'] for item in buy_book)
                    candidates = [it for it in buy_book if it['price'] == best_price]
                    return min(candidates, key=lambda it: it['time'])
                # Best Price First only
                return max(buy_book, key=lambda it: it['price'])

            def select_best_sell():
                if not sell_book:
                    return None
                if use_time_priority:
                    best_price = min(item['price'] for item in sell_book)
                    candidates = [it for it in sell_book if it['price'] == best_price]
                    return min(candidates, key=lambda it: it['time'])
                # Best Price First only
                return min(sell_book, key=lambda it: it['price'])

            # Lặp đến khi còn lệnh và điều kiện giá thoả
            while buy_book and sell_book:
                # Lọc bỏ các lệnh đã hết hàng trước khi khớp
                buy_book = [item for item in buy_book if item['remaining'] > 0]
                sell_book = [item for item in sell_book if item['remaining'] > 0]
                
                # Nếu không còn lệnh nào có hàng thì dừng
                if not buy_book or not sell_book:
                    print(f"[DEBUG] No orders with remaining quantity, stopping matching")
                    break
                
                # Kiểm tra tổng thể: nếu tất cả lệnh đã về 0 thì dừng khớp
                total_buy_remaining = sum(item['remaining'] for item in buy_book)
                total_sell_remaining = sum(item['remaining'] for item in sell_book)
                
                if total_buy_remaining <= 0 or total_sell_remaining <= 0:
                    print(f"[DEBUG] Total remaining: Buy={total_buy_remaining}, Sell={total_sell_remaining}, stopping matching")
                    break
                
                # Kiểm tra chặt chẽ: không cho phép khớp nếu có lệnh về 0
                if any(item['remaining'] <= 0 for item in buy_book) or any(item['remaining'] <= 0 for item in sell_book):
                    print(f"[DEBUG] Found orders with 0 remaining, stopping matching")
                    break
                
                # Kiểm tra bổ sung: không cho phép khớp nếu remaining units <= 0
                buy_book = [item for item in buy_book if item['remaining'] > 0]
                sell_book = [item for item in sell_book if item['remaining'] > 0]
                
                if not buy_book or not sell_book:
                    print(f"[DEBUG] No valid orders remaining after filtering, stopping matching")
                    break
                buy_item = select_best_buy()
                sell_item = select_best_sell()
                if not buy_item or not sell_item:
                    break
                
                # Kiểm tra chặt chẽ: không cho phép khớp nếu lệnh về 0
                if buy_item['remaining'] <= 0 or sell_item['remaining'] <= 0:
                    print(f"[DEBUG] Order at 0: Buy={buy_item['remaining']}, Sell={sell_item['remaining']}, no need to match")
                    # Loại bỏ lệnh đã hết hàng và dừng khớp
                    if buy_item['remaining'] <= 0:
                        try:
                            buy_book.remove(buy_item)
                        except ValueError:
                            pass
                    if sell_item['remaining'] <= 0:
                        try:
                            sell_book.remove(sell_item)
                        except ValueError:
                            pass
                    # Dừng khớp ngay lập tức
                    print(f"[DEBUG] Stopping matching due to zero remaining orders")
                    break
                
                # Bản ghi thực tế
                buy = buy_item['rec']
                sell = sell_item['rec']
                
                # Chỉ khớp cùng fund
                if getattr(buy, 'fund_id', False) and getattr(sell, 'fund_id', False):
                    if buy.fund_id.id != sell.fund_id.id:
                        # Tìm SELL khác cùng fund
                        same_fund_sells = [it for it in sell_book if getattr(it['rec'], 'fund_id', False) and it['rec'].fund_id.id == buy.fund_id.id]
                        if same_fund_sells:
                            # Chọn best trong cùng fund theo rule hiện tại
                            if use_time_priority:
                                best_price = min(item['price'] for item in same_fund_sells)
                                candidates = [it for it in same_fund_sells if it['price'] == best_price]
                                sell_item = min(candidates, key=lambda it: it['time'])
                            else:
                                sell_item = min(same_fund_sells, key=lambda it: it['price'])
                            sell = sell_item['rec']
                        else:
                            # Không có SELL cùng fund -> loại SELL này khỏi consideration và tiếp tục
                            try:
                                sell_book.remove(sell_item)
                            except ValueError:
                                pass
                            continue
                
                # KIỂM TRA: Không được khớp lệnh của cùng một user
                try:
                    if buy.user_id and sell.user_id and buy.user_id.id == sell.user_id.id:
                        # Tìm SELL khác cho BUY hiện tại, ưu tiên FIFO
                        alt = None
                        best_alt_time = None
                        for it in sell_book:
                            if it is sell_item:
                                continue
                            srec = it['rec']
                            if (srec.user_id and buy.user_id and srec.user_id.id != buy.user_id.id and 
                                getattr(srec, 'fund_id', False) and getattr(buy, 'fund_id', False) and 
                                srec.fund_id.id == buy.fund_id.id and 
                                (buy_item['price'] or 0) >= (it['price'] or 0)):
                                
                                # FIFO: Chọn lệnh được đặt sớm nhất
                                if alt is None or it['time'] < best_alt_time:
                                    alt = it
                                    best_alt_time = it['time']
                        
                        if alt is not None:
                            print(f"[DEBUG] Found alternative sell (same user check, FIFO): {alt['rec'].id} time={best_alt_time}")
                            sell_item = alt
                            sell = alt['rec']
                        else:
                            # Không có đối tác phù hợp -> bỏ BUY này khỏi sổ và tiếp tục
                            try:
                                buy_book.remove(buy_item)
                            except ValueError:
                                pass
                            continue
                except Exception:
                    # Nếu không thể kiểm tra user, bỏ qua kiểm tra này
                    pass
                
                # Điều kiện giá BUY >= SELL (người mua sẵn sàng trả giá >= người bán yêu cầu)
                buy_price = buy_item['price'] or 0
                sell_price = sell_item['price'] or 0
                
                print(f"[DEBUG] Matching check: Buy {buy.id} price={buy_price}, Sell {sell.id} price={sell_price}")
                
                if buy_price < sell_price:
                    print(f"[DEBUG] Price mismatch: Buy {buy_price} < Sell {sell_price}, finding alternative sell order")
                    # Tìm lệnh bán khác có giá <= giá mua, ưu tiên FIFO (thời gian sớm nhất)
                    alternative_sell = None
                    best_alt_time = None
                    
                    for alt_item in sell_book:
                        if alt_item is sell_item:
                            continue
                        alt_sell = alt_item['rec']
                        alt_price = alt_item['price'] or 0
                        alt_time = alt_item['time']
                        
                        # Kiểm tra cùng fund, giá phù hợp và không cùng user
                        if (getattr(alt_sell, 'fund_id', False) and getattr(buy, 'fund_id', False) and 
                            alt_sell.fund_id.id == buy.fund_id.id and 
                            buy_price >= alt_price and
                            (not alt_sell.user_id or not buy.user_id or alt_sell.user_id.id != buy.user_id.id)):
                            
                            # FIFO: Chọn lệnh được đặt sớm nhất (thời gian nhỏ nhất)
                            if alternative_sell is None or alt_time < best_alt_time:
                                alternative_sell = alt_item
                                best_alt_time = alt_time
                    
                    if alternative_sell:
                        print(f"[DEBUG] Found alternative sell (FIFO): {alternative_sell['rec'].id} price={alternative_sell['price']} time={best_alt_time}")
                        sell_item = alternative_sell
                        sell = sell_item['rec']
                        sell_price = sell_item['price'] or 0
                    else:
                        print(f"[DEBUG] No alternative sell found, removing buy order")
                        # Không có lệnh bán phù hợp -> loại bỏ lệnh mua
                        try:
                            buy_book.remove(buy_item)
                        except ValueError:
                            pass
                        continue
                
                # Tính số CCQ khớp
                matched_ccq = min(buy_item['remaining'], sell_item['remaining'])
                print(f"[DEBUG] Matched CCQ: {matched_ccq} (Buy remaining: {buy_item['remaining']}, Sell remaining: {sell_item['remaining']})")
                
                if matched_ccq <= 0:
                    print(f"[DEBUG] No CCQ to match, breaking")
                    break
                
                # Xác định loại user dựa trên Internal User
                def is_market_maker(user):
                    if not user:
                        return False
                    return user.has_group('base.group_user')
                
                buy_user_type = 'market_maker' if is_market_maker(getattr(buy, 'user_id', None)) else 'investor'
                sell_user_type = 'market_maker' if is_market_maker(getattr(sell, 'user_id', None)) else 'investor'
                
                # Fallback: chỉ coi 'sale' là market maker, 'portfolio' không còn coi là MM
                buy_source = getattr(buy, 'source', 'portal')
                sell_source = getattr(sell, 'source', 'portal')
                if buy_user_type == 'investor' and buy_source == 'sale':
                    buy_user_type = 'market_maker'
                if sell_user_type == 'investor' and sell_source == 'sale':
                    sell_user_type = 'market_maker'
                
                # Kiểm tra nghiêm ngặt: chỉ tạo matched pair nếu CCQ > 0
                if matched_ccq <= 0:
                    print(f"[DEBUG] Skipping matched pair: CCQ is 0 or negative ({matched_ccq})")
                    continue
                
                # Tạo cặp khớp (giá SELL)
                print(f"[DEBUG] Creating matched pair: Buy {buy.id} ({buy_user_type}) vs Sell {sell.id} ({sell_user_type}), CCQ: {matched_ccq}")
                
                matched_pairs.append({
                    "buy_id": buy.id,
                    "buy_nav": getattr(buy, 'current_nav', 0) or 0,
                    "buy_amount": getattr(buy, 'amount', 0) or 0,
                    "buy_units": getattr(buy, 'units', 0) or 0,
                    "buy_in_time": self._get_order_time(buy),
                    "buy_source": buy_source,
                    "sell_id": sell.id,
                    "sell_nav": getattr(sell, 'current_nav', 0) or 0,
                    "sell_amount": getattr(sell, 'amount', 0) or 0,
                    "sell_units": getattr(sell, 'units', 0) or 0,
                    "sell_in_time": self._get_order_time(sell),
                    "sell_source": sell_source,
                    "matched_price": getattr(sell, 'current_nav', 0) or 0,
                    "matched_volume": matched_ccq,
                    "matched_ccq": matched_ccq,
                    "match_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    "algorithm_used": "Price-Time" if use_time_priority else "Best Price First",
                    "_pairType": f'{buy_user_type}_{sell_user_type}',
                    "_buyUserType": buy_user_type,
                    "_sellUserType": sell_user_type,
                    # Thêm các field bị thiếu
                    "fund_name": buy.fund_id.name if buy.fund_id else 'N/A',
                    "buy_investor": buy.user_id.partner_id.name if buy.user_id and buy.user_id.partner_id else 'N/A',
                    "sell_investor": sell.user_id.partner_id.name if sell.user_id and sell.user_id.partner_id else 'N/A',
                    "interest_rate": getattr(buy, 'interest_rate', 0) or 0,
                    "term_months": getattr(buy, 'term_months', 0) or 0
                })

                # Cập nhật phần còn lại trong sổ lệnh
                old_buy_remaining = buy_item['remaining']
                old_sell_remaining = sell_item['remaining']
                
                print(f"[DEBUG] Before match - Buy {buy.id}: {old_buy_remaining}, Sell {sell.id}: {old_sell_remaining}")
                print(f"[DEBUG] Matched CCQ: {matched_ccq}")
                
                # Cập nhật trực tiếp vào database để đảm bảo đồng bộ
                try:
                    buy_order = self.env['portfolio.transaction'].browse(buy.id)
                    sell_order = self.env['portfolio.transaction'].browse(sell.id)
                    
                    # Lấy thông tin hiện tại
                    buy_total = buy_order.units or 0
                    sell_total = sell_order.units or 0
                    current_buy_matched = buy_order.matched_units or 0
                    current_sell_matched = sell_order.matched_units or 0
                    
                    print(f"[DEBUG] Database update - BEFORE:")
                    print(f"[DEBUG] Buy {buy.id}: total={buy_total}, current_matched={current_buy_matched}, new_match={matched_ccq}")
                    print(f"[DEBUG] Sell {sell.id}: total={sell_total}, current_matched={current_sell_matched}, new_match={matched_ccq}")
                    
                    # Tính toán chính xác - cập nhật remaining_units trực tiếp
                    buy_remaining = max(0, buy_total - current_buy_matched - matched_ccq)
                    sell_remaining = max(0, sell_total - current_sell_matched - matched_ccq)
                    
                    # Tính matched_units mới
                    buy_matched = current_buy_matched + matched_ccq
                    sell_matched = current_sell_matched + matched_ccq
                    
                    # Đảm bảo không vượt quá tổng số CCQ
                    buy_matched = min(buy_matched, buy_total)
                    sell_matched = min(sell_matched, sell_total)
                    
                    # Cập nhật database
                    buy_order.sudo().write({
                        'matched_units': buy_matched,
                        'remaining_units': buy_remaining,
                        'is_matched': buy_remaining <= 0,
                        'status': 'completed' if buy_remaining <= 0 else 'pending'
                    })
                    
                    sell_order.sudo().write({
                        'matched_units': sell_matched,
                        'remaining_units': sell_remaining,
                        'is_matched': sell_remaining <= 0,
                        'status': 'completed' if sell_remaining <= 0 else 'pending'
                    })
                    
                    print(f"[DEBUG] Database update - AFTER:")
                    print(f"[DEBUG] Buy {buy.id}: matched={buy_matched}, remaining={buy_remaining}")
                    print(f"[DEBUG] Sell {sell.id}: matched={sell_matched}, remaining={sell_remaining}")
                    
                except Exception as e:
                    print(f"[ERROR] Failed to update database: {str(e)}")

                # Cập nhật remaining trong sổ lệnh để tiếp tục khớp (đồng bộ với database)
                buy_item['remaining'] = buy_remaining
                sell_item['remaining'] = sell_remaining
                
                print(f"[DEBUG] Updated remaining in book after match:")
                print(f"[DEBUG] Buy {buy.id}: {old_buy_remaining} -> {buy_item['remaining']} (matched: {matched_ccq})")
                print(f"[DEBUG] Sell {sell.id}: {old_sell_remaining} -> {sell_item['remaining']} (matched: {matched_ccq})")
                
                # Loại khỏi sổ khi đã hết hàng (remaining = 0)
                if buy_item['remaining'] <= 0:
                    print(f"[DEBUG] Removing buy order {buy.id} from book (remaining: {buy_item['remaining']})")
                    try:
                        buy_book.remove(buy_item)
                    except ValueError:
                        pass
                if sell_item['remaining'] <= 0:
                    print(f"[DEBUG] Removing sell order {sell.id} from book (remaining: {sell_item['remaining']})")
                    try:
                        sell_book.remove(sell_item)
                    except ValueError:
                        pass
                
                # Nếu lệnh mua còn hàng, tiếp tục tìm lệnh bán khác để khớp
                if buy_item['remaining'] > 0:
                    print(f"[DEBUG] Buy order {buy.id} still has {buy_item['remaining']} remaining, looking for more sell orders")
                    
                    # Lọc lại sell_book để loại bỏ lệnh đã hết hàng
                    sell_book = [item for item in sell_book if item['remaining'] > 0]
                    
                    # Kiểm tra chặt chẽ: không cho phép khớp nếu có lệnh về 0
                    if any(item['remaining'] <= 0 for item in sell_book):
                        print(f"[DEBUG] Found sell orders with 0 remaining, stopping continuous matching")
                        break
                    
                    # Kiểm tra nếu không còn lệnh bán nào có hàng
                    if not sell_book:
                        print(f"[DEBUG] No more sell orders with remaining quantity, stopping continuous matching")
                        break
                    # Tìm lệnh bán khác cùng fund và user khác
                    for alt_sell_item in sell_book:
                        if alt_sell_item is sell_item:
                            continue
                        alt_sell = alt_sell_item['rec']
                        alt_sell_price = alt_sell_item['price'] or 0
                        
                        # Kiểm tra điều kiện khớp
                        if (getattr(alt_sell, 'fund_id', False) and getattr(buy, 'fund_id', False) and 
                            alt_sell.fund_id.id == buy.fund_id.id and 
                            buy_item['price'] >= alt_sell_price and
                            alt_sell_item['remaining'] > 0 and
                            (not alt_sell.user_id or not buy.user_id or alt_sell.user_id.id != buy.user_id.id)):
                            
                            # Khớp với lệnh bán khác
                            additional_matched = min(buy_item['remaining'], alt_sell_item['remaining'])
                            print(f"[DEBUG] Additional match: Buy {buy.id} with Sell {alt_sell.id}, CCQ: {additional_matched}")
                            
                            # Cập nhật database cho khớp liên tục
                            try:
                                buy_order = self.env['portfolio.transaction'].browse(buy.id)
                                alt_sell_order = self.env['portfolio.transaction'].browse(alt_sell.id)
                                
                                # Lấy thông tin hiện tại
                                buy_total = buy_order.units or 0
                                alt_sell_total = alt_sell_order.units or 0
                                current_buy_matched = buy_order.matched_units or 0
                                current_alt_sell_matched = alt_sell_order.matched_units or 0
                                
                                # Tính toán remaining mới
                                buy_remaining = max(0, buy_total - current_buy_matched - additional_matched)
                                alt_sell_remaining = max(0, alt_sell_total - current_alt_sell_matched - additional_matched)
                                
                                # Tính matched_units mới
                                buy_matched = current_buy_matched + additional_matched
                                alt_sell_matched = current_alt_sell_matched + additional_matched
                                
                                # Cập nhật database
                                buy_order.sudo().write({
                                    'matched_units': buy_matched,
                                    'remaining_units': buy_remaining,
                                    'is_matched': buy_remaining <= 0,
                                    'status': 'completed' if buy_remaining <= 0 else 'pending'
                                })
                                
                                alt_sell_order.sudo().write({
                                    'matched_units': alt_sell_matched,
                                    'remaining_units': alt_sell_remaining,
                                    'is_matched': alt_sell_remaining <= 0,
                                    'status': 'completed' if alt_sell_remaining <= 0 else 'pending'
                                })
                                
                                print(f"[DEBUG] Continuous match database update:")
                                print(f"[DEBUG] Buy {buy.id}: matched={buy_matched}, remaining={buy_remaining}")
                                print(f"[DEBUG] Sell {alt_sell.id}: matched={alt_sell_matched}, remaining={alt_sell_remaining}")
                                
                            except Exception as e:
                                print(f"[ERROR] Failed to update database for continuous match: {str(e)}")
                            
                            # Cập nhật remaining trong sổ lệnh
                            buy_item['remaining'] = buy_remaining
                            alt_sell_item['remaining'] = alt_sell_remaining
                            
                            # Kiểm tra nếu additional_matched > 0 mới tạo matched pair
                            if additional_matched > 0:
                                # Tạo matched pair mới
                                matched_pairs.append({
                                    "buy_id": buy.id,
                                    "sell_id": alt_sell.id,
                                    "matched_ccq": additional_matched,
                                    "matched_price": alt_sell_price,
                                    "match_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                    "algorithm_used": "Continuous Matching",
                                    # Thêm các field bị thiếu
                                    "fund_name": buy.fund_id.name if buy.fund_id else 'N/A',
                                    "buy_investor": buy.user_id.partner_id.name if buy.user_id and buy.user_id.partner_id else 'N/A',
                                    "sell_investor": alt_sell.user_id.partner_id.name if alt_sell.user_id and alt_sell.user_id.partner_id else 'N/A',
                                    "buy_nav": getattr(buy, 'current_nav', 0) or 0,
                                    "sell_nav": getattr(alt_sell, 'current_nav', 0) or 0,
                                    "buy_units": getattr(buy, 'units', 0) or 0,
                                    "sell_units": getattr(alt_sell, 'units', 0) or 0,
                                    "buy_in_time": self._get_order_time(buy),
                                    "sell_in_time": self._get_order_time(alt_sell)
                                })
                            else:
                                print(f"[DEBUG] Skipping continuous matched pair: CCQ is 0 or negative")
                            
                            # Loại bỏ lệnh bán nếu hết hàng
                            if alt_sell_item['remaining'] <= 0:
                                try:
                                    sell_book.remove(alt_sell_item)
                                except ValueError:
                                    pass
                            
                            # Nếu lệnh mua hết hàng, thoát khỏi vòng lặp
                            if buy_item['remaining'] <= 0:
                                break
                
                # Nếu lệnh bán còn hàng, tiếp tục tìm lệnh mua khác để khớp
                if sell_item['remaining'] > 0:
                    print(f"[DEBUG] Sell order {sell.id} still has {sell_item['remaining']} remaining, looking for more buy orders")
                    
                    # Lọc lại buy_book để loại bỏ lệnh đã hết hàng
                    buy_book = [item for item in buy_book if item['remaining'] > 0]
                    
                    # Kiểm tra chặt chẽ: không cho phép khớp nếu có lệnh về 0
                    if any(item['remaining'] <= 0 for item in buy_book):
                        print(f"[DEBUG] Found buy orders with 0 remaining, stopping continuous matching")
                        break
                    
                    # Kiểm tra nếu không còn lệnh mua nào có hàng
                    if not buy_book:
                        print(f"[DEBUG] No more buy orders with remaining quantity, stopping continuous matching")
                        break
                    # Tìm lệnh mua khác cùng fund và user khác
                    for alt_buy_item in buy_book:
                        if alt_buy_item is buy_item:
                            continue
                        alt_buy = alt_buy_item['rec']
                        alt_buy_price = alt_buy_item['price'] or 0
                        
                        # Kiểm tra điều kiện khớp
                        if (getattr(alt_buy, 'fund_id', False) and getattr(sell, 'fund_id', False) and 
                            alt_buy.fund_id.id == sell.fund_id.id and 
                            alt_buy_price >= sell_item['price'] and
                            alt_buy_item['remaining'] > 0 and
                            (not alt_buy.user_id or not sell.user_id or alt_buy.user_id.id != sell.user_id.id)):
                            
                            # Khớp với lệnh mua khác
                            additional_matched = min(sell_item['remaining'], alt_buy_item['remaining'])
                            print(f"[DEBUG] Additional match: Sell {sell.id} with Buy {alt_buy.id}, CCQ: {additional_matched}")
                            
                            # Cập nhật database cho khớp liên tục
                            try:
                                sell_order = self.env['portfolio.transaction'].browse(sell.id)
                                alt_buy_order = self.env['portfolio.transaction'].browse(alt_buy.id)
                                
                                # Lấy thông tin hiện tại
                                sell_total = sell_order.units or 0
                                alt_buy_total = alt_buy_order.units or 0
                                current_sell_matched = sell_order.matched_units or 0
                                current_alt_buy_matched = alt_buy_order.matched_units or 0
                                
                                # Tính toán remaining mới
                                sell_remaining = max(0, sell_total - current_sell_matched - additional_matched)
                                alt_buy_remaining = max(0, alt_buy_total - current_alt_buy_matched - additional_matched)
                                
                                # Tính matched_units mới
                                sell_matched = current_sell_matched + additional_matched
                                alt_buy_matched = current_alt_buy_matched + additional_matched
                                
                                # Cập nhật database
                                sell_order.sudo().write({
                                    'matched_units': sell_matched,
                                    'remaining_units': sell_remaining,
                                    'is_matched': sell_remaining <= 0,
                                    'status': 'completed' if sell_remaining <= 0 else 'pending'
                                })
                                
                                alt_buy_order.sudo().write({
                                    'matched_units': alt_buy_matched,
                                    'remaining_units': alt_buy_remaining,
                                    'is_matched': alt_buy_remaining <= 0,
                                    'status': 'completed' if alt_buy_remaining <= 0 else 'pending'
                                })
                                
                                print(f"[DEBUG] Continuous match database update:")
                                print(f"[DEBUG] Sell {sell.id}: matched={sell_matched}, remaining={sell_remaining}")
                                print(f"[DEBUG] Buy {alt_buy.id}: matched={alt_buy_matched}, remaining={alt_buy_remaining}")
                                
                            except Exception as e:
                                print(f"[ERROR] Failed to update database for continuous match: {str(e)}")
                            
                            # Cập nhật remaining trong sổ lệnh
                            sell_item['remaining'] = sell_remaining
                            alt_buy_item['remaining'] = alt_buy_remaining
                            
                            # Kiểm tra nếu additional_matched > 0 mới tạo matched pair
                            if additional_matched > 0:
                                # Tạo matched pair mới
                                matched_pairs.append({
                                    "buy_id": alt_buy.id,
                                    "sell_id": sell.id,
                                    "matched_ccq": additional_matched,
                                    "matched_price": sell_item['price'],
                                    "match_time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                    "algorithm_used": "Continuous Matching",
                                    # Thêm các field bị thiếu
                                    "fund_name": sell.fund_id.name if sell.fund_id else 'N/A',
                                    "buy_investor": alt_buy.user_id.partner_id.name if alt_buy.user_id and alt_buy.user_id.partner_id else 'N/A',
                                    "sell_investor": sell.user_id.partner_id.name if sell.user_id and sell.user_id.partner_id else 'N/A',
                                    "buy_nav": getattr(alt_buy, 'current_nav', 0) or 0,
                                    "sell_nav": getattr(sell, 'current_nav', 0) or 0,
                                    "buy_units": getattr(alt_buy, 'units', 0) or 0,
                                    "sell_units": getattr(sell, 'units', 0) or 0,
                                    "buy_in_time": self._get_order_time(alt_buy),
                                    "sell_in_time": self._get_order_time(sell)
                                })
                            else:
                                print(f"[DEBUG] Skipping continuous matched pair: CCQ is 0 or negative")
                            
                            # Loại bỏ lệnh mua nếu hết hàng
                            if alt_buy_item['remaining'] <= 0:
                                try:
                                    buy_book.remove(alt_buy_item)
                                except ValueError:
                                    pass
                            
                            # Nếu lệnh bán hết hàng, thoát khỏi vòng lặp
                            if sell_item['remaining'] <= 0:
                                break
            
            # Lọc bỏ các matched pairs có giá trị 0 hoặc không hợp lệ
            valid_matched_pairs = []
            for pair in matched_pairs:
                matched_ccq = pair.get('matched_ccq', 0) or pair.get('matched_volume', 0) or 0
                buy_id = pair.get('buy_id', 0)
                sell_id = pair.get('sell_id', 0)
                
                # Kiểm tra nghiêm ngặt: CCQ > 0, có buy_id và sell_id hợp lệ
                if matched_ccq > 0 and buy_id > 0 and sell_id > 0:
                    valid_matched_pairs.append(pair)
                    print(f"[DEBUG] Valid matched pair: Buy {buy_id} vs Sell {sell_id}, CCQ: {matched_ccq}")
                else:
                    print(f"[DEBUG] Filtering out invalid matched pair: CCQ={matched_ccq}, Buy={buy_id}, Sell={sell_id}")
            
            print(f"[DEBUG] Filtered matched pairs: {len(matched_pairs)} -> {len(valid_matched_pairs)}")
            
            return {
                "matched_pairs": valid_matched_pairs,
                "remaining_buys": pending_purchases,
                "remaining_sells": pending_sells,
                "algorithm_used": "FIFO" if use_time_priority else "Best Price First",
                "warnings": warnings  # Thêm warnings vào response
            }
            
        except Exception as e:
            print(f"Error in match_orders: {e}")
            return {
                "matched_pairs": [],
                "remaining_buys": buy_orders,
                "remaining_sells": sell_orders,
                "algorithm_used": "FIFO" if use_time_priority else "Best Price First",
                "warnings": []  # Thêm warnings cho exception case
            }
    
    def _get_earliest_order(self, orders):
        """Lấy lệnh được đặt sớm nhất từ danh sách"""
        if not orders:
            return None
        
        # Sắp xếp theo thời gian tạo (sớm nhất trước)
        sorted_orders = sorted(orders, key=lambda x: self._get_order_time(x))
        return sorted_orders[0]
    
    def _get_order_time(self, order):
        """Lấy thời gian đặt lệnh từ order object và trả về string"""
        # Thử các trường thời gian có thể có
        time_fields = ['create_date', 'created_at', 'order_time', 'in_time']
        
        for field in time_fields:
            if hasattr(order, field):
                time_value = getattr(order, field)
                if time_value:
                    try:
                        # Đảm bảo luôn trả về string
                        if hasattr(time_value, 'strftime'):
                            return time_value.strftime('%Y-%m-%d %H:%M:%S')
                        else:
                            return str(time_value)
                    except Exception:
                        # Nếu có lỗi, chuyển thành string
                        return str(time_value)
        
        # Nếu không tìm thấy, trả về thời gian hiện tại
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


class FundCalcIntegrationController(http.Controller):
    """Controller tích hợp với Fund Calculation Engine"""
    
    def _is_market_maker(self, transaction):
        """Kiểm tra xem transaction có phải là market maker không"""
        try:
            # Kiểm tra user có phải là internal user (market maker) không
            if transaction.user_id and transaction.user_id.has_group('base.group_user'):
                return True
            # Kiểm tra source có phải là 'sale' không (market maker)
            if hasattr(transaction, 'source') and transaction.source == 'sale':
                return True
            # Kiểm tra user_type có chứa 'market_maker' không
            if hasattr(transaction, 'user_type') and 'market_maker' in str(transaction.user_type):
                return True
            return False
        except Exception:
            return False
    
    def _get_nav_average_price_from_nav_management(self, fund_id):
        """Lấy giá trung bình NAV đầu ngày từ nav_management module qua API"""
        try:
            from datetime import datetime
            import requests
            import json
            
            # Lấy ngày hiện tại
            today = datetime.now().date()
            
            # Gọi API nav_management để lấy giá trung bình NAV đầu ngày
            api_url = f"{request.httprequest.host_url.rstrip('/')}/nav_management/api/opening_price_today_http"
            
            payload = {
                'fund_id': fund_id,
                'inventory_date': today.isoformat()
            }
            
            headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
            
            # Gọi API
            # Sử dụng GET HTTP đơn giản
            response = requests.get(api_url, params={'fund_id': payload['params']['fund_id']}, timeout=10)
            try:
                data = response.json()
            except Exception:
                data = {'success': False}

            opening_price = 0
            if data and data.get('success'):
                d = data.get('data') or {}
                opening_price = d.get('opening_avg_price', 0)
            else:
                print(f"[WARNING] API trả về lỗi: {data.get('message', 'Unknown error')}")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    opening_price = data.get('average_nav_price', 0)
                    print(f"[DEBUG] Lấy giá trung bình NAV đầu ngày từ API: {opening_price}")
                    return opening_price
                else:
                    print(f"[WARNING] API trả về lỗi: {data.get('message', 'Unknown error')}")
            else:
                print(f"[WARNING] API call failed với status: {response.status_code}")
                
        except Exception as e:
            print(f"[ERROR] Lỗi gọi API nav_management cho fund {fund_id}: {e}")
            
        # Fallback: lấy NAV từ fund
        try:
            fund = request.env['portfolio.fund'].browse(fund_id)
            fallback_price = fund.current_nav or 0.0
            print(f"[DEBUG] Fallback giá NAV từ fund: {fallback_price}")
            return fallback_price
        except Exception as e:
            print(f"[ERROR] Fallback cũng thất bại: {e}")
            return 0.0
    
    def _calculate_daily_average_price(self, fund_id):
        """Tính giá trung bình cuối ngày cho một quỹ
        
        Công thức: (giá Tồn kho * số CCQ_tồn + giá mua * số CCQ1 + giá mua * số CCQ2 - giá bán * CCQ bán 1) / (CCQ Tồn + CCQ mua - CCQ bán)
        
        Trong đó:
        - Giá Tồn kho: NAV hiện tại của quỹ
        - Số CCQ_tồn: Tổng số CCQ tồn kho đầu ngày
        - Giá mua * số CCQ: Tổng giá trị các lệnh mua trong ngày
        - Giá bán * CCQ bán: Tổng giá trị các lệnh bán trong ngày
        """
        try:
            fund = request.env['portfolio.fund'].sudo().browse(fund_id)
            if not fund:
                return 0.0
            
            # Lấy tất cả giao dịch pending của quỹ trong ngày (lệnh chờ khớp)
            today = datetime.now().date()
            pending_transactions = request.env['portfolio.transaction'].sudo().search([
                ('fund_id', '=', fund_id),
                ('status', '=', 'pending'),
                ('create_date', '>=', today.strftime('%Y-%m-%d 00:00:00')),
                ('create_date', '<=', today.strftime('%Y-%m-%d 23:59:59'))
            ])
            
            # Giá tồn kho = NAV hiện tại của quỹ
            stock_price = fund.current_nav or 0.0
            
            # Số CCQ tồn kho = Tổng CCQ hiện tại của quỹ (có thể lấy từ total_units hoặc tính từ các giao dịch completed)
            # Nếu không có trường total_units, tính từ các giao dịch completed
            stock_ccq = getattr(fund, 'total_units', 0) or 0
            
            # Nếu không có total_units, tính từ giao dịch completed
            if stock_ccq == 0:
                # Lấy tất cả giao dịch completed từ đầu ngày đến hiện tại
                completed_today = request.env['portfolio.transaction'].sudo().search([
                    ('fund_id', '=', fund_id),
                    ('status', '=', 'completed'),
                    ('create_date', '>=', today.strftime('%Y-%m-%d 00:00:00')),
                    ('create_date', '<=', today.strftime('%Y-%m-%d 23:59:59'))
                ])
                
                # Tính CCQ tồn từ giao dịch completed
                for tx in completed_today:
                    matched_units = tx.matched_units or 0
                    if tx.transaction_type == 'purchase':
                        stock_ccq += matched_units
                    elif tx.transaction_type == 'sell':
                        stock_ccq -= matched_units
                
                # Đảm bảo CCQ tồn không âm và có giá trị tối thiểu
                stock_ccq = max(stock_ccq, 1.0)  # Tối thiểu 1 CCQ để tránh chia cho 0
            
            # Tính tổng mua và bán từ các lệnh pending
            total_buy_value = 0.0  # Tổng giá trị mua
            total_buy_ccq = 0.0    # Tổng số CCQ mua
            total_sell_value = 0.0 # Tổng giá trị bán
            total_sell_ccq = 0.0   # Tổng số CCQ bán
            
            for tx in pending_transactions:
                tx_price = tx.current_nav or 0.0
                tx_units = tx.units or 0.0
                
                if tx.transaction_type == 'purchase':
                    total_buy_value += tx_price * tx_units
                    total_buy_ccq += tx_units
                elif tx.transaction_type == 'sell':
                    total_sell_value += tx_price * tx_units
                    total_sell_ccq += tx_units
            
            # Áp dụng công thức: (giá Tồn kho * số CCQ_tồn + giá mua * số CCQ1 + giá mua * số CCQ2 - giá bán * CCQ bán 1) / (CCQ Tồn + CCQ mua - CCQ bán)
            numerator = (stock_price * stock_ccq) + total_buy_value - total_sell_value
            denominator = stock_ccq + total_buy_ccq - total_sell_ccq
            
            print(f"[DEBUG] Tính giá trung bình cuối ngày cho quỹ {fund_id}:")
            print(f"  - Giá tồn kho: {stock_price}")
            print(f"  - CCQ tồn: {stock_ccq}")
            print(f"  - Tổng giá trị mua: {total_buy_value}")
            print(f"  - Tổng CCQ mua: {total_buy_ccq}")
            print(f"  - Tổng giá trị bán: {total_sell_value}")
            print(f"  - Tổng CCQ bán: {total_sell_ccq}")
            print(f"  - Tử số: {numerator}")
            print(f"  - Mẫu số: {denominator}")
            
            if denominator > 0:
                daily_avg_price = numerator / denominator
                result = round(daily_avg_price, 2)
                print(f"  - Kết quả: {result}")
                return result
            else:
                # Fallback về current_nav nếu không tính được
                fallback_price = fund.current_nav or 0.0
                print(f"  - Fallback về current_nav: {fallback_price}")
                return fallback_price
                
        except Exception as e:
            print(f"Lỗi tính giá trung bình cuối ngày: {e}")
            # Fallback về current_nav
            try:
                fund = request.env['portfolio.fund'].sudo().browse(fund_id)
                return fund.current_nav if fund else 0.0
            except:
                return 0.0
    

    # ==== API TẠO RANDOM TRANSACTIONS VỚI THỜI GIAN KHÁC NHAU ====
    @http.route('/api/transaction-list/create-random', type='http', auth='user', methods=['POST'], csrf=False)
    def create_random_transactions(self, **kwargs):
        """Tạo random transactions với thời gian hoàn toàn ngẫu nhiên để test FIFO"""
        print("=== CREATE RANDOM TRANSACTIONS WITH DIFFERENT TIMES ===")
        
        try:
            import random
            from datetime import datetime, timedelta
            # Chọn một portal user khác với user đang đăng nhập để test market maker
            try:
                portal_group = request.env.ref('base.group_portal')
            except Exception:
                portal_group = False
            try:
                internal_group = request.env.ref('base.group_user')
            except Exception:
                internal_group = False

            portal_users = []
            if portal_group:
                domain = [
                    ('groups_id', 'in', portal_group.id)
                ]
                # Loại trừ interface users (Internal Users)
                if internal_group:
                    domain.append(('groups_id', 'not in', internal_group.id))
                portal_users = request.env['res.users'].sudo().search(domain, limit=10)

            if not portal_users:
                return request.make_response(
                    json.dumps({
                        "success": False,
                        "message": "Không tìm thấy portal user hợp lệ (không phải interface user) để tạo giao dịch thử nghiệm. Vui lòng tạo portal user thuần để test."
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            transactions = []
            
            # Tạo base time (hiện tại)
            base_time = datetime.now()
            
            # Lấy danh sách fund có sẵn
            funds = request.env['portfolio.fund'].sudo().search([('status', '=', 'active')])
            if not funds:
                return request.make_response(
                    json.dumps({
                        "success": False,
                        "message": "Không có fund nào active để tạo giao dịch"
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            # Tạo 12 giao dịch với logic thông minh để test NAV calculation
            # Đảm bảo mỗi fund có đủ lệnh để test tính lãi với chặn trên dưới
            # Tạo 6 cặp giao dịch (mua-bán) từ các user khác nhau với NAV khác nhau
            for i in range(6):
                # Tạo cặp giao dịch: 1 mua + 1 bán từ user khác nhau
                for j, transaction_type in enumerate(['purchase', 'sell']):
                    # Tạo số lượng CCQ theo bội số 50 (50, 100, 150, 200, 250, 300, 350, 400, 450, 500)
                    random_multiplier = random.randint(1, 10)  # 1-10
                    units = 50 * random_multiplier  # 50, 100, 150, 200, 250, 300, 350, 400, 450, 500
                    
                    # Chọn fund để đảm bảo mỗi fund có đủ lệnh để test tính lãi
                    # Phân bố đều các fund để có đủ dữ liệu test
                    selected_fund = funds[i % len(funds)]  # Phân bố đều theo index
                    
                    # Logic mới: Cả lệnh mua và bán đều dùng logic NTL, nhưng lệnh bán có giao động
                    # Lấy giá tồn kho đầu ngày và chi phí vốn (dùng chung cho cả mua và bán)
                    try:
                        # Lấy giá tồn kho đầu ngày (opening_avg_price)
                        Inventory = request.env['nav.daily.inventory'].sudo()
                        today = fields.Date.today()
                        opening_price = 0.0
                        
                        # Tìm tồn kho hôm nay
                        inv_today = Inventory.search([('fund_id', '=', selected_fund.id), ('inventory_date', '=', today)], limit=1)
                        if inv_today and inv_today.opening_avg_price:
                            opening_price = inv_today.opening_avg_price
                        else:
                            # Fallback: tồn kho gần nhất
                            inv_prev = Inventory.search([('fund_id', '=', selected_fund.id), ('inventory_date', '<', today)], order='inventory_date desc', limit=1)
                            if inv_prev and inv_prev.closing_avg_price:
                                opening_price = inv_prev.closing_avg_price
                            else:
                                # Fallback: cấu hình fund
                                cfg = request.env['nav.fund.config'].sudo().search([('fund_id', '=', selected_fund.id), ('active', '=', True)], limit=1)
                                opening_price = cfg.initial_nav_price if cfg else (selected_fund.current_nav or 10000)
                    except Exception:
                        opening_price = selected_fund.current_nav or 10000
                    
                    # Lấy chi phí vốn của quỹ
                    try:
                        fund_config = request.env['nav.fund.config'].sudo().search([
                            ('fund_id', '=', selected_fund.id)
                        ], limit=1)
                        
                        if fund_config and fund_config.capital_cost_percent:
                            capital_cost_percent = fund_config.capital_cost_percent
                        else:
                            capital_cost_percent = 1.0  # Fallback 1%
                    except Exception:
                        capital_cost_percent = 1.0  # Fallback 1%
                    
                    # Tính giá NTL cơ bản: Giá tồn kho đầu ngày * (1 + chi phí vốn%)
                    ntl_base_price = opening_price * (1 + capital_cost_percent / 100)
                    
                    if transaction_type == 'purchase':
                        # Lệnh mua: dùng giá NTL cố định
                        current_nav = mround(ntl_base_price, 50)
                        variation_percent = capital_cost_percent / 100
                    else:
                        # Lệnh bán: dùng giá NTL + giao động -15% đến +15%
                        variation_percent = random.uniform(-0.15, 0.15)  # -15% đến +15%
                        current_nav_raw = ntl_base_price * (1 + variation_percent)
                        current_nav = mround(current_nav_raw, 50)
                    if transaction_type == 'purchase':
                        print(f"[DEBUG] Fund: {selected_fund.name}, Opening Price: {opening_price}, Capital Cost: {capital_cost_percent}%, NTL Base: {ntl_base_price}, Generated NAV: {current_nav}, Transaction: {transaction_type}, Pair: {i+1}")
                    else:
                        print(f"[DEBUG] Fund: {selected_fund.name}, NTL Base: {ntl_base_price}, Variation: {variation_percent:.1%}, Generated NAV: {current_nav}, Transaction: {transaction_type}, Pair: {i+1}")
                    print(f"[DEBUG] Units: {units}, Amount: {units * current_nav:,.0f}")
                    amount = units * current_nav
                    
                    # Tạo thời gian với FIFO logic
                    if transaction_type == 'purchase':
                        # Lệnh mua: thời gian sớm hơn (0-5 phút trước)
                        time_offset = random.randint(0, 5)
                    else:
                        # Lệnh bán: thời gian muộn hơn (5-15 phút trước)
                        time_offset = random.randint(5, 15)
                    
                    created_time = base_time - timedelta(minutes=time_offset)
                    
                    # Chọn user khác nhau cho mua và bán
                    if transaction_type == 'purchase':
                        selected_user = portal_users[i % len(portal_users)]
                    else:
                        # Lệnh bán từ user khác
                        selected_user = portal_users[(i + 1) % len(portal_users)]
                    
                    # Chọn kỳ hạn và lãi suất: ưu tiên lấy từ cấu hình nav.term.rate (active), fallback bảng cứng
                    term_months = random.randint(1, 12)
                    interest_rate = None
                    try:
                        TermRate = request.env['nav.term.rate'].sudo()
                        rate = TermRate.search([('active', '=', True), ('term_months', '=', term_months)], limit=1)
                        if rate:
                            interest_rate = rate.interest_rate
                    except Exception:
                        interest_rate = None
                    if interest_rate is None:
                        fallback_map = {1:4.80,2:5.80,3:6.20,4:6.50,5:7.00,6:7.70,7:8.00,8:8.50,9:8.60,10:8.70,11:8.90,12:9.1}
                        interest_rate = fallback_map.get(term_months)

                    transaction = request.env['portfolio.transaction'].sudo().create({
                        'user_id': selected_user.id,
                        'fund_id': selected_fund.id,
                        'transaction_type': transaction_type,
                        'units': units,
                        'price': current_nav,  # Thêm trường price = current_nav
                        'amount': amount,
                        'current_nav': current_nav,  # Lưu NAV dao động vào transaction
                        'matched_units': 0,  # Khởi tạo số lượng khớp = 0
                        'created_at': created_time,
                        'contract_pdf_path': f"random_{transaction_type}_{i+1}_{j+1}.pdf",
                        'status': 'pending',
                        'source': 'portfolio',
                        'term_months': term_months,
                        'interest_rate': interest_rate,
                    })
                    
                    transactions.append({
                        "id": transaction.id,
                        "type": transaction_type,
                        "fund_name": selected_fund.name,
                        "fund_ticker": selected_fund.ticker,
                        "units": units,
                        "price": current_nav,  # Thêm trường price
                        "base_nav": selected_fund.current_nav or 10000,
                        "current_nav": current_nav,
                        "variation_percent": round(variation_percent * 100, 2),
                        "amount": amount,
                        "created_at": created_time.strftime('%Y-%m-%d %H:%M:%S'),
                            "term_months": term_months,
                        "interest_rate": interest_rate
                    })
            
            # Sắp xếp theo thời gian để hiển thị
            transactions.sort(key=lambda x: x['created_at'])
            
            return request.make_response(
                json.dumps({
                    "success": True,
                    "message": f"Đã tạo {len(transactions)} giao dịch ngẫu nhiên từ {len(funds)} fund active. Cả lệnh mua và bán đều dùng logic NTL, lệnh bán có giao động -15% đến +15% so với giá NTL",
                    "transactions": transactions,
                    "funds_used": [{"id": f.id, "name": f.name, "ticker": f.ticker, "current_nav": f.current_nav} for f in funds],
                    "created_for_users": [{"id": u.id, "name": u.name} for u in portal_users],
                    "note": "Giao dịch được sắp xếp theo thời gian tạo để dễ theo dõi FIFO. Cả lệnh mua và bán đều dùng logic NTL (giá tồn kho đầu ngày * chi phí vốn), lệnh bán có giao động -15% đến +15% so với giá NTL."
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")]
            )
            
        except Exception as e:
            print("LỖI:", str(e))
            import traceback
            traceback.print_exc()
            return request.make_response(
                json.dumps({"success": False, "message": str(e)}, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )


    # ==== API KHỚP LỆNH RIÊNG ====
    @http.route('/api/transaction-list/match-orders', type='http', auth='user', methods=['POST'], csrf=False)
    def match_transactions(self, **kwargs):
        """Khớp lệnh giao dịch sử dụng engine riêng"""
        print("=== MATCH TRANSACTIONS USING OWN ENGINE ===")
        
        try:
            Transaction = request.env['portfolio.transaction'].sudo()
            
            # Đọc tham số từ JSON body (nếu có)
            try:
                data = request.jsonrequest or {}
            except Exception:
                data = {}
            status_mode = data.get('status_mode', 'auto')  # 'pending' | 'completed' | 'auto'
            use_time_priority = data.get('use_time_priority', False)
            fund_id = data.get('fund_id')
            match_type = data.get('match_type', 'all')  # 'investor_investor' | 'market_maker_investor' | 'all'
            
            # Xây dựng domain theo chế độ trạng thái - KHÔNG lọc theo fund_id để khớp tất cả lệnh
            def _build_domains(mode):
                if mode == 'completed':
                    buy_domain = [('transaction_type', '=', 'purchase'), ('status', '=', 'completed'), ('remaining_units', '>', 0)]
                    sell_domain = [('transaction_type', '=', 'sell'), ('status', '=', 'completed'), ('remaining_units', '>', 0)]
                else:  # pending
                    buy_domain = [('transaction_type', '=', 'purchase'), ('status', '=', 'pending')]
                    sell_domain = [('transaction_type', '=', 'sell'), ('status', '=', 'pending')]
                # Bỏ lọc theo fund_id để khớp tất cả lệnh cùng lúc
                # if fund_id:
                #     buy_domain.append(('fund_id', '=', int(fund_id)))
                #     sell_domain.append(('fund_id', '=', int(fund_id)))
                return buy_domain, sell_domain
            
            # Lấy các lệnh theo mode
            buy_domain, sell_domain = _build_domains('pending' if status_mode == 'pending' else 'pending')
            pending_purchases = Transaction.search(buy_domain)
            pending_sells = Transaction.search(sell_domain)
            
            print(f"[DEBUG] Found {len(pending_purchases)} buy orders and {len(pending_sells)} sell orders to match")
            buy_orders_info = [f'ID:{tx.id} Fund:{tx.fund_id.name if tx.fund_id else "N/A"} Remaining:{tx.remaining_units}' for tx in pending_purchases]
            sell_orders_info = [f'ID:{tx.id} Fund:{tx.fund_id.name if tx.fund_id else "N/A"} Remaining:{tx.remaining_units}' for tx in pending_sells]
            print(f"[DEBUG] Buy orders: {buy_orders_info}")
            print(f"[DEBUG] Sell orders: {sell_orders_info}")
            
            # Nếu auto và không có pending, thử completed còn hàng
            if status_mode == 'auto' and (not pending_purchases or not pending_sells):
                buy_domain, sell_domain = _build_domains('completed')
                pending_purchases = Transaction.search(buy_domain)
                pending_sells = Transaction.search(sell_domain)
            
            # Lọc theo loại khớp lệnh
            if match_type == 'investor_investor':
                # Chỉ khớp investor-investor (loại bỏ market maker)
                pending_purchases = pending_purchases.filtered(lambda t: not self._is_market_maker(t))
                pending_sells = pending_sells.filtered(lambda t: not self._is_market_maker(t))
                print(f"[DEBUG] Lọc investor-investor: {len(pending_purchases)} buys, {len(pending_sells)} sells")
            elif match_type == 'market_maker_investor':
                # Chỉ khớp market maker-investor (ít nhất một bên là market maker)
                pending_purchases = pending_purchases.filtered(lambda t: self._is_market_maker(t))
                pending_sells = pending_sells.filtered(lambda t: not self._is_market_maker(t))
                print(f"[DEBUG] Lọc market maker-investor: {len(pending_purchases)} buys, {len(pending_sells)} sells")
            
            if not pending_purchases or not pending_sells:
                return request.make_response(
                    json.dumps({
                        "success": False,
                        "message": f"Không có lệnh mua/bán phù hợp để khớp (loại: {match_type})"
                    }, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")]
                )
            
            # Sử dụng engine riêng
            matching_engine = OrderMatchingEngine(request.env)
            result = matching_engine.match_orders(pending_purchases, pending_sells, use_time_priority)
            
            matched_pairs = result.get('matched_pairs', [])
            remaining_buys = result.get('remaining_buys', [])
            remaining_sells = result.get('remaining_sells', [])

            # Lưu cặp lệnh vào transaction.matched.orders và duyệt các giao dịch đã khớp
            for pair in matched_pairs:
                try:
                    buy_id = pair.get('buy_id')
                    sell_id = pair.get('sell_id')
                    if not buy_id or not sell_id:
                        continue

                    buy_tx = Transaction.browse(int(buy_id))
                    sell_tx = Transaction.browse(int(sell_id))
                    if not buy_tx.exists() or not sell_tx.exists():
                        continue

                    matched_units = pair.get('matched_ccq') or pair.get('matched_volume')
                    if not matched_units:
                        matched_units = min(buy_tx.units or 0, sell_tx.units or 0)

                    # Xác định giá khớp
                    matched_price = pair.get('matched_price')
                    if matched_price is None:
                        matched_price = sell_tx.current_nav or (sell_tx.fund_id.current_nav if sell_tx.fund_id else 0)

                    # Tạo bản ghi matched order (model sẽ tự cập nhật matched_units/remaining_units)
                    try:
                        request.env['transaction.matched.orders'].sudo().create({
                            'buy_order_id': buy_tx.id,
                            'sell_order_id': sell_tx.id,
                            'matched_quantity': matched_units,
                            'matched_price': matched_price,
                            'status': 'confirmed',
                        })
                    except Exception as cerr:
                        print(f"[WARN] Không thể tạo matched order cho cặp {buy_tx.id}-{sell_tx.id}: {cerr}")

                    # Duyệt lệnh nếu đang pending (giữ nguyên hành vi hiện có)
                    for tx in (buy_tx, sell_tx):
                        try:
                            if getattr(tx, 'status', None) == 'pending':
                                if hasattr(tx, 'action_approve'):
                                    tx.action_approve()
                                else:
                                    tx.write({
                                        'status': 'completed',
                                        'approved_by': request.env.user.id if 'approved_by' in tx._fields else False,
                                        'approved_at': fields.Datetime.now() if 'approved_at' in tx._fields else False,
                                    })
                        except Exception as aerr:
                            print(f"[WARN] Không thể duyệt giao dịch {tx.id}: {aerr}")
                except Exception as perr:
                    print(f"[WARN] Lỗi xử lý cặp khớp {pair}: {perr}")
            
            return request.make_response(
                json.dumps({
                    "success": True,
                    "message": f"Đã khớp {len(matched_pairs)} cặp lệnh",
                    "algorithm_used": result.get('algorithm_used', 'Best Price First'),
                    "match_type": match_type,
                    "matched_pairs": matched_pairs,
                    "warnings": result.get('warnings', []),
                    "remaining": {
                        "buys": [{"id": b.id, "nav": b.current_nav or (b.fund_id.current_nav if b.fund_id else 0), "amount": b.amount or 0, "units": b.units or 0, "in_time": b.create_date.strftime('%Y-%m-%d %H:%M:%S') if b.create_date else None} for b in remaining_buys],
                        "sells": [{"id": s.id, "nav": s.current_nav or (s.fund_id.current_nav if s.fund_id else 0), "amount": s.amount or 0, "units": s.units or 0, "in_time": s.create_date.strftime('%Y-%m-%d %H:%M:%S') if s.create_date else None} for s in remaining_sells]
                    },
                    "summary": {
                        "total_matched": len(matched_pairs),
                        "total_buy_orders": len(pending_purchases),
                        "total_sell_orders": len(pending_sells),
                        "remaining_buys": len(remaining_buys),
                        "remaining_sells": len(remaining_sells),
                        "matching_rate": len(matched_pairs) / max(len(pending_purchases), len(pending_sells)) * 100 if max(len(pending_purchases), len(pending_sells)) > 0 else 0
                    }
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")]
            )
                    
        except Exception as e:
            print(f"Lỗi khi khớp lệnh: {e}")
            import traceback
            traceback.print_exc()
            
            return request.make_response(
                json.dumps({
                    "success": False,
                    "message": f"Lỗi khi khớp lệnh: {str(e)}",
                    "matched_pairs": [],
                    "warnings": [],  # Thêm warnings cho error case
                    "remaining": {
                        "buys": [],
                        "sells": []
                    },
                    "summary": {
                        "total_matched": 0,
                        "total_buy_orders": 0,
                        "total_sell_orders": 0,
                        "remaining_buys": 0,
                        "remaining_sells": 0,
                        "matching_rate": 0
                    }
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )


    # ==== API NHÀ TẠO LẬP XỬ LÝ PHẦN CÒN LẠI SAU KHỚP LỆNH ====
    @http.route('/api/transaction-list/market-maker/handle-remaining', type='http', auth='user', methods=['POST'], csrf=False)
    def market_maker_handle_remaining(self, **kwargs):
        """Nhà tạo lập tự động tạo lệnh đối ứng cho các lệnh còn lại (không khớp) và duyệt hoàn tất.

        Quy tắc giá:
        - Với lệnh MUA còn lại của nhà đầu tư: Nhà tạo lập sẽ BÁN ở giá bán do NTL tính toán = NAV trung bình (current_nav của quỹ) * 1.09
        - Với lệnh BÁN còn lại của nhà đầu tư: Nhà tạo lập sẽ MUA theo đúng giá mà nhà đầu tư bán (current_nav của giao dịch nếu có, fallback NAV của quỹ)
        """
        try:
            # Validate request data
            if not request.httprequest.data:
                return request.make_response(
                    json.dumps({"error": "Không có dữ liệu request"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )
            
            data = json.loads(request.httprequest.data.decode('utf-8'))
            remaining_buys = data.get('remaining_buys', [])  # list of transaction ids
            remaining_sells = data.get('remaining_sells', [])  # list of transaction ids
            
            # Validate input
            if not remaining_buys and not remaining_sells:
                return request.make_response(
                    json.dumps({"error": "Không có lệnh còn lại để xử lý"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )

            Transaction = request.env['portfolio.transaction'].sudo()

            handled = {"buys": [], "sells": []}
            mm_pairs = []

            # Xử lý các lệnh MUA còn lại (nhà đầu tư muốn mua) -> NTL BÁN cho họ
            if remaining_buys:
                buy_orders = Transaction.browse(remaining_buys).filtered(lambda t: t.status == 'pending' and t.transaction_type == 'purchase')
                for inv_order in buy_orders:
                    fund = inv_order.fund_id
                    if not fund:
                        continue
                    # Giá bán của NTL = Giá mở cửa hôm nay (opening_avg_price) * (1 + chi phí vốn của quỹ)
                    # Lấy opening price trực tiếp từ tồn kho ngày hôm nay (fallback gần nhất, rồi cấu hình)
                    try:
                        Inventory = request.env['nav.daily.inventory'].sudo()
                        today = fields.Date.today()
                        opening_price = 0.0
                        inv_today = Inventory.search([('fund_id', '=', fund.id), ('inventory_date', '=', today)], limit=1)
                        if inv_today and inv_today.opening_avg_price:
                            opening_price = inv_today.opening_avg_price
                        else:
                            inv_prev = Inventory.search([('fund_id', '=', fund.id), ('inventory_date', '<', today)], order='inventory_date desc', limit=1)
                            if inv_prev and inv_prev.closing_avg_price:
                                opening_price = inv_prev.closing_avg_price
                            else:
                                cfg0 = request.env['nav.fund.config'].sudo().search([('fund_id', '=', fund.id), ('active', '=', True)], limit=1)
                                opening_price = cfg0.initial_nav_price if cfg0 else 0.0
                    except Exception:
                        opening_price = fund.current_nav or 0.0
                    
                    # Lấy chi phí vốn của quỹ từ nav.fund.config
                    try:
                        fund_config = request.env['nav.fund.config'].sudo().search([
                            ('fund_id', '=', fund.id)
                        ], limit=1)
                        
                        if fund_config and fund_config.capital_cost_percent:
                            capital_cost_percent = fund_config.capital_cost_percent
                            print(f"[DEBUG] Chi phí vốn của quỹ {fund.name}: {capital_cost_percent}%")
                        else:
                            # Fallback chi phí vốn mặc định
                            capital_cost_percent = 1.0  # 1%
                            print(f"[DEBUG] Fallback chi phí vốn mặc định cho quỹ {fund.name}: {capital_cost_percent}%")
                    except Exception as e:
                        print(f"[ERROR] Lỗi khi lấy chi phí vốn của quỹ {fund.name}: {e}")
                        capital_cost_percent = 1.0  # Fallback 1%
                    
                    # Tính giá bán của NTL: Giá mở cửa hôm nay × (1 + chi phí vốn%)
                    mm_price_raw = opening_price * (1 + capital_cost_percent / 100)
                    # Làm tròn theo MROUND(step=50)
                    mm_price = mround(mm_price_raw, 50)
                    print(f"[DEBUG] Giá bán NTL cho quỹ {fund.name}: {opening_price} × (1 + {capital_cost_percent}%) = {mm_price_raw} → Làm tròn bội số 50 = {mm_price}")
                    mm_units = inv_order.units or 0.0
                    if mm_units <= 0 or mm_price <= 0:
                        continue
                    mm_amount = mm_units * mm_price

                    # Tạo lệnh BÁN của NTL (user nội bộ hiện tại)
                    mm_tx = Transaction.create({
                        'user_id': request.env.user.id,
                        'fund_id': fund.id,
                        'transaction_type': 'sell',
                        'units': mm_units,
                        'amount': mm_amount,
                        'price': mm_price,  # Thêm trường price (đã làm tròn bội số 50)
                        'current_nav': mm_price,
                        'matched_units': mm_units,
                        'status': 'pending',
                        'source': 'portfolio',
                        'description': 'Market Maker sell to fulfill remaining buy order'
                    })

                    # Cập nhật matched_units và duyệt hoàn tất tất cả hai giao dịch (khớp ngay)
                    inv_order.write({'matched_units': mm_units})
                    try:
                        inv_order.action_approve()
                    except Exception:
                        inv_order.write({'status': 'completed'})
                    try:
                        mm_tx.action_approve()
                    except Exception:
                        mm_tx.write({'status': 'completed'})

                    handled["buys"].append({"investor_order": inv_order.id, "mm_order": mm_tx.id, "price": mm_tx.current_nav, "units": mm_units})
                    # Tạo cặp để hiển thị popup
                    mm_pairs.append({
                        'buy_id': inv_order.id,
                        'buy_nav': inv_order.current_nav or (fund.current_nav or 0.0),
                        'buy_amount': inv_order.amount or (mm_units * (inv_order.current_nav or (fund.current_nav or 0.0))),
                        'buy_units': mm_units,
                        'buy_in_time': inv_order.create_date.strftime('%Y-%m-%d %H:%M:%S') if inv_order.create_date else None,
                        'sell_id': mm_tx.id,
                        'sell_nav': mm_tx.current_nav,
                        'sell_amount': mm_tx.amount,
                        'sell_units': mm_units,
                        'sell_in_time': mm_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if mm_tx.create_date else None,
                        'matched_ccq': mm_units,
                        'matched_price': mm_tx.current_nav,
                    })

                    # Lưu cặp lệnh vào matched orders (inv - mm)
                    try:
                        request.env['transaction.matched.orders'].sudo().create({
                            'buy_order_id': inv_order.id,
                            'sell_order_id': mm_tx.id,
                            'matched_quantity': mm_units,
                            'matched_price': mm_tx.current_nav,
                            'status': 'confirmed',
                        })
                    except Exception as cerr:
                        print(f"[WARN] Không thể tạo matched order (INV-MM buy): {cerr}")

            # Xử lý các lệnh BÁN còn lại (nhà đầu tư muốn bán) -> NTL MUA của họ
            if remaining_sells:
                sell_orders = Transaction.browse(remaining_sells).filtered(lambda t: t.status == 'pending' and t.transaction_type == 'sell')
                for inv_order in sell_orders:
                    fund = inv_order.fund_id
                    if not fund:
                        continue
                    # Giá mua của NTL = Giá bán của nhà đầu tư (theo yêu cầu)
                    # Lấy giá bán từ lệnh bán của nhà đầu tư
                    investor_sell_price = inv_order.current_nav or inv_order.price or 0
                    # Làm tròn theo MROUND(step=50)
                    mm_price = mround(investor_sell_price, 50)
                    print(f"[DEBUG] Giá mua NTL cho quỹ {fund.name}: {mm_price} (giá bán của nhà đầu tư: {investor_sell_price})")
                    mm_units = inv_order.units or 0.0
                    if mm_units <= 0 or mm_price <= 0:
                        continue
                    mm_amount = mm_units * mm_price

                    # Tạo lệnh MUA của NTL (user nội bộ hiện tại)
                    mm_tx = Transaction.create({
                        'user_id': request.env.user.id,
                        'fund_id': fund.id,
                        'transaction_type': 'purchase',
                        'units': mm_units,
                        'amount': mm_amount,
                        'price': mm_price,  # Thêm trường price (đã làm tròn bội số 50)
                        'current_nav': mm_price,
                        'matched_units': mm_units,
                        'status': 'pending',
                        'source': 'portfolio',
                        'description': 'Market Maker buy to fulfill remaining sell order'
                    })

                    # Cập nhật matched_units và duyệt hoàn tất (khớp ngay)
                    inv_order.write({'matched_units': mm_units})
                    try:
                        inv_order.action_approve()
                    except Exception:
                        inv_order.write({'status': 'completed'})
                    try:
                        mm_tx.action_approve()
                    except Exception:
                        mm_tx.write({'status': 'completed'})

                    handled["sells"].append({"investor_order": inv_order.id, "mm_order": mm_tx.id, "price": mm_tx.current_nav, "units": mm_units})
                    # Tạo cặp để hiển thị popup
                    mm_pairs.append({
                        'buy_id': mm_tx.id,
                        'buy_nav': mm_tx.current_nav,
                        'buy_amount': mm_tx.amount,
                        'buy_units': mm_units,
                        'buy_in_time': mm_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if mm_tx.create_date else None,
                        'sell_id': inv_order.id,
                        'sell_nav': inv_order.current_nav or (fund.current_nav or 0.0),
                        'sell_amount': inv_order.amount or (mm_units * (inv_order.current_nav or (fund.current_nav or 0.0))),
                        'sell_units': mm_units,
                        'sell_in_time': inv_order.create_date.strftime('%Y-%m-%d %H:%M:%S') if inv_order.create_date else None,
                        'matched_ccq': mm_units,
                        'matched_price': mm_tx.current_nav,
                    })

                    # Lưu cặp lệnh vào matched orders (mm - INV)
                    try:
                        request.env['transaction.matched.orders'].sudo().create({
                            'buy_order_id': mm_tx.id,
                            'sell_order_id': inv_order.id,
                            'matched_quantity': mm_units,
                            'matched_price': mm_tx.current_nav,
                            'status': 'confirmed',
                        })
                    except Exception as cerr:
                        print(f"[WARN] Không thể tạo matched order (MM-INV sell): {cerr}")

            return request.make_response(
                json.dumps({
                    "success": True,
                    "message": "Nhà tạo lập đã xử lý các lệnh còn lại",
                    "handled": handled,
                    "matched_pairs": mm_pairs,
                    "algorithm_used": "Market Maker",
                    "remaining": {
                        "buys": [
                            {
                                "id": b.id,
                                "nav": b.current_nav if b.current_nav else (b.fund_id.current_nav if b.fund_id else 0),
                                "amount": b.amount,
                                "units": getattr(b, 'units', 0),
                                "in_time": b.create_date.strftime('%Y-%m-%d %H:%M:%S') if b.create_date else None
                            }
                            for b in request.env['portfolio.transaction'].sudo().search([
                                ('transaction_type', '=', 'purchase'), ('status', '=', 'pending')
                            ])
                        ],
                        "sells": [
                            {
                                "id": s.id,
                                "nav": s.current_nav if s.current_nav else (s.fund_id.current_nav if s.fund_id else 0),
                                "amount": s.amount,
                                "units": getattr(s, 'units', 0),
                                "in_time": s.create_date.strftime('%Y-%m-%d %H:%M:%S') if s.create_date else None
                            }
                            for s in request.env['portfolio.transaction'].sudo().search([
                                ('transaction_type', '=', 'sell'), ('status', '=', 'pending')
                            ])
                        ]
                    }
                }, ensure_ascii=False),
                headers=[("Content-Type", "application/json")]
            )

        except Exception as e:
            return request.make_response(
                json.dumps({"success": False, "message": str(e)}, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )

    # ==== API NHÀ TẠO LẬP XỬ LÝ THỦ CÔNG 1 GIAO DỊCH ====
    @http.route('/api/transaction-list/market-maker/handle-one', type='http', auth='user', methods=['POST'], csrf=False)
    def market_maker_handle_one(self, **kwargs):
        """Nhà tạo lập xử lý thủ công cho một giao dịch pending bằng cách tạo lệnh đối ứng và trả về dữ liệu để hiển thị popup khớp lệnh.

        Lưu ý: Không tự động approve ở đây. Frontend sẽ chỉ hiển thị popup kết quả cặp khớp.
        """
        try:
            # Validate request data
            if not request.httprequest.data:
                return request.make_response(
                    json.dumps({"success": False, "message": "Không có dữ liệu request"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )
            
            data = json.loads(request.httprequest.data.decode('utf-8'))
            tx_id = data.get('transaction_id')
            
            if not tx_id:
                return request.make_response(
                    json.dumps({"success": False, "message": "Thiếu transaction_id"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )
            
            # Validate transaction ID
            try:
                tx_id = int(tx_id)
            except (ValueError, TypeError):
                return request.make_response(
                    json.dumps({"success": False, "message": "ID giao dịch không hợp lệ"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )

            Transaction = request.env['portfolio.transaction'].sudo()
            inv_order = Transaction.browse(tx_id)
            if not inv_order.exists() or inv_order.status != 'pending':
                return request.make_response(
                    json.dumps({"success": False, "message": "Giao dịch không tồn tại hoặc không ở trạng thái pending"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )

            fund = inv_order.fund_id
            if not fund:
                return request.make_response(
                    json.dumps({"success": False, "message": "Giao dịch không có quỹ"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )

            if inv_order.transaction_type == 'purchase':
                # NĐT muốn mua -> NTL bán theo giá trung bình cuối ngày * 1.09
                daily_avg_price = self._calculate_daily_average_price(fund.id)
                mm_price_raw = daily_avg_price * 1.09
                # Làm tròn theo MROUND(step=50)
                mm_price = mround(mm_price_raw, 50)
                mm_type = 'sell'
            elif inv_order.transaction_type == 'sell':
                # NĐT muốn bán -> NTL mua theo giá NĐT bán
                mm_price_raw = inv_order.current_nav or (fund.current_nav or 0.0)
                # Làm tròn theo MROUND(step=50)
                mm_price = mround(mm_price_raw, 50)
                mm_type = 'purchase'
            else:
                return request.make_response(
                    json.dumps({"success": False, "message": "Chỉ hỗ trợ lệnh mua/bán"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )

            units = inv_order.units or 0.0
            if units <= 0 or (mm_price or 0) <= 0:
                return request.make_response(
                    json.dumps({"success": False, "message": "Số lượng hoặc giá không hợp lệ"}, ensure_ascii=False),
                    headers=[("Content-Type", "application/json")],
                    status=400
                )

            mm_tx = Transaction.create({
                'user_id': request.env.user.id,
                'fund_id': fund.id,
                'transaction_type': mm_type,
                'units': units,
                'amount': units * mm_price,
                'current_nav': mm_price,  # Đã làm tròn bội số 50
                'matched_units': units,
                'status': 'pending',
                'source': 'portfolio',
                'description': 'Market Maker manual handling'
            })

            # Khớp ngay: cập nhật matched_units và duyệt hoàn tất tất cả hai giao dịch
            inv_order.write({'matched_units': units})
            try:
                inv_order.action_approve()
            except Exception:
                inv_order.write({'status': 'completed'})
            try:
                mm_tx.action_approve()
            except Exception:
                mm_tx.write({'status': 'completed'})

            # Chuẩn bị dữ liệu cặp khớp để hiển thị popup
            if inv_order.transaction_type == 'purchase':
                matched_price = mm_tx.current_nav
                pair = {
                    'buy_id': inv_order.id,
                    'buy_nav': inv_order.current_nav or (fund.current_nav or 0.0),
                    'buy_amount': inv_order.amount or (units * (inv_order.current_nav or (fund.current_nav or 0.0))),
                    'buy_units': units,
                    'buy_in_time': inv_order.create_date.strftime('%Y-%m-%d %H:%M:%S') if inv_order.create_date else None,
                    'sell_id': mm_tx.id,
                    'sell_nav': matched_price,
                    'sell_amount': mm_tx.amount,
                    'sell_units': units,
                    'sell_in_time': mm_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if mm_tx.create_date else None,
                    'matched_ccq': units,
                    'matched_price': matched_price,
                }
            else:
                matched_price = inv_order.current_nav or (fund.current_nav or 0.0)
                pair = {
                    'buy_id': mm_tx.id,
                    'buy_nav': matched_price,
                    'buy_amount': mm_tx.amount,
                    'buy_units': units,
                    'buy_in_time': mm_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if mm_tx.create_date else None,
                    'sell_id': inv_order.id,
                    'sell_nav': inv_order.current_nav or (fund.current_nav or 0.0),
                    'sell_amount': inv_order.amount or (units * (inv_order.current_nav or (fund.current_nav or 0.0))),
                    'sell_units': units,
                    'sell_in_time': inv_order.create_date.strftime('%Y-%m-%d %H:%M:%S') if inv_order.create_date else None,
                    'matched_ccq': units,
                    'matched_price': matched_price,
                }

            response_payload = {
                'success': True,
                'message': 'Đã tạo lệnh đối ứng cho giao dịch, hiển thị cặp khớp',
                'matched_pairs': [pair],
                'remaining': {
                    'buys': [
                        {
                            'id': b.id,
                            'nav': b.current_nav if b.current_nav else (b.fund_id.current_nav if b.fund_id else 0),
                            'amount': b.amount,
                            'units': getattr(b, 'units', 0),
                            'in_time': b.create_date.strftime('%Y-%m-%d %H:%M:%S') if b.create_date else None
                        }
                        for b in request.env['portfolio.transaction'].sudo().search([
                            ('transaction_type', '=', 'purchase'), ('status', '=', 'pending')
                        ])
                    ],
                    'sells': [
                        {
                            'id': s.id,
                            'nav': s.current_nav if s.current_nav else (s.fund_id.current_nav if s.fund_id else 0),
                            'amount': s.amount,
                            'units': getattr(s, 'units', 0),
                            'in_time': s.create_date.strftime('%Y-%m-%d %H:%M:%S') if s.create_date else None
                        }
                        for s in request.env['portfolio.transaction'].sudo().search([
                            ('transaction_type', '=', 'sell'), ('status', '=', 'pending')
                        ])
                    ]
                },
                'algorithm_used': 'Market Maker Manual'
            }

            return request.make_response(
                json.dumps(response_payload, ensure_ascii=False),
                headers=[("Content-Type", "application/json")]
            )

            # Lưu cặp lệnh vào matched orders cho xử lý thủ công
            try:
                request.env['transaction.matched.orders'].sudo().create({
                    'buy_order_id': pair.get('buy_id'),
                    'sell_order_id': pair.get('sell_id'),
                    'matched_quantity': pair.get('matched_ccq') or units,
                    'matched_price': pair.get('matched_price') or matched_price,
                    'status': 'confirmed',
                })
            except Exception as cerr:
                print(f"[WARN] Không thể tạo matched order (handle-one): {cerr}")

        except Exception as e:
            return request.make_response(
                json.dumps({"success": False, "message": str(e)}, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )

    @http.route('/api/transaction-list/get-investor-name/<int:transaction_id>', type='http', auth='user', methods=['GET'], csrf=False)
    def get_investor_name(self, transaction_id, **kwargs):
        """Lấy tên nhà đầu tư từ transaction ID"""
        try:
            print(f"[DEBUG] Getting investor name for transaction {transaction_id}")
            
            # Lấy transaction từ database
            transaction = request.env['portfolio.transaction'].browse(transaction_id)
            
            if not transaction.exists():
                return request.make_json_response({
                    'success': False,
                    'message': 'Transaction not found'
                })
            
            # Lấy tên nhà đầu tư
            investor_name = 'N/A'
            if hasattr(transaction, 'investor_name') and transaction.investor_name:
                investor_name = transaction.investor_name
                print(f"[DEBUG] Using transaction.investor_name: {investor_name}")
            elif transaction.user_id and transaction.user_id.partner_id:
                investor_name = transaction.user_id.partner_id.name or 'N/A'
                print(f"[DEBUG] Using transaction.user_id.partner_id.name: {investor_name}")
            elif transaction.user_id:
                investor_name = transaction.user_id.name or 'N/A'
                print(f"[DEBUG] Using transaction.user_id.name: {investor_name}")
            
            return request.make_json_response({
                'success': True,
                'investor_name': investor_name,
                'transaction_id': transaction_id,
                'user_id': transaction.user_id.id if transaction.user_id else None
            })
            
        except Exception as e:
            print(f"[ERROR] Error getting investor name: {e}")
            import traceback
            traceback.print_exc()
            return request.make_json_response({
                'success': False,
                'message': str(e)
            })

    @http.route('/api/transaction-list/get-matched-pairs', type='json', auth='user', methods=['POST'], csrf=False)
    def get_matched_pairs_simple(self, **kwargs):
        """API đơn giản để lấy danh sách cặp lệnh khớp thỏa thuận"""
        try:
            print(f"[DEBUG] API get-matched-pairs được gọi")
            
            # Lấy tất cả transactions có matched_units > 0
            Transaction = request.env['portfolio.transaction'].sudo()
            
            # Tìm các transactions đã khớp
            matched_transactions = Transaction.search([
                ('matched_units', '>', 0)
            ], order='create_date desc', limit=1000)
            
            print(f"[DEBUG] Found {len(matched_transactions)} matched transactions")
            
            # Tạo cặp lệnh khớp
            matched_pairs = []
            
            # Lấy buy và sell transactions riêng biệt
            buy_transactions = matched_transactions.filtered(lambda t: t.transaction_type == 'purchase')
            sell_transactions = matched_transactions.filtered(lambda t: t.transaction_type == 'sell')
            
            print(f"[DEBUG] Buy transactions: {len(buy_transactions)}, Sell transactions: {len(sell_transactions)}")
            
            # Tạo cặp lệnh khớp
            used_sells = set()
            
            for buy_tx in buy_transactions:
                # Tìm sell transaction phù hợp
                for sell_tx in sell_transactions:
                    if sell_tx.id in used_sells:
                        continue
                    
                    # Kiểm tra điều kiện khớp (cùng fund và khác user)
                    if (buy_tx.fund_id == sell_tx.fund_id and 
                        buy_tx.user_id and sell_tx.user_id and 
                        buy_tx.user_id.id != sell_tx.user_id.id):
                        # Lấy thông tin investor
                        buy_investor_name = 'N/A'
                        if buy_tx.user_id and buy_tx.user_id.partner_id:
                            buy_investor_name = buy_tx.user_id.partner_id.name or buy_tx.user_id.name
                        
                        sell_investor_name = 'N/A'
                        if sell_tx.user_id and sell_tx.user_id.partner_id:
                            sell_investor_name = sell_tx.user_id.partner_id.name or sell_tx.user_id.name
                        
                        # Xác định user type dựa trên Internal User
                        def is_market_maker(user):
                            """Xác định user có phải là market maker không dựa trên user type"""
                            if not user:
                                return False
                            is_internal = user.has_group('base.group_user')
                            print(f"[DEBUG] Checking user {user.name}: has_group('base.group_user')={is_internal}")
                            return is_internal
                            
                        # Xác định loại user cho buy và sell transaction
                        buy_user_type = 'market_maker' if is_market_maker(buy_tx.user_id) else 'investor'
                        sell_user_type = 'market_maker' if is_market_maker(sell_tx.user_id) else 'investor'
                        
                        print(f"[DEBUG] Buy transaction {buy_tx.id}:")
                        print(f"[DEBUG] - User: {buy_tx.user_id.name if buy_tx.user_id else 'N/A'}")
                        print(f"[DEBUG] - Type: {buy_user_type}")
                        print(f"[DEBUG] - Source: {getattr(buy_tx, 'source', 'N/A')}")
                        
                        print(f"[DEBUG] Sell transaction {sell_tx.id}:")
                        print(f"[DEBUG] - User: {sell_tx.user_id.name if sell_tx.user_id else 'N/A'}")
                        print(f"[DEBUG] - Type: {sell_user_type}")
                        print(f"[DEBUG] - Source: {getattr(sell_tx, 'source', 'N/A')}")
                        
                        # Debug logs
                        print(f"[DEBUG] Buy user {buy_tx.user_id.name if buy_tx.user_id else 'N/A'}: is_internal={buy_tx.user_id.has_group('base.group_user') if buy_tx.user_id else False}")
                        print(f"[DEBUG] Sell user {sell_tx.user_id.name if sell_tx.user_id else 'N/A'}: is_internal={sell_tx.user_id.has_group('base.group_user') if sell_tx.user_id else False}")
                        
                        # Tạo pair data
                        pair_data = {
                            'id': f"{buy_tx.id}_{sell_tx.id}",
                            'buy_id': buy_tx.id,
                            'sell_id': sell_tx.id,
                            'buy_investor': buy_investor_name,
                            'sell_investor': sell_investor_name,
                            'buy_user_type': buy_user_type,
                            'sell_user_type': sell_user_type,
                            'buy_units': getattr(buy_tx, 'units', 0),
                            'sell_units': getattr(sell_tx, 'units', 0),
                            'matched_volume': min(getattr(buy_tx, 'matched_units', 0), getattr(sell_tx, 'matched_units', 0)),
                            'matched_ccq': min(getattr(buy_tx, 'matched_units', 0), getattr(sell_tx, 'matched_units', 0)),
                            'matched_price': getattr(sell_tx, 'current_nav', 0),
                            'match_time': buy_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if buy_tx.create_date else '',
                            'buy_in_time': buy_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if buy_tx.create_date else '',
                            'sell_in_time': sell_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if sell_tx.create_date else '',
                            'created_at': buy_tx.create_date.strftime('%Y-%m-%d %H:%M:%S') if buy_tx.create_date else '',
                            'status': 'matched'
                        }
                        
                        matched_pairs.append(pair_data)
                        used_sells.add(sell_tx.id)
                        break  # Chỉ lấy 1 sell transaction cho mỗi buy transaction
            
            print(f"[DEBUG] Returning {len(matched_pairs)} matched pairs")
            
            return {
                'success': True,
                'matched_pairs': matched_pairs,
                'data': matched_pairs,
                'total': len(matched_pairs),
                'message': f'Đã tải {len(matched_pairs)} cặp lệnh khớp thỏa thuận'
            }
            
        except Exception as e:
            print(f"[ERROR] Error in get_matched_pairs_simple: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'data': [],
                'message': f'Lỗi: {str(e)}'
            }

    @http.route('/api/transaction-list/send-to-exchange', type='json', auth='user', methods=['POST'], csrf=False)
    def send_to_exchange(self, **kwargs):
        """API để gửi cặp lệnh khớp lên sàn"""
        try:
            print(f"[DEBUG] API send-to-exchange được gọi")
            
            # Lấy data từ request
            buy_id = kwargs.get('buy_id')
            sell_id = kwargs.get('sell_id')
            matched_volume = kwargs.get('matched_volume')
            matched_price = kwargs.get('matched_price')
            
            print(f"[DEBUG] Buy ID: {buy_id}, Sell ID: {sell_id}, Volume: {matched_volume}, Price: {matched_price}")
            
            if not all([buy_id, sell_id, matched_volume, matched_price]):
                return {
                    'success': False,
                    'message': 'Thiếu thông tin cần thiết để gửi lên sàn'
                }
            
            # Lấy transactions
            Transaction = request.env['portfolio.transaction'].sudo()
            buy_tx = Transaction.browse(buy_id)
            sell_tx = Transaction.browse(sell_id)
            
            if not buy_tx.exists() or not sell_tx.exists():
                return {
                    'success': False,
                    'message': 'Không tìm thấy giao dịch'
                }
            
            # Cập nhật trạng thái giao dịch (ví dụ: gửi lên sàn)
            # Ở đây có thể thêm logic gửi lên sàn thực tế
            
            # Cập nhật trạng thái gửi lên sàn
            current_time = datetime.now()
            
            # Cập nhật flag và timestamp cho cả hai transaction
            buy_tx.write({
                'sent_to_exchange': True,
                'sent_to_exchange_at': current_time
            })
            
            sell_tx.write({
                'sent_to_exchange': True,
                'sent_to_exchange_at': current_time
            })
            
            print(f"[DEBUG] Đã gửi cặp lệnh {buy_id}-{sell_id} lên sàn")
            
            return {
                'success': True,
                'message': f'Đã gửi cặp lệnh lên sàn thành công'
            }
            
        except Exception as e:
            print(f"[ERROR] Error in send_to_exchange: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'message': f'Lỗi: {str(e)}'
            }

    @http.route('/api/transaction-list/bulk-send-to-exchange', type='json', auth='user', methods=['POST'], csrf=False)
    def bulk_send_to_exchange(self, **kwargs):
        """API để gửi nhiều cặp lệnh khớp lên sàn cùng lúc"""
        try:
            print(f"[DEBUG] API bulk-send-to-exchange được gọi")
            
            # Lấy danh sách pair_ids từ request
            pair_ids = kwargs.get('pair_ids', [])
            
            print(f"[DEBUG] Pair IDs: {pair_ids}")
            
            if not pair_ids:
                return {
                    'success': False,
                    'message': 'Không có cặp lệnh nào được chọn'
                }
            
            Transaction = request.env['portfolio.transaction'].sudo()
            current_time = datetime.now()
            sent_count = 0
            failed_pairs = []
            
            for pair_id in pair_ids:
                try:
                    # Parse pair_id (format: "buy_id-sell_id")
                    if '-' not in str(pair_id):
                        failed_pairs.append(f"{pair_id} (format không hợp lệ)")
                        continue
                        
                    buy_id, sell_id = str(pair_id).split('-', 1)
                    buy_id = int(buy_id)
                    sell_id = int(sell_id)
                    
                    # Lấy transactions
                    buy_tx = Transaction.browse(buy_id)
                    sell_tx = Transaction.browse(sell_id)
                    
                    if not buy_tx.exists() or not sell_tx.exists():
                        failed_pairs.append(f"{pair_id} (không tìm thấy giao dịch)")
                        continue
                    
                    # Kiểm tra đã gửi chưa
                    if buy_tx.sent_to_exchange or sell_tx.sent_to_exchange:
                        failed_pairs.append(f"{pair_id} (đã gửi trước đó)")
                        continue
                    
                    # Cập nhật trạng thái gửi lên sàn
                    buy_tx.write({
                        'sent_to_exchange': True,
                        'sent_to_exchange_at': current_time
                    })
                    
                    sell_tx.write({
                        'sent_to_exchange': True,
                        'sent_to_exchange_at': current_time
                    })
                    
                    sent_count += 1
                    print(f"[DEBUG] Đã gửi cặp lệnh {pair_id} lên sàn")
                    
                except Exception as e:
                    print(f"[ERROR] Error processing pair {pair_id}: {e}")
                    failed_pairs.append(f"{pair_id} (lỗi: {str(e)})")
                    continue
            
            # Tạo response message
            if sent_count > 0:
                message = f'Đã gửi {sent_count} cặp lệnh lên sàn thành công'
                if failed_pairs:
                    message += f'. Thất bại: {len(failed_pairs)} cặp'
                
                return {
                    'success': True,
                    'message': message,
                    'sent_count': sent_count,
                    'failed_count': len(failed_pairs),
                    'failed_pairs': failed_pairs
                }
            else:
                return {
                    'success': False,
                    'message': f'Không thể gửi cặp lệnh nào. Lỗi: {", ".join(failed_pairs)}',
                    'sent_count': 0,
                    'failed_count': len(failed_pairs),
                    'failed_pairs': failed_pairs
                }
                
        except Exception as e:
            print(f"[ERROR] Error in bulk_send_to_exchange: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'message': f'Có lỗi xảy ra: {str(e)}'
            }

    @http.route('/api/transaction-list/matched-pairs', type='http', auth='user', methods=['POST'], csrf=False)
    def get_matched_pairs(self, **kwargs):
        """Lấy danh sách tất cả cặp lệnh đã khớp với phân trang"""
        try:
            print(f"[DEBUG] API matched-pairs được gọi")
            
            # Lấy data từ request
            if request.httprequest.content_type == 'application/json':
                import json
                data = json.loads(request.httprequest.data.decode('utf-8'))
            else:
                data = request.params
                
            print(f"[DEBUG] Request data: {data}")
            
            page = data.get('page', 1)
            limit = data.get('limit', 1000)
            source_type = data.get('source_type', 'all')  # all, investor, market_maker
            
            print(f"[DEBUG] Page: {page}, Limit: {limit}, Source type: {source_type}")
            
            # Tính offset
            offset = (page - 1) * limit
            
            Transaction = request.env['portfolio.transaction'].sudo()
            print(f"[DEBUG] Transaction model: {Transaction}")
            
            # Lấy các giao dịch đã khớp (có matched_units > 0 hoặc status = completed)
            domain = [
                '|',
                ('matched_units', '>', 0),
                ('status', '=', 'completed')
            ]
            
            # Lọc theo nguồn nếu cần
            if source_type == 'investor':
                # Lệnh từ nhà đầu tư (không phải market maker) - dựa vào source field
                domain.append(('source', '!=', 'sale'))
            elif source_type == 'market_maker':
                # Lệnh từ market maker - dựa vào source field
                domain.append(('source', '=', 'sale'))
            
            # Lấy giao dịch BUY và SELL đã khớp
            buy_domain = domain + [('transaction_type', '=', 'purchase')]
            sell_domain = domain + [('transaction_type', '=', 'sell')]
            
            print(f"[DEBUG] Buy domain: {buy_domain}")
            print(f"[DEBUG] Sell domain: {sell_domain}")
            
            buy_transactions = Transaction.search(buy_domain, 
                                                order='create_date desc', limit=limit, offset=offset)
            sell_transactions = Transaction.search(sell_domain, 
                                                 order='create_date desc', limit=limit, offset=offset)

            # Áp dụng lọc source_type ở tầng Python
            def _is_mm(user):
                try:
                    return bool(user and user.has_group('base.group_user'))
                except Exception:
                    return False
            if source_type in ('investor', 'market_maker'):
                want_mm = (source_type == 'market_maker')
                buy_transactions = buy_transactions.filtered(lambda t: _is_mm(t.user_id) == want_mm or (getattr(t, 'source', '') == 'sale') == want_mm)
                sell_transactions = sell_transactions.filtered(lambda t: _is_mm(t.user_id) == want_mm or (getattr(t, 'source', '') == 'sale') == want_mm)
            
            print(f"[DEBUG] Found {len(buy_transactions)} buy transactions and {len(sell_transactions)} sell transactions")
            
            # Debug: In ra một vài transaction để kiểm tra
            if buy_transactions:
                print(f"[DEBUG] Sample buy transaction: ID={buy_transactions[0].id}, matched_units={getattr(buy_transactions[0], 'matched_units', 'N/A')}")
            if sell_transactions:
                print(f"[DEBUG] Sample sell transaction: ID={sell_transactions[0].id}, matched_units={getattr(sell_transactions[0], 'matched_units', 'N/A')}")
            
            # Tạo cặp lệnh khớp từ dữ liệu - đơn giản hóa để đảm bảo có data
            matched_pairs = []
            
            # Lấy tất cả transactions có matched_units > 0
            all_matched_transactions = Transaction.search([
                ('matched_units', '>', 0)
            ], order='create_date desc', limit=limit, offset=offset)
            
            print(f"[DEBUG] Found {len(all_matched_transactions)} transactions with matched_units > 0")
            
            # Tạo pairs thực sự từ buy và sell transactions
            used_sells = set()
            
            for buy_tx in buy_transactions:
                if buy_tx.id in used_sells:
                    continue
                
                # Tìm sell transaction phù hợp
                for sell_tx in sell_transactions:
                    if sell_tx.id in used_sells:
                        continue
                    
                    # Kiểm tra điều kiện khớp (cùng fund, có matched_units, khác user)
                    if (buy_tx.fund_id == sell_tx.fund_id and 
                        getattr(buy_tx, 'matched_units', 0) > 0 and 
                        getattr(sell_tx, 'matched_units', 0) > 0 and
                        buy_tx.user_id and sell_tx.user_id and 
                        buy_tx.user_id.id != sell_tx.user_id.id):
                        
                        # Lấy thông tin người dùng từ bảng danh sách
                        print(f"[DEBUG] Buy transaction {buy_tx.id}: user_id={buy_tx.user_id}")
                        buy_investor_name = 'N/A'
                        
                        # Thử lấy từ transaction list model
                        try:
                            transaction_list = request.env['portfolio.transaction'].browse(buy_tx.id)
                            if hasattr(transaction_list, 'investor_name') and transaction_list.investor_name:
                                buy_investor_name = transaction_list.investor_name
                                print(f"[DEBUG] Using transaction_list.investor_name: {buy_investor_name}")
                            elif transaction_list.user_id and transaction_list.user_id.partner_id:
                                buy_investor_name = transaction_list.user_id.partner_id.name or 'N/A'
                                print(f"[DEBUG] Using transaction_list.user_id.partner_id.name: {buy_investor_name}")
                            elif transaction_list.user_id:
                                buy_investor_name = transaction_list.user_id.name or 'N/A'
                                print(f"[DEBUG] Using transaction_list.user_id.name: {buy_investor_name}")
                        except Exception as e:
                            print(f"[DEBUG] Error getting buy investor name: {e}")
                            # Fallback to original method
                            if buy_tx.user_id and buy_tx.user_id.partner_id:
                                buy_investor_name = buy_tx.user_id.partner_id.name or 'N/A'
                            elif buy_tx.user_id:
                                buy_investor_name = buy_tx.user_id.name or 'N/A'
                        
                        print(f"[DEBUG] Sell transaction {sell_tx.id}: user_id={sell_tx.user_id}")
                        sell_investor_name = 'N/A'
                        
                        # Thử lấy từ transaction list model
                        try:
                            transaction_list = request.env['portfolio.transaction'].browse(sell_tx.id)
                            if hasattr(transaction_list, 'investor_name') and transaction_list.investor_name:
                                sell_investor_name = transaction_list.investor_name
                                print(f"[DEBUG] Using transaction_list.investor_name: {sell_investor_name}")
                            elif transaction_list.user_id and transaction_list.user_id.partner_id:
                                sell_investor_name = transaction_list.user_id.partner_id.name or 'N/A'
                                print(f"[DEBUG] Using transaction_list.user_id.partner_id.name: {sell_investor_name}")
                            elif transaction_list.user_id:
                                sell_investor_name = transaction_list.user_id.name or 'N/A'
                                print(f"[DEBUG] Using transaction_list.user_id.name: {sell_investor_name}")
                        except Exception as e:
                            print(f"[DEBUG] Error getting sell investor name: {e}")
                            # Fallback to original method
                            if sell_tx.user_id and sell_tx.user_id.partner_id:
                                sell_investor_name = sell_tx.user_id.partner_id.name or 'N/A'
                            elif sell_tx.user_id:
                                sell_investor_name = sell_tx.user_id.name or 'N/A'
                
                # Xác định loại user
                buy_user_type = 'market_maker' if buy_tx.user_id and buy_tx.user_id.has_group('base.group_user') else 'investor'
                sell_user_type = 'market_maker' if sell_tx.user_id and sell_tx.user_id.has_group('base.group_user') else 'investor'
                
                # Debug logs
                print(f"[DEBUG] Buy user {buy_tx.user_id.name if buy_tx.user_id else 'N/A'}: is_internal={buy_tx.user_id.has_group('base.group_user') if buy_tx.user_id else False}")
                print(f"[DEBUG] Sell user {sell_tx.user_id.name if sell_tx.user_id else 'N/A'}: is_internal={sell_tx.user_id.has_group('base.group_user') if sell_tx.user_id else False}")

                # Fallback: chỉ coi 'sale' là market maker
                if buy_user_type == 'investor' and hasattr(buy_tx, 'source'):
                    if buy_tx.source == 'sale':
                        buy_user_type = 'market_maker'
                if sell_user_type == 'investor' and hasattr(sell_tx, 'source'):
                    if sell_tx.source == 'sale':
                        sell_user_type = 'market_maker'
                
                print(f"[DEBUG] User types determined: buy_user_type={buy_user_type}, sell_user_type={sell_user_type}")
                print(f"[DEBUG] Buy user: {buy_tx.user_id.name if buy_tx.user_id else 'N/A'}, partner: {buy_tx.user_id.partner_id.name if buy_tx.user_id and buy_tx.user_id.partner_id else 'N/A'}")
                print(f"[DEBUG] Sell user: {sell_tx.user_id.name if sell_tx.user_id else 'N/A'}, partner: {sell_tx.user_id.partner_id.name if sell_tx.user_id and sell_tx.user_id.partner_id else 'N/A'}")
                
                # Debug: Log source information
                buy_source = getattr(buy_tx, 'source', 'portal')
                sell_source = getattr(sell_tx, 'source', 'portal')
                print(f"[DEBUG] Transaction sources: buy_tx.id={buy_tx.id}, buy_source={buy_source}, sell_tx.id={sell_tx.id}, sell_source={sell_source}")
                
                # Tạo pair thực sự
                pair = {
                    'buy_id': buy_tx.id,
                    'buy_investor': buy_investor_name,
                    'buy_name': buy_investor_name,
                    'buy_nav': getattr(buy_tx, 'current_nav', 0) or 0,
                    'buy_amount': getattr(buy_tx, 'amount', 0) or 0,
                    'buy_units': getattr(buy_tx, 'units', 0) or 0,
                    'buy_in_time': buy_tx.create_date.strftime('%d/%m/%Y %H:%M:%S') if buy_tx.create_date else 'N/A',
                            'buy_source': buy_source,  # Thêm trường source từ transaction
                    
                    'sell_id': sell_tx.id,
                    'sell_investor': sell_investor_name,
                    'sell_name': sell_investor_name,
                    'sell_nav': getattr(sell_tx, 'current_nav', 0) or 0,
                    'sell_amount': getattr(sell_tx, 'amount', 0) or 0,
                    'sell_units': getattr(sell_tx, 'units', 0) or 0,
                    'sell_in_time': sell_tx.create_date.strftime('%d/%m/%Y %H:%M:%S') if sell_tx.create_date else 'N/A',
                            'sell_source': sell_source,  # Thêm trường source từ transaction
                    
                            'matched_ccq': min(getattr(buy_tx, 'matched_units', 0), getattr(sell_tx, 'matched_units', 0)),
                            'matched_price': getattr(sell_tx, 'current_nav', 0) or 0,
                    'fund_name': buy_tx.fund_id.name if buy_tx.fund_id else 'N/A',
                    'interest_rate': getattr(buy_tx, 'interest_rate', 0) or 0,
                    'term': getattr(buy_tx, 'term', 0) or 0,
                            'match_time': buy_tx.create_date.strftime('%d/%m/%Y %H:%M:%S') if buy_tx.create_date else 'N/A',
                    
                    '_sourceType': 'investor',  # Mặc định từ engine khớp lệnh
                    '_pairType': f'{buy_user_type}_{sell_user_type}',
                    '_buyUserType': buy_user_type,
                    '_sellUserType': sell_user_type
                }
                
                print(f"[DEBUG] Created actual pair: buy_user_type={buy_user_type}, sell_user_type={sell_user_type}, _pairType={pair['_pairType']}")
                matched_pairs.append(pair)
                used_sells.add(sell_tx.id)
                break
            
            used_sells.add(buy_tx.id)
            
            # Nếu không có pairs thực sự, tạo single pairs như cũ
            if not matched_pairs:
                print("[DEBUG] Không tìm thấy pairs thực sự, tạo single pairs")
                for tx in all_matched_transactions:
                    # Xác định loại user dựa trên user_id và partner_id
                    def is_market_maker_user_single(user_id, partner_id):
                        """Xác định xem user có phải là market maker không"""
                        if not user_id:
                            return False
                        
                        # Kiểm tra tên user hoặc partner
                        user_name = user_id.name.lower() if user_id.name else ''
                        partner_name = partner_id.name.lower() if partner_id and partner_id.name else ''
                        
                        # Market maker thường có tên chứa các từ khóa đặc biệt
                        market_maker_keywords = [
                            'market', 'maker', 'system', 'auto', 'bot', 
                            'admin', 'internal', 'mm', 'trading', 'liquidity'
                        ]
                        
                        for keyword in market_maker_keywords:
                            if keyword in user_name or keyword in partner_name:
                                return True
                        
                        # Kiểm tra email domain (nếu có)
                        if user_id.email:
                            email_domain = user_id.email.split('@')[1].lower() if '@' in user_id.email else ''
                            if 'system' in email_domain or 'internal' in email_domain:
                                return True
                        
                        return False
                    
                    # Xác định loại user
                    user_type = 'market_maker' if is_market_maker_user_single(tx.user_id, tx.user_id.partner_id if tx.user_id else None) else 'investor'
                    
                    # Fallback: chỉ 'sale' là market maker; còn lại coi là investor
                    if user_type == 'investor' and hasattr(tx, 'source'):
                        if tx.source == 'sale':
                            user_type = 'market_maker'
                    
                    print(f"[DEBUG] Single pair user type: {user_type}")
                    print(f"[DEBUG] User: {tx.user_id.name if tx.user_id else 'N/A'}, partner: {tx.user_id.partner_id.name if tx.user_id and tx.user_id.partner_id else 'N/A'}")
                    
                    # Lấy tên người dùng từ bảng danh sách
                    investor_name = 'N/A'
                    
                    # Thử lấy từ transaction list model
                    try:
                        transaction_list = request.env['portfolio.transaction'].browse(tx.id)
                        if hasattr(transaction_list, 'investor_name') and transaction_list.investor_name:
                            investor_name = transaction_list.investor_name
                            print(f"[DEBUG] Using transaction_list.investor_name: {investor_name}")
                        elif transaction_list.user_id and transaction_list.user_id.partner_id:
                            investor_name = transaction_list.user_id.partner_id.name or 'N/A'
                            print(f"[DEBUG] Using transaction_list.user_id.partner_id.name: {investor_name}")
                        elif transaction_list.user_id:
                            investor_name = transaction_list.user_id.name or 'N/A'
                            print(f"[DEBUG] Using transaction_list.user_id.name: {investor_name}")
                    except Exception as e:
                        print(f"[DEBUG] Error getting investor name: {e}")
                        # Fallback to original method
                        if tx.user_id and tx.user_id.partner_id:
                            investor_name = tx.user_id.partner_id.name or 'N/A'
                        elif tx.user_id:
                            investor_name = tx.user_id.name or 'N/A'
                    
                    # Tạo pair đơn giản từ mỗi transaction
                    # Debug: Log source information for single pair
                    tx_source = getattr(tx, 'source', 'portal')
                    print(f"[DEBUG] Single pair sources: tx.id={tx.id}, tx_source={tx_source}, transaction_type={tx.transaction_type}, user_type={user_type}")
                    
                    pair = {
                        'buy_id': tx.id if tx.transaction_type == 'purchase' else 'N/A',
                        'sell_id': tx.id if tx.transaction_type == 'sell' else 'N/A',
                        'buy_investor': investor_name if tx.transaction_type == 'purchase' else 'N/A',
                        'buy_name': investor_name if tx.transaction_type == 'purchase' else 'N/A',
                        'sell_investor': investor_name if tx.transaction_type == 'sell' else 'N/A',
                        'sell_name': investor_name if tx.transaction_type == 'sell' else 'N/A',
                        'buy_nav': getattr(tx, 'current_nav', 0) or 0 if tx.transaction_type == 'purchase' else 0,
                        'sell_nav': getattr(tx, 'current_nav', 0) or 0 if tx.transaction_type == 'sell' else 0,
                        'buy_amount': getattr(tx, 'amount', 0) or 0 if tx.transaction_type == 'purchase' else 0,
                        'sell_amount': getattr(tx, 'amount', 0) or 0 if tx.transaction_type == 'sell' else 0,
                        'buy_units': getattr(tx, 'units', 0) or 0 if tx.transaction_type == 'purchase' else 0,
                        'sell_units': getattr(tx, 'units', 0) or 0 if tx.transaction_type == 'sell' else 0,
                        'matched_ccq': getattr(tx, 'matched_units', 0),
                        'matched_price': getattr(tx, 'current_nav', 0) or 0,
                        'fund_name': tx.fund_id.name if tx.fund_id else 'N/A',
                        'interest_rate': getattr(tx, 'interest_rate', 0) or 0,
                        'term': getattr(tx, 'term', 0) or 0,
                        'buy_in_time': tx.create_date.strftime('%d/%m/%Y %H:%M:%S') if tx.create_date else 'N/A',
                        'sell_in_time': tx.create_date.strftime('%d/%m/%Y %H:%M:%S') if tx.create_date else 'N/A',
                        'buy_source': tx_source if tx.transaction_type == 'purchase' else 'N/A',  # Thêm trường source từ transaction
                        'sell_source': tx_source if tx.transaction_type == 'sell' else 'N/A',  # Thêm trường source từ transaction
                        'match_time': tx.create_date.strftime('%d/%m/%Y %H:%M:%S') if tx.create_date else 'N/A',
                        '_sourceType': 'market_maker' if user_type == 'market_maker' else 'investor',
                        '_pairType': f'{user_type}_single',
                        '_buyUserType': user_type if tx.transaction_type == 'purchase' else 'N/A',
                        '_sellUserType': user_type if tx.transaction_type == 'sell' else 'N/A'
                    }
                    
                    print(f"[DEBUG] Created single pair: user_type={user_type}, transaction_type={tx.transaction_type}, _pairType={pair['_pairType']}")
                    matched_pairs.append(pair)
            
            print(f"[DEBUG] Created {len(matched_pairs)} matched pairs (simplified approach)")
            
            # Đếm tổng số cặp để tính phân trang
            total_pairs = len(matched_pairs)
            total_pages = (total_pairs + limit - 1) // limit
            
            response_data = {
                'success': True,
                'matched_pairs': matched_pairs,
                'pagination': {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_pairs': total_pairs,
                'limit': limit
            }
            }
            
            print(f"[DEBUG] Returning response: {len(matched_pairs)} pairs")
            
            # Trả về HTTP response
            return request.make_response(
                json.dumps(response_data, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=200
            )
            
        except Exception as e:
            import traceback
            print(f"[ERROR] Lỗi trong get_matched_pairs: {str(e)}")
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            
            # Trả về HTTP error response
            return request.make_response(
                json.dumps({'success': False, 'message': f'Lỗi khi lấy danh sách cặp lệnh: {str(e)}'}, ensure_ascii=False),
                headers=[("Content-Type", "application/json")],
                status=500
            )