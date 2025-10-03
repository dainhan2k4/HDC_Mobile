/** @odoo-module */

import { OverviewFundManagementWidget } from './overview_fund_management_widget';
import { mount } from '@odoo/owl';
import { registry } from "@web/core/registry";

// Hàm tiện ích để quản lý spinner
function showSpinner() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const widgetContainer = document.getElementById('overview-fund-management-widget');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
    if (widgetContainer) {
        widgetContainer.style.display = 'none';
    }
}

function hideSpinner() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const widgetContainer = document.getElementById('overview-fund-management-widget');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    if (widgetContainer) {
        widgetContainer.style.display = 'block';
    }
}

function showError(message) {
    const widgetContainer = document.getElementById('overview-fund-management-widget');
    if (widgetContainer) {
        widgetContainer.innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
        widgetContainer.style.display = 'block';
    }
    hideSpinner();
}

// Đợi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - Initializing Overview Fund Management Widget...");
    
    // Hiển thị spinner ban đầu
    showSpinner();

    // Mount widget với dữ liệu từ window.allDashboardData
    if (window.allDashboardData) {
        try {
            console.log("Using window.allDashboardData:", window.allDashboardData);
            const widgetContainer = document.getElementById('overview-fund-management-widget');
            if (widgetContainer) {
                mount(OverviewFundManagementWidget, widgetContainer, {
                    props: window.allDashboardData
                });
                hideSpinner();
            } else {
                showError('Không tìm thấy container widget');
            }
        } catch (error) {
            console.error('Error mounting widget with window.allDashboardData:', error);
            showError('Có lỗi xảy ra khi tải dữ liệu: ' + error.message);
        }
    } else {
        console.log("No window.allDashboardData found, will use data attributes");
        // Nếu không có dữ liệu từ window, sẽ chờ init() được gọi
    }
});

function init() {
    console.log("Initializing Overview Fund Management Widget...");

    // Hiển thị spinner
    showSpinner();

    // Lấy widget container
    const widgetContainer = document.getElementById('overview-fund-management-widget');
    if (!widgetContainer) {
        console.error('Widget container not found');
        showError('Không tìm thấy container widget');
        return;
    }

    // Dữ liệu mặc định
    let data = {
        funds: [],
        transactions: [],
        total_investment: 0,
        total_current_value: 0,
        total_profit_loss_percentage: 0,
        chart_data: '{}'
    };

    try {
        // Lấy dữ liệu từ data attributes
        if (widgetContainer.dataset.funds) {
            data.funds = JSON.parse(widgetContainer.dataset.funds);
        }
        if (widgetContainer.dataset.transactions) {
            data.transactions = JSON.parse(widgetContainer.dataset.transactions);
        }
        if (widgetContainer.dataset.totalInvestment) {
            data.total_investment = parseFloat(widgetContainer.dataset.totalInvestment);
        }
        if (widgetContainer.dataset.totalCurrentValue) {
            data.total_current_value = parseFloat(widgetContainer.dataset.totalCurrentValue);
        }
        if (widgetContainer.dataset.totalProfitLossPercentage) {
            data.total_profit_loss_percentage = parseFloat(widgetContainer.dataset.totalProfitLossPercentage);
        }
        if (widgetContainer.dataset.chartData) {
            data.chart_data = widgetContainer.dataset.chartData;
        }
    } catch (e) {
        console.error("Error parsing data attributes:", e);
        showError('Có lỗi xảy ra khi phân tích dữ liệu: ' + e.message);
        return;
    }

    console.log("Data loaded:", data);

    try {
        console.log("Mounting widget...");
        // Mount widget với dữ liệu
        mount(OverviewFundManagementWidget, widgetContainer, {
            dev: true,
            props: data
        });
        console.log("Widget mounted successfully");
        hideSpinner();
    } catch (error) {
        console.error('Error mounting widget:', error);
        showError('Có lỗi xảy ra khi tải widget: ' + error.message);
    }
}

// Đăng ký hàm init để chạy khi Odoo sẵn sàng
registry.category("website_frontend_ready").add("overview_fund_management.init", init); 