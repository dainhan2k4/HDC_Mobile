/** @odoo-module **/

import { Component, xml, useState, onMounted } from "@odoo/owl";

export class Header extends Component {
    static template = xml`
        <header class="bg-[#1E40AF]">
            <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-14">
                    <div class="flex items-center space-x-3">
                        <div class="w-9 h-9 rounded-md bg-gradient-to-br from-[#FF9F00] to-[#FFB800] flex items-center justify-center">
                            <img alt="Icon with upward trending graph in white on orange background" class="w-4 h-4" height="16" src="https://storage.googleapis.com/a1aa/image/5d767c39-1f90-4155-042e-11b0c1d56bec.jpg" width="16"/>
                        </div>
                        <span class="text-white font-semibold text-lg select-none">
                            FundManager Pro
                        </span>
                    </div>
                    <div class="flex-1 mx-6 max-w-md">
                        <div class="relative">
                            <input class="w-full rounded-md bg-[#3B5BDB]/30 placeholder-white placeholder-opacity-70 text-white py-2 pl-4 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/70" placeholder="Tìm kiếm cổ phiếu, quỹ, báo cáo..." type="text"/>
                            <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <i class="fas fa-search text-white text-opacity-50"></i>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-6">
                        <button aria-label="Notifications" class="relative text-white text-xl focus:outline-none">
                            <i class="fas fa-bell"></i>
                            <span class="absolute -top-1 -right-2 bg-[#FF3B30] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center leading-none select-none">2</span>
                        </button>
                        <div class="relative" x-data="{ open: false }" id="accountDropdownWrapper">
                            <button id="accountButton" aria-haspopup="true" aria-expanded="false" class="flex items-center space-x-2 cursor-pointer select-none text-white font-semibold text-sm focus:outline-none" type="button">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF9F00] to-[#FFB800] flex items-center justify-center text-white font-semibold text-lg">
                                    <i class="fas fa-user"></i>
                                </div>
                                <span>Nguyễn Văn A</span>
                                <i class="fas fa-chevron-down text-white text-xs"></i>
                            </button>
                            <div aria-label="Account dropdown menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20" id="accountDropdown" role="menu" tabindex="-1">
                                <div class="py-1" role="none">
                                    <div class="px-4 py-2 text-xs text-gray-400 select-none">Nguyễn Văn A</div>
                                    <div class="px-4 py-2 text-sm font-semibold text-gray-900 select-none border-b border-gray-200">Fund Manager</div>
                                    <a class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" href="#" role="menuitem" tabindex="-1" id="menu-item-1">Thông tin cá nhân</a>
                                    <a class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" href="#" role="menuitem" tabindex="-1" id="menu-item-2">Cài đặt</a>
                                    <a class="block px-4 py-2 text-sm text-red-600 hover:bg-red-100" href="#" role="menuitem" tabindex="-1" id="menu-item-3">Đăng xuất</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <nav class="bg-white shadow-sm">
                <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <ul class="flex space-x-8 border-b border-gray-200">
                        <li>
                            <a t-attf-class="inline-flex items-center #{state.currentPage === 'overview' ? 'border-b-2 border-[#3B5BDB] text-[#3B5BDB] font-semibold' : 'text-gray-700 hover:text-[#3B5BDB] font-normal'} py-3 text-sm transition-colors duration-200" href="/investment_dashboard">
                                <i class="fas fa-chart-line mr-2"></i>
                                <span class="font-bold uppercase">Tổng quan</span>
                            </a>
                        </li>
                        <li>
                            <a t-attf-class="inline-flex items-center #{state.currentPage === 'products' ? 'border-b-2 border-[#3B5BDB] text-[#3B5BDB] font-semibold' : 'text-gray-700 hover:text-[#3B5BDB] font-normal'} py-3 text-sm transition-colors duration-200" href="/fund_widget">
                                <i class="fas fa-box-open mr-2"></i>
                                <span class="font-bold uppercase">Sản phẩm đầu tư</span>
                            </a>
                        </li>
                        <li>
                            <a t-attf-class="inline-flex items-center #{state.currentPage === 'transactions' ? 'border-b-2 border-[#3B5BDB] text-[#3B5BDB] font-semibold' : 'text-gray-700 hover:text-[#3B5BDB] font-normal'} py-3 text-sm transition-colors duration-200" href="/transaction_management/pending">
                                <i class="fas fa-exchange-alt mr-2"></i>
                                <span class="font-bold uppercase">Quản lý giao dịch</span>
                            </a>
                        </li>
                        <li>
                            <a t-attf-class="inline-flex items-center #{state.currentPage === 'assets' ? 'border-b-2 border-[#3B5BDB] text-[#3B5BDB] font-semibold' : 'text-gray-700 hover:text-[#3B5BDB] font-normal'} py-3 text-sm transition-colors duration-200" href="/asset-management">
                                <i class="fas fa-wallet mr-2"></i>
                                <span class="font-bold uppercase">Quản lý tài sản</span>
                            </a>
                        </li>
                        <li>
                            <a t-attf-class="inline-flex items-center #{state.currentPage === 'profile' ? 'border-b-2 border-[#3B5BDB] text-[#3B5BDB] font-semibold' : 'text-gray-700 hover:text-[#3B5BDB] font-normal'} py-3 text-sm transition-colors duration-200" href="/personal_profile">
                                <i class="fas fa-id-card mr-2"></i>
                                <span class="font-bold uppercase">Hồ sơ cá nhân</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    `;

    setup() {
        this.state = useState({
            isDropdownOpen: false,
            currentPage: this.getCurrentPage()
        });

        onMounted(() => {
            const accountButton = document.getElementById('accountButton');
            const accountDropdown = document.getElementById('accountDropdown');

            if (accountButton && accountDropdown) {
                accountButton.addEventListener('click', () => {
                    const isHidden = accountDropdown.classList.contains('hidden');
                    if (isHidden) {
                        accountDropdown.classList.remove('hidden');
                        accountButton.setAttribute('aria-expanded', 'true');
                    } else {
                        accountDropdown.classList.add('hidden');
                        accountButton.setAttribute('aria-expanded', 'false');
                    }
                });

                // Close dropdown if clicked outside
                document.addEventListener('click', (event) => {
                    if (!accountButton.contains(event.target) && !accountDropdown.contains(event.target)) {
                        accountDropdown.classList.add('hidden');
                        accountButton.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        });
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