/** @odoo-module **/

import { Component, useState, mount, App } from "@odoo/owl";
import { xml } from "@odoo/owl";

/**
 * Trading Portal Page - Component duy nhất render toàn bộ layout
 */
export class TradingPortalPage extends Component {
    static template = xml`
        <div class="container-fluid py-4">
            <div class="container">
                <!-- Page Header -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-wallet fa-2x text-primary me-3"></i>
                            <div>
                                <h1 class="h3 mb-0">Tài khoản giao dịch</h1>
                                <p class="text-muted mb-0">Quản lý số dư tài khoản và liên kết tài khoản</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Account Balance Section -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm">
                            <div class="card-header bg-primary text-white">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">
                                        <i class="fas fa-wallet me-2"></i>Số dư tài khoản
                                    </h5>
                                    <button class="btn btn-outline-light btn-sm" t-on-click="refreshBalance" t-att-disabled="state.balanceLoading">
                                        <i class="fas fa-sync-alt me-2" t-att-class="{'fa-spin': state.balanceLoading}"></i>Làm mới
                                    </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <!-- Balance Loading -->
                                <t t-if="state.balanceLoading">
                                    <div class="text-center py-5">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Đang tải...</span>
                                        </div>
                                        <p class="mt-3 text-muted">Đang tải số dư...</p>
                                    </div>
                                </t>
                                
                                <!-- Balance Error -->
                                <t t-elif="state.balanceError">
                                    <div class="alert alert-danger" role="alert">
                                        <i class="fas fa-exclamation-circle me-2"></i>
                                        <strong>Lỗi:</strong> <t t-esc="state.balanceError"/>
                                    </div>
                                </t>
                                
                                <!-- Balance Display as SSI-style cards -->
                                <t t-elif="state.balance">
                                    <div class="row g-3">
                                        <t t-foreach="getBalanceTiles()" t-as="tile" t-key="tile.key">
                                            <div class="col-12 col-md-8 col-lg-6">
                                                <div class="balance-card-tile" t-att-class="tile.cssClass">
                                                    <div class="tile-top">
                                                        <div class="tile-account"><t t-esc="tile.accountLabel"/></div>
                                                    </div>
                                                    <div class="tile-middle">
                                                        <div class="tile-label"><t t-esc="tile.valueLabel"/></div>
                                                        <div class="tile-value"><t t-esc="formatCurrency(tile.value || 0)"/></div>
                                                    </div>
                                                    <img class="tile-logo" src="/stock_trading/static/src/img/logo_ssi.png" alt="SSI"/>
                                                </div>
                                            </div>
                                        </t>
                                    </div>
                                    <t t-if="state.balance.last_sync">
                                        <div class="mt-3 text-center">
                                            <small class="text-muted">
                                                <i class="fas fa-clock me-1"></i>Cập nhật lần cuối: <t t-esc="state.balance.last_sync"/>
                                            </small>
                                        </div>
                                    </t>
                                </t>
                                
                                <!-- Empty Balance -->
                                <t t-else="">
                                    <div class="text-center py-5">
                                        <div class="mb-3">
                                            <i class="fas fa-wallet fa-4x text-muted opacity-50"></i>
                                        </div>
                                        <h5 class="text-muted">Chưa có số dư</h5>
                                        <p class="text-muted">Vui lòng liên kết tài khoản để xem số dư</p>
                                    </div>
                                </t>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Link Account Section -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card shadow-sm">
                            <div class="card-header bg-success text-white">
                                <h5 class="mb-0">
                                    <i class="fas fa-link me-2"></i>Liên kết tài khoản
                                </h5>
                            </div>
                            <div class="card-body">
                                <div class="row g-3">
                                    <div class="col-md-4 col-sm-6">
                                        <div class="ssi-link-box" t-on-click="openLinkModal">
                                            <div class="ssi-logo-wrapper">
                                                <img src="/stock_trading/static/src/img/logo_ssi.png" alt="SSI Logo" class="ssi-logo"/>
                                            </div>
                                            <h5 class="mb-2">SSI</h5>
                                            <p class="text-muted mb-0 small">Nhấp để liên kết</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Modal Backdrop -->
                <t t-if="state.showModal">
                    <div class="modal-backdrop fade show" t-on-click="closeLinkModal"></div>
                </t>
                
                <!-- Link Account Modal -->
                <div class="modal fade" id="linkAccountModal" tabindex="-1" aria-labelledby="linkAccountModalLabel" aria-hidden="true" t-att-class="{'show': state.showModal, 'd-block': state.showModal}" t-att-style="state.showModal ? 'display: block;' : ''">
                    <div class="modal-dialog modal-lg modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title" id="linkAccountModalLabel">
                                    <i class="fas fa-link me-2"></i>Liên kết tài khoản
                                </h5>
                                <button type="button" class="btn-close btn-close-white" t-on-click="closeLinkModal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <!-- Link Account Success -->
                                <t t-if="state.linkSuccess">
                                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                                        <i class="fas fa-check-circle me-2"></i>
                                        <strong>Thành công!</strong> Đã liên kết tài khoản thành công. Trang sẽ tự động tải lại...
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>
                                </t>
                                
                                <!-- Link Account Error -->
                                <t t-if="state.linkError">
                                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                                        <i class="fas fa-exclamation-circle me-2"></i>
                                        <strong>Lỗi:</strong> <t t-esc="state.linkError"/>
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>
                                </t>
                                
                                <!-- Link Account Form -->
                                <form t-on-submit="onSubmit" class="needs-validation" novalidate="">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label for="consumer_id" class="form-label">
                                                <i class="fas fa-key me-2"></i>Consumer ID <span class="text-danger">*</span>
                                            </label>
                                            <input type="text" 
                                                   class="form-control" 
                                                   id="consumer_id" 
                                                   name="consumer_id" 
                                                   t-model="state.formData.consumer_id" 
                                                   required="required"
                                                   placeholder="Nhập Consumer ID từ SSI"/>
                                            <div class="invalid-feedback">
                                                Vui lòng nhập Consumer ID
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-6">
                                            <label for="consumer_secret" class="form-label">
                                                <i class="fas fa-lock me-2"></i>Consumer Secret <span class="text-danger">*</span>
                                            </label>
                                            <input type="password" 
                                                   class="form-control" 
                                                   id="consumer_secret" 
                                                   name="consumer_secret" 
                                                   t-model="state.formData.consumer_secret" 
                                                   required="required"
                                                   placeholder="Nhập Consumer Secret từ SSI"/>
                                            <div class="invalid-feedback">
                                                Vui lòng nhập Consumer Secret
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-6">
                                            <label for="account" class="form-label">
                                                <i class="fas fa-credit-card me-2"></i>Số tài khoản <span class="text-danger">*</span>
                                            </label>
                                            <input type="text" 
                                                   class="form-control" 
                                                   id="account" 
                                                   name="account" 
                                                   t-model="state.formData.account" 
                                                   required="required"
                                                   placeholder="Nhập số tài khoản SSI"/>
                                            <div class="invalid-feedback">
                                                Vui lòng nhập số tài khoản
                                            </div>
                                        </div>
                                        
                                        <div class="col-12">
                                            <label for="private_key" class="form-label">
                                                <i class="fas fa-file-code me-2"></i>Private Key (Base64) <span class="text-danger">*</span>
                                            </label>
                                            <textarea class="form-control" 
                                                      id="private_key" 
                                                      name="private_key" 
                                                      rows="6"
                                                      t-model="state.formData.private_key" 
                                                      required="required"
                                                      placeholder="Nhập Private Key từ SSI"></textarea>
                                            <div class="form-text">Vui lòng nhập Private Key từ SSI</div>
                                            <div class="invalid-feedback">
                                                Vui lòng nhập Private Key
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="text-center mt-4">
                                        <button type="submit" 
                                                class="btn btn-primary btn-lg px-5" 
                                                t-att-disabled="state.linkLoading">
                                            <t t-if="state.linkLoading">
                                                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Đang xử lý...
                                            </t>
                                            <t t-else="">
                                                <i class="fas fa-link me-2"></i>Liên kết tài khoản
                                            </t>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setup() {
        this.state = useState({
            // Balance state
            balance: window.tradingPortalData?.balance || null,
            balanceLoading: false,
            balanceError: null,
            
            // Link account state
            showModal: false,
            linkLoading: false,
            linkSuccess: false,
            linkError: null,
            formData: {
                consumer_id: window.tradingPortalData?.config?.consumer_id || '',
                consumer_secret: '',
                account: window.tradingPortalData?.config?.account || '',
                private_key: '',
            },
        });
    }
    
    getBalanceTiles() {
        const tiles = [];
        const accountLabel = this.state.formData?.account ? `Số TK ${this.state.formData.account}` : 'Số TK';
        // Available cash tile (primary)
        tiles.push({
            key: 'available_cash',
            cssClass: 'tile-cash',
            accountLabel,
            valueLabel: 'Số dư khả dụng',
            value: (this.state.balance?.available_cash ?? 0) || (this.state.balance?.purchasing_power ?? 0),
        });
        // Future tiles can be pushed here (margin/derivative/pp etc.) without changing template
        return tiles;
    }
    
    openLinkModal() {
        this.state.showModal = true;
        this.state.linkError = null;
        this.state.linkSuccess = false;
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
    
    closeLinkModal() {
        this.state.showModal = false;
        // Restore body scroll
        document.body.style.overflow = '';
    }
    
    async refreshBalance() {
        this.state.balanceLoading = true;
        this.state.balanceError = null;
        
        try {
            const response = await fetch('/my-account/get_balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({}),
            });
            
            // Kiểm tra response status
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Kiểm tra Content-Type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200));
                throw new Error('Server trả về dữ liệu không đúng định dạng');
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.state.balance = data.balance;
            } else {
                this.state.balanceError = data.message || 'Không thể lấy số dư';
            }
        } catch (error) {
            console.error('Error getting balance:', error);
            this.state.balanceError = 'Lỗi kết nối: ' + error.message;
        } finally {
            this.state.balanceLoading = false;
        }
    }
    
    getCSRFToken() {
        // Lấy CSRF token từ meta tag hoặc cookie
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            return csrfToken.getAttribute('content');
        }
        // Fallback: lấy từ cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrf_token' || name === '_csrf_token') {
                return value;
            }
        }
        return '';
    }
    
    async onSubmit(ev) {
        ev.preventDefault();
        
        this.state.linkLoading = true;
        this.state.linkError = null;
        this.state.linkSuccess = false;
        
        try {
            const response = await fetch('/my-account/link_account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify(this.state.formData),
            });
            
            // Kiểm tra response status
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Kiểm tra Content-Type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200));
                throw new Error('Server trả về dữ liệu không đúng định dạng');
            }
            
            const data = await response.json();
            
            if (data.status === 'success') {
                this.state.linkSuccess = true;
                // Reload page sau 2 giây
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                this.state.linkError = data.message || 'Không thể liên kết tài khoản';
                this.state.showModal = true; // Keep modal open to show error
            }
        } catch (error) {
            console.error('Error linking account:', error);
            this.state.linkError = 'Lỗi kết nối: ' + error.message;
            this.state.showModal = true; // Keep modal open to show error
        } finally {
            this.state.linkLoading = false;
        }
    }
    
    formatCurrency(value) {
        if (!value && value !== 0) return '0';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    }
}

// Auto-initialize main component when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const portalPageEl = document.getElementById('trading_portal_page');
    if (portalPageEl) {
        try {
            // Mount component using App
            const app = new App(TradingPortalPage);
            app.mount(portalPageEl);
        } catch (error) {
            console.error('Error mounting TradingPortalPage:', error);
            // Fallback: try direct mount
            try {
                mount(TradingPortalPage, portalPageEl);
            } catch (fallbackError) {
                console.error('Fallback mount also failed:', fallbackError);
            }
        }
    }
});
