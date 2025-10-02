odoo.define('custom_auth.login', function (require) {
    'use strict';

    var publicWidget = require('web.public.widget');

    publicWidget.registry.CustomLogin = publicWidget.Widget.extend({
        selector: '[data-js="custom-login"]',
        events: {
            'click .password-toggle': '_onTogglePassword',
            'click .social-button': '_onSocialLogin',
            'submit form': '_onSubmitForm'
        },

        start: function () {
            this._super.apply(this, arguments);
            this._initPasswordToggle();
            this._initFormValidation();
            this._initBootstrapStyles();
            return this;
        },

        _initBootstrapStyles: function () {
            // Add Bootstrap CSS if not already loaded
            if (!document.querySelector('link[href*="bootstrap"]')) {
                var bootstrapLink = document.createElement('link');
                bootstrapLink.rel = 'stylesheet';
                bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
                document.head.appendChild(bootstrapLink);
            }

            // Add custom styles for enhanced Bootstrap appearance
            var customStyles = `
                <style>
                    .login-container {
                        min-height: 100vh;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .login-container::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: url('/custom_auth/static/src/img/background.jpg') center/cover;
                        opacity: 0.1;
                        z-index: 0;
                    }
                    
                    .login-card {
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(10px);
                        border-radius: 20px;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                        border: none;
                        overflow: hidden;
                    }
                    
                    .login-title {
                        font-size: 2.5rem;
                        font-weight: 700;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    
                    .form-control {
                        border-radius: 12px;
                        border: 2px solid #e9ecef;
                        padding: 0.75rem 1rem;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    }
                    
                    .form-control:focus {
                        border-color: #667eea;
                        box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                    }
                    
                    .form-label {
                        font-weight: 600;
                        color: #495057;
                        margin-bottom: 0.5rem;
                    }
                    
                    .btn-primary {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        border-radius: 12px;
                        padding: 0.75rem 1.5rem;
                        font-weight: 600;
                        font-size: 1.1rem;
                        transition: all 0.3s ease;
                    }
                    
                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                    }
                    
                    .btn-outline-primary {
                        border: 2px solid #667eea;
                        color: #667eea;
                        border-radius: 12px;
                        padding: 0.75rem 1.5rem;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    }
                    
                    .btn-outline-primary:hover {
                        background: #667eea;
                        border-color: #667eea;
                        transform: translateY(-2px);
                    }
                    
                    .password-toggle {
                        position: absolute;
                        right: 0.75rem;
                        top: 50%;
                        transform: translateY(-50%);
                        background: none;
                        border: none;
                        color: #6c757d;
                        transition: color 0.3s ease;
                    }
                    
                    .password-toggle:hover {
                        color: #667eea;
                    }
                    
                    .login-illustration {
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .login-illustration::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
                        z-index: 1;
                    }
                    
                    .login-illustration img {
                        position: relative;
                        z-index: 0;
                    }
                    
                    .error-message {
                        color: #dc3545;
                        font-size: 0.875rem;
                        margin-top: 0.25rem;
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                    }
                    
                    .form-control.error {
                        border-color: #dc3545;
                        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
                    }
                    
                    .form-control.success {
                        border-color: #198754;
                        box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
                    }
                    
                    .social-button {
                        border-radius: 12px;
                        padding: 0.75rem 1.5rem;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    }
                    
                    .social-button:hover {
                        transform: translateY(-2px);
                        text-decoration: none;
                    }
                    
                    .btn-google {
                        background: #fff;
                        color: #757575;
                        border: 2px solid #e0e0e0;
                    }
                    
                    .btn-google:hover {
                        background: #f8f9fa;
                        color: #757575;
                        border-color: #d0d0d0;
                    }
                    
                    .btn-facebook {
                        background: #1877f2;
                        color: #fff;
                        border: 2px solid #1877f2;
                    }
                    
                    .btn-facebook:hover {
                        background: #166fe5;
                        color: #fff;
                        border-color: #166fe5;
                    }
                    
                    @media (max-width: 991.98px) {
                        .login-card {
                            margin: 1rem;
                        }
                        
                        .login-title {
                            font-size: 2rem;
                        }
                    }
                    
                    @media (max-width: 575.98px) {
                        .login-card {
                            margin: 0.5rem;
                            border-radius: 15px;
                        }
                        
                        .login-title {
                            font-size: 1.75rem;
                        }
                        
                        .form-control {
                            font-size: 0.95rem;
                            padding: 0.625rem 0.875rem;
                        }
                    }
                </style>
            `;
            
            if (!document.querySelector('#custom-login-styles')) {
                var styleElement = document.createElement('div');
                styleElement.id = 'custom-login-styles';
                styleElement.innerHTML = customStyles;
                document.head.appendChild(styleElement);
            }
        },

        _initPasswordToggle: function () {
            var self = this;
            // Use event delegation for better performance
            this.$el.on('click', '.password-toggle', function (e) {
                e.preventDefault();
                e.stopPropagation();
                self._togglePasswordVisibility($(this));
            });
            
            // Add keyboard support
            this.$el.on('keydown', '.password-toggle', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    self._togglePasswordVisibility($(this));
                }
            });
        },

        _togglePasswordVisibility: function (toggleButton) {
            var passwordInput = toggleButton.siblings('input[type="password"], input[type="text"]');
            var icon = toggleButton.find('i');
            
            if (passwordInput.attr('type') === 'password') {
                passwordInput.attr('type', 'text');
                icon.removeClass('fa-eye-slash').addClass('fa-eye');
                toggleButton.attr('aria-label', 'Ẩn mật khẩu');
                toggleButton.addClass('password-visible');
                
                // Auto-hide password after 3 seconds for security
                setTimeout(function () {
                    if (passwordInput.attr('type') === 'text') {
                        passwordInput.attr('type', 'password');
                        icon.removeClass('fa-eye').addClass('fa-eye-slash');
                        toggleButton.attr('aria-label', 'Hiển thị mật khẩu');
                        toggleButton.removeClass('password-visible');
                    }
                }, 3000);
                
            } else {
                passwordInput.attr('type', 'password');
                icon.removeClass('fa-eye').addClass('fa-eye-slash');
                toggleButton.attr('aria-label', 'Hiển thị mật khẩu');
                toggleButton.removeClass('password-visible');
            }
        },

        _initFormValidation: function () {
            var self = this;
            
            // Real-time validation
            this.$('input[type="email"]').on('blur', function () {
                self._validateEmail($(this));
            });
            
            this.$('input[type="password"]').on('blur', function () {
                self._validatePassword($(this));
            });
        },

        _validateEmail: function (emailInput) {
            var email = emailInput.val();
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this._showError(emailInput, '<i class="fas fa-exclamation-circle"></i> Email không hợp lệ');
                return false;
            } else {
                this._hideError(emailInput);
                return true;
            }
        },

        _validatePassword: function (passwordInput) {
            var password = passwordInput.val();
            
            if (password && password.length < 6) {
                this._showError(passwordInput, '<i class="fas fa-exclamation-circle"></i> Mật khẩu phải có ít nhất 6 ký tự');
                return false;
            } else {
                this._hideError(passwordInput);
                return true;
            }
        },

        _showError: function (input, message) {
            var errorDiv = input.siblings('.error-message');
            if (errorDiv.length === 0) {
                errorDiv = $('<div class="error-message"></div>');
                input.after(errorDiv);
            }
            errorDiv.html(message);
            input.removeClass('success').addClass('error');
        },

        _hideError: function (input) {
            input.siblings('.error-message').remove();
            input.removeClass('error');
        },

        _onSubmitForm: function (e) {
            var emailInput = this.$('input[type="email"]');
            var passwordInput = this.$('input[type="password"]');
            
            var isEmailValid = this._validateEmail(emailInput);
            var isPasswordValid = this._validatePassword(passwordInput);
            
            if (!isEmailValid || !isPasswordValid) {
                e.preventDefault();
                return false;
            }
            
            // Show loading state
            var submitButton = this.$('.btn-primary');
            var originalText = submitButton.text();
            submitButton.html('<i class="fas fa-spinner fa-spin me-2"></i>Đang đăng nhập...').prop('disabled', true);
            
            // Re-enable after a delay (in case of error)
            setTimeout(function () {
                submitButton.html(originalText).prop('disabled', false);
            }, 3000);
        },

        _onSocialLogin: function (e) {
            e.preventDefault();
            var provider = $(e.currentTarget).data('provider');
            
            // Show loading state
            var button = $(e.currentTarget);
            var originalContent = button.html();
            button.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
            
            // Simulate social login (replace with actual implementation)
            setTimeout(function () {
                button.html(originalContent).prop('disabled', false);
                // Redirect to social login URL or show message
                console.log('Social login with:', provider);
            }, 2000);
        },

        _onTogglePassword: function (e) {
            e.preventDefault();
            this._togglePasswordVisibility($(e.currentTarget));
        }
    });

    return publicWidget.registry.CustomLogin;
}); 