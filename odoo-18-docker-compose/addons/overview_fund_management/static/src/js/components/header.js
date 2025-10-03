/** @odoo-module **/
import { Component, xml, useState, onMounted, onPatched } from "@odoo/owl";

export class Header extends Component {
    static template = xml`
    <header class="hd-header shadow-lg" style="position:relative; overflow:visible; z-index:2000;">
      <div class="container-fluid d-flex align-items-center justify-content-between py-3 px-4 bg-white rounded-top-4 border-bottom border-light" style="overflow:visible;">
        <div class="d-flex align-items-center gap-4">
          <img t-att-src="'/overview_fund_management/static/src/img/hdcapital_logo.png'" alt="HDCapital Logo" style="height:60px;max-width:200px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1));"/>
        </div>
        <div class="d-flex align-items-center gap-4">
          <t t-if="state.isLoggedIn">
            <div class="d-flex align-items-center gap-3 hd-user-menu position-relative" id="accountDropdownWrapper" style="position:relative; z-index:3000;">
              <div class="hd-avatar rounded-circle d-flex align-items-center justify-content-center text-white fs-5 shadow-sm" style="width:48px;height:48px;background:linear-gradient(135deg, #f97316, #ea580c);border:2px solid rgba(255,255,255,0.2);">
                <i class="fas fa-user"></i>
              </div>
              <div class="d-none d-md-block text-end">
                <div class="fw-bold text-dark text-uppercase small mb-1" style="letter-spacing:0.5px;"><t t-esc="state.userName"/></div>
                <div class="text-muted small" style="font-size:11px;">SỐ TK: <span class="fw-semibold text-dark"><t t-esc="state.accountNo"/></span></div>
              </div>
              <i class="fas fa-chevron-down text-muted transition-all" style="font-size:12px;transition:all 0.2s ease;"></i>
              <div class="dropdown-menu shadow-lg border-0 rounded-3" id="accountDropdown" style="display: none; right:0; min-width:240px; top:120%; border-radius:16px !important; z-index:4000;">
                <div class="dropdown-item-text px-4 py-3">
                  <small class="text-muted d-block mb-1"><t t-esc="state.userName"/></small>
                  <div class="fw-bold text-dark">Nhà Đầu Tư</div>
                </div>
                <div class="dropdown-divider my-2"></div>
                <a class="dropdown-item px-4 py-2 transition-all" href="/personal_profile" style="transition:all 0.2s ease;">
                  <i class="fas fa-user-edit me-3 text-muted"></i>Thông tin cá nhân
                </a>
                <a class="dropdown-item px-4 py-2 transition-all" href="#" t-on-click="logout" style="transition:all 0.2s ease;color:#f97316;">
                  <i class="fas fa-sign-out-alt me-3"></i>Đăng xuất
                </a>
              </div>
            </div>
          </t>
          <t t-else="">
            <button class="btn btn-primary px-4 py-2 rounded-pill shadow-sm transition-all" t-on-click="() => window.location.href='/web/login'" style="background:linear-gradient(135deg, #f97316, #ea580c);border:none;transition:all 0.3s ease;">
              <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập
            </button>
          </t>
        </div>
      </div>
      <div class="hd-menu-bar rounded-bottom-4 px-4 py-3 mt-n1 shadow-sm" style="background:linear-gradient(135deg, #f97316, #ea580c); position:relative; z-index:1000;">
        <nav class="d-flex gap-4 justify-content-center align-items-center">
          <a t-attf-class="hd-menu-item #{state.currentPage === 'overview' ? 'active' : ''}" href="/investment_dashboard" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <i class="fas fa-home me-2"></i>TỔNG QUAN
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'products' ? 'active' : ''}" href="/fund_widget" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <i class="fas fa-chart-line me-2"></i>SẢN PHẨM ĐẦU TƯ
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'transactions' ? 'active' : ''}" href="/transaction_management/pending" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <span class="fw-bold fs-5 me-2">$</span>QUẢN LÝ GIAO DỊCH
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'assets' ? 'active' : ''}" href="/asset-management" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <i class="far fa-clock me-2"></i>QUẢN LÝ TÀI SẢN
          </a>
          <a t-attf-class="hd-menu-item #{state.currentPage === 'profile' ? 'active' : ''}" href="/personal_profile" style="color:rgba(255,255,255,0.95);text-decoration:none;padding:10px 18px;border-radius:24px;transition:all 0.3s ease;font-weight:500;font-size:14px;letter-spacing:0.3px;">
            <i class="far fa-file-alt me-2"></i>HỒ SƠ CÁ NHÂN
          </a>
        </nav>
      </div>
    </header>
    `;

