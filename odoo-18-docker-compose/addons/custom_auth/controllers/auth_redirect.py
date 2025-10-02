import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class CustomAuthRedirectController(http.Controller):
    """
    Controller để xử lý điều hướng người dùng sau khi đăng nhập
    dựa trên loại tài khoản (portal vs internal)
    """
    
    @http.route('/web/login_redirect', type='http', auth='user', website=True)
    def login_redirect(self, **kw):
        """Route để điều hướng người dùng sau khi đăng nhập"""
        user = request.env.user
        
        # Kiểm tra loại người dùng và điều hướng
        if user.has_group('base.group_portal'):
            # Portal users -> điều hướng đến investment_dashboard
            return request.redirect('/investment_dashboard')
        elif user.has_group('base.group_user'):
            # Internal users -> điều hướng đến investor_list
            return request.redirect('/investor_list')
        else:
            # Fallback cho các loại người dùng khác
            return request.redirect('/web')
    
    @http.route('/web/session/redirect_after_login', type='json', auth='user')
    def redirect_after_login(self, **kw):
        """JSON endpoint để xác định URL điều hướng sau khi đăng nhập"""
        user = request.env.user
        
        if user.has_group('base.group_portal'):
            return {'url': '/investment_dashboard'}
        elif user.has_group('base.group_user'):
            return {'url': '/investor_list'}
        else:
            return {'url': '/web'} 