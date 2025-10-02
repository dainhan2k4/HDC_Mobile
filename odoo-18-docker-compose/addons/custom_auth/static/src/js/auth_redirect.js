odoo.define('custom_auth.auth_redirect', function (require) {
    'use strict';

    var core = require('web.core');
    var session = require('web.session');
    var ajax = require('web.ajax');

    var _t = core._t;

    /**
     * Chặn các link không mong muốn và điều hướng người dùng
     */
    function blockUnwantedLinks() {
        // Chặn các link đến /my, /my/home, /odoo
        var blockedUrls = ['/my', '/my/home', '/my/account', '/odoo'];
        
        // Xử lý tất cả các link trong trang
        document.addEventListener('click', function(e) {
            var target = e.target.closest('a');
            if (target && target.href) {
                var url = new URL(target.href);
                var path = url.pathname;
                
                // Kiểm tra nếu link bị chặn
                if (blockedUrls.some(blockedUrl => path.startsWith(blockedUrl))) {
                    e.preventDefault();
                    
                    // Điều hướng dựa trên loại người dùng
                    redirectBasedOnUserType();
                }
            }
        });

        // Xử lý navigation history
        window.addEventListener('popstate', function(e) {
            var currentPath = window.location.pathname;
            if (blockedUrls.some(blockedUrl => currentPath.startsWith(blockedUrl))) {
                redirectBasedOnUserType();
            }
        });
    }

    /**
     * Điều hướng người dùng dựa trên loại tài khoản
     */
    function redirectBasedOnUserType() {
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
                } else {
                    // Không đăng nhập -> về trang login
                    window.location.href = '/web/login';
                }
            })
            .fail(function() {
                // Fallback
                window.location.href = '/web';
            });
    }

    /**
     * Xử lý điều hướng sau khi đăng nhập
     */
    function handlePostLoginRedirect() {
        // Kiểm tra nếu vừa đăng nhập (URL chứa /web hoặc /odoo)
        if (window.location.pathname === '/web' || window.location.pathname === '/web/' || 
            window.location.pathname === '/odoo' || window.location.pathname === '/odoo/') {
            
            // Delay một chút để đảm bảo session đã được load
            setTimeout(function() {
                ajax.jsonRpc('/web/session/redirect_after_login', 'call', {})
                    .then(function(result) {
                        if (result.url && result.url !== window.location.pathname) {
                            window.location.href = result.url;
                        }
                    })
                    .fail(function() {
                        // Fallback - kiểm tra loại người dùng
                        redirectBasedOnUserType();
                    });
            }, 1000); // Delay 1 giây
        }
    }

    /**
     * Khởi tạo khi trang được load
     */
    function init() {
        // Chỉ chạy khi người dùng đã đăng nhập
        if (session.uid) {
            blockUnwantedLinks();
            handlePostLoginRedirect();
        }
    }

    // Khởi tạo khi DOM ready
    $(document).ready(function() {
        init();
    });

    return {
        blockUnwantedLinks: blockUnwantedLinks,
        redirectBasedOnUserType: redirectBasedOnUserType,
        handlePostLoginRedirect: handlePostLoginRedirect,
        init: init
    };
}); 