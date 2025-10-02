import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class URLBlockerController(http.Controller):
    """
    Controller để chặn truy cập vào các URL không mong muốn
    và điều hướng người dùng về trang phù hợp
    """
    
    @http.route(['/my', '/my/home'], type='http', auth='user', website=True)
    def block_my_home(self, **kw):
        """Chặn truy cập vào /my và /my/home"""
        user = request.env.user
        
        # Điều hướng dựa trên loại người dùng
        if user.has_group('base.group_portal'):
            return request.redirect('/investment_dashboard')
        elif user.has_group('base.group_user'):
            return request.redirect('/investor_list')
        else:
            return request.redirect('/web')
    
    @http.route('/my/account', type='http', auth='user', website=True)
    def block_my_account(self, **kw):
        """Chặn truy cập vào /my/account"""
        user = request.env.user
        
        # Điều hướng dựa trên loại người dùng
        if user.has_group('base.group_portal'):
            return request.redirect('/investment_dashboard')
        elif user.has_group('base.group_user'):
            return request.redirect('/investor_list')
        else:
            return request.redirect('/web')
    
    @http.route('/odoo', type='http', auth='user', website=True)
    def block_odoo(self, **kw):
        """Chặn truy cập vào /odoo"""
        user = request.env.user
        
        # Điều hướng dựa trên loại người dùng
        if user.has_group('base.group_portal'):
            return request.redirect('/investment_dashboard')
        elif user.has_group('base.group_user'):
            return request.redirect('/investor_list')
        else:
            return request.redirect('/web') 