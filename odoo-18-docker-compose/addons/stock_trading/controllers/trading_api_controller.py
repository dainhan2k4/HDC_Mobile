# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
import json
import logging

_logger = logging.getLogger(__name__)


class TradingAPIController(http.Controller):
    """REST API Controller cho trading operations"""
    
    @http.route('/api/trading/v1/order', type='json', auth='user', methods=['POST'], csrf=False)
    def create_order(self, **kwargs):
        """
        Tạo order mới
        
        Body:
        {
            "config_id": 1,
            "account": "123456",
            "instrument_code": "VIC",
            "market": "VN",
            "buy_sell": "B",
            "order_type": "stock",
            "order_type_detail": "LO",
            "price": 50000,
            "quantity": 100
        }
        """
        try:
            config_id = kwargs.get('config_id')
            if not config_id:
                return {'status': 'error', 'message': 'config_id is required'}
            
            config = request.env['trading.config'].browse(config_id)
            if not config.exists():
                return {'status': 'error', 'message': 'Config not found'}
            
            # Create order
            order = request.env['trading.order'].create({
                'config_id': config_id,
                'account': kwargs.get('account'),
                'instrument_code': kwargs.get('instrument_code'),
                'market': kwargs.get('market', 'VN'),
                'buy_sell': kwargs.get('buy_sell'),
                'order_type': kwargs.get('order_type', 'stock'),
                'order_type_detail': kwargs.get('order_type_detail', 'LO'),
                'price': kwargs.get('price'),
                'quantity': kwargs.get('quantity'),
            })
            
            # Link instrument if found
            instrument = request.env['ssi.securities'].search([
                ('symbol', '=', kwargs.get('instrument_code'))
            ], limit=1)
            if instrument:
                order.instrument_id = instrument.id
            
            # Submit order
            order.action_submit_order()
            
            return {
                'status': 'success',
                'order_id': order.id,
                'order_name': order.name,
                'api_order_id': order.api_order_id,
            }
        except Exception as e:
            _logger.error(f'Error creating order: {e}')
            return {'status': 'error', 'message': str(e)}
    
    @http.route('/api/trading/v1/order/<int:order_id>/cancel', type='json', auth='user', methods=['POST'], csrf=False)
    def cancel_order(self, order_id, **kwargs):
        """Hủy order"""
        try:
            order = request.env['trading.order'].browse(order_id)
            if not order.exists():
                return {'status': 'error', 'message': 'Order not found'}
            
            order.action_cancel_order()
            
            return {
                'status': 'success',
                'message': 'Order cancelled successfully',
            }
        except Exception as e:
            _logger.error(f'Error canceling order: {e}')
            return {'status': 'error', 'message': str(e)}
    
    @http.route('/api/trading/v1/balance', type='json', auth='user', methods=['POST'], csrf=False)
    def get_balance(self, **kwargs):
        """
        Lấy số dư tài khoản
        
        Body:
        {
            "config_id": 1,
            "account": "123456",
            "balance_type": "stock"
        }
        """
        try:
            config_id = kwargs.get('config_id')
            account = kwargs.get('account')
            balance_type = kwargs.get('balance_type', 'stock')
            
            if not config_id or not account:
                return {'status': 'error', 'message': 'config_id and account are required'}
            
            config = request.env['trading.config'].browse(config_id)
            if not config.exists():
                return {'status': 'error', 'message': 'Config not found'}
            
            # Create balance record
            balance = request.env['trading.account.balance'].create({
                'config_id': config_id,
                'account': account,
                'balance_type': balance_type,
            })
            
            # Sync balance
            balance.action_sync_balance()
            
            # Parse response
            import json
            response = json.loads(balance.raw_response) if balance.raw_response else {}
            
            return {
                'status': 'success',
                'data': response.get('data', {}),
            }
        except Exception as e:
            _logger.error(f'Error getting balance: {e}')
            return {'status': 'error', 'message': str(e)}
    
    @http.route('/api/trading/v1/position', type='json', auth='user', methods=['POST'], csrf=False)
    def get_position(self, **kwargs):
        """
        Lấy vị thế
        
        Body:
        {
            "config_id": 1,
            "account": "123456",
            "position_type": "stock"
        }
        """
        try:
            config_id = kwargs.get('config_id')
            account = kwargs.get('account')
            position_type = kwargs.get('position_type', 'stock')
            
            if not config_id or not account:
                return {'status': 'error', 'message': 'config_id and account are required'}
            
            config = request.env['trading.config'].browse(config_id)
            if not config.exists():
                return {'status': 'error', 'message': 'Config not found'}
            
            # Create position record
            position = request.env['trading.position'].create({
                'config_id': config_id,
                'account': account,
                'position_type': position_type,
            })
            
            # Sync position
            position.action_sync_position()
            
            # Parse response
            import json
            response = json.loads(position.raw_response) if position.raw_response else {}
            
            return {
                'status': 'success',
                'data': response.get('data', {}),
            }
        except Exception as e:
            _logger.error(f'Error getting position: {e}')
            return {'status': 'error', 'message': str(e)}
    
    @http.route('/api/trading/v1/order-book', type='json', auth='user', methods=['POST'], csrf=False)
    def get_order_book(self, **kwargs):
        """
        Lấy sổ lệnh
        
        Body:
        {
            "config_id": 1,
            "account": "123456",
            "book_type": "normal"
        }
        """
        try:
            config_id = kwargs.get('config_id')
            account = kwargs.get('account')
            book_type = kwargs.get('book_type', 'normal')
            
            if not config_id or not account:
                return {'status': 'error', 'message': 'config_id and account are required'}
            
            config = request.env['trading.config'].browse(config_id)
            if not config.exists():
                return {'status': 'error', 'message': 'Config not found'}
            
            # Create order book record
            order_book = request.env['trading.order.book'].create({
                'config_id': config_id,
                'account': account,
                'book_type': book_type,
            })
            
            # Sync order book
            order_book.action_sync_order_book()
            
            # Parse response
            import json
            response = json.loads(order_book.raw_response) if order_book.raw_response else {}
            
            return {
                'status': 'success',
                'data': response.get('data', {}),
            }
        except Exception as e:
            _logger.error(f'Error getting order book: {e}')
            return {'status': 'error', 'message': str(e)}