    setup() {
        this.listenersAttached = false;
        this.state = useState({
            currentPage: this.getCurrentPage(),
            userName: '',
            accountNo: '',
            isLoggedIn: false,
        });
        this.fetchUserInfo();

        onPatched(() => {
            if (this.state.isLoggedIn && !this.listenersAttached) {
                const wrapper = document.getElementById('accountDropdownWrapper');
                const dropdown = document.getElementById('accountDropdown');
                if (wrapper && dropdown) {
                    wrapper.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                    });
                    document.addEventListener('click', (e) => {
                        if (!wrapper.contains(e.target)) {
                            dropdown.style.display = 'none';
                        }
                    });
                    this.listenersAttached = true;
                }
            }

            // Thêm CSS cho hiệu ứng hover và z-index
            this.addHoverStyles();

            if (this.state.isLoggedIn && (window.location.pathname === '/web' || window.location.pathname === '/web/')) {
                window.location.href = '/investment_dashboard';
            }
        });
    }

    addHoverStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Base state: luôn in đậm */
            .hd-menu-item { font-weight: 600 !important; color: rgba(255,255,255,0.98) !important; }
            .hd-menu-item i { color: rgba(255,255,255,0.98) !important; }

            /* Hover */
            .hd-menu-item:hover { background-color: #fff !important; color: #f97316 !important; font-weight: 700 !important; box-shadow: 0 4px 14px rgba(0,0,0,0.12); transform: none; }
            .hd-menu-item:hover i { color: #f97316 !important; }

            /* Active */
            .hd-menu-item.active { background-color: #fff !important; color: #f97316 !important; font-weight: 700 !important; box-shadow: 0 6px 18px rgba(0,0,0,0.15); transform: none; }
            .hd-menu-item.active i { color: #f97316 !important; }

            .dropdown-item:hover { background-color: #f8f9fa !important; transform: translateX(4px); border-radius: 8px; }
            .hd-user-menu:hover .fa-chevron-down { transform: rotate(180deg); }
            .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(249,115,22,0.4) !important; }
            .hd-avatar { transition: all 0.3s ease; }
            .hd-avatar:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(249,115,22,0.3); }
            .hd-header, .hd-header .container-fluid, .hd-menu-bar { overflow: visible !important; }
            #accountDropdownWrapper { position: relative; z-index: 3000; }
            #accountDropdown { z-index: 4000 !important; }
            .hd-menu-bar { z-index: 1000; }
        `;
        document.head.appendChild(style);
    }

    async fetchUserInfo() {
        try {
            const response = await fetch('/web/session/get_session_info', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: '{}'
            });
            const data = await response.json();
            if (data.result && data.result.uid) {
                this.state.userName = data.result.name;
                const soTk = await this.fetchStatusInfo();
                this.state.accountNo = soTk || '';
                this.state.isLoggedIn = true;
            } else {
                this.state.userName = '';
                this.state.accountNo = '';
                this.state.isLoggedIn = false;
            }
        } catch (e) {
            this.state.userName = '';
            this.state.accountNo = '';
            this.state.isLoggedIn = false;
        }
    }

    async fetchStatusInfo() {
        try {
            const response = await fetch('/get_status_info', {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            });
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
                return data[0].so_tk || '';
            } else if (data && data.so_tk) {
                return data.so_tk;
            }
            return '';
        } catch (e) {
            return '';
        }
    }

    async logout() {
        await fetch('/web/session/destroy', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{}'
        });
        window.location.href = '/web/login';
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/investment_dashboard')) return 'overview';
        if (path.includes('/fund_widget')) return 'products';
        if (path.includes('/transaction_management')) return 'transactions';
        if (path.includes('/asset-management')) return 'assets';
        if (path.includes('/personal_profile')) return 'profile';
        return 'overview';
    }
}

window.Header = Header;
