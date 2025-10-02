odoo.define('custom_auth.login_override', function (require) {
    'use strict';

    var core = require('web.core');
    var session = require('web.session');
    var ajax = require('web.ajax');
    var webClient = require('web.web_client');

    var _t = core._t;

    /**
     * Override login redirect behavior
     */
    function overrideLoginRedirect() {
        // Override web_client để xử lý điều hướng sau khi đăng nhập
        var originalDoAction = webClient.prototype.doAction;
        
        webClient.prototype.doAction = function (action, options) {
            // Kiểm tra nếu action là login redirect
            if (action && action.type === 'ir.actions.client' && action.tag === 'login') {
                // Xử lý điều hướng dựa trên loại người dùng
                handleLoginRedirect();
                return;
            }
            
            // Gọi phương thức gốc
            return originalDoAction.call(this, action, options);
        };
    }

    /**
     * Xử lý điều hướng sau khi đăng nhập
     */
    function handleLoginRedirect() {
        ajax.jsonRpc('/web/session/get_session_info', 'call', {})
            .then(function(result) {
                if (result.uid) {
                    // Kiểm tra loại người dùng
                    ajax.jsonRpc('/web/dataset/call_kw/res.users/has_group', 'call', {
                        model: 'res.users',
                        method: 'has_group',
                        args: [result.uid, 'base.group_portal'],
                        kwargs: {}
                    }).then(function(isPortal) {
                        if (isPortal) {
                            // Portal users -> investment_dashboard
                            window.location.href = '/investment_dashboard';
                        } else {
                            // Internal users -> investor_list
                            window.location.href = '/investor_list';
                        }
                    }).fail(function() {
                        // Fallback
                        window.location.href = '/web';
                    });
                }
            })
            .fail(function() {
                // Fallback
                window.location.href = '/web';
            });
    }

    /**
     * Khởi tạo
     */
    function init() {
        overrideLoginRedirect();
        
        // Kiểm tra nếu đang ở trang /web sau khi đăng nhập
        if (window.location.pathname === '/web' || window.location.pathname === '/web/') {
            setTimeout(function() {
                handleLoginRedirect();
            }, 1000); // Delay 1 giây để đảm bảo session đã được load
        }
    }

    // Khởi tạo khi DOM ready
    $(document).ready(function() {
        init();
    });

    return {
        overrideLoginRedirect: overrideLoginRedirect,
        handleLoginRedirect: handleLoginRedirect,
        init: init
    };
}); 