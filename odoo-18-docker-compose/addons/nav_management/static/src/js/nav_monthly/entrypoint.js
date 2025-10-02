/** @odoo-module */

import { NavMonthlyWidget } from './nav_monthly_widget';
import { mount } from '@odoo/owl';

// Hàm tiện ích để quản lý spinner
function showSpinner() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const widgetContainer = document.getElementById('navMonthlyWidget');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
    if (widgetContainer) {
        widgetContainer.style.display = 'none';
    }
}

function hideSpinner() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const widgetContainer = document.getElementById('navMonthlyWidget');
    
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    if (widgetContainer) {
        widgetContainer.style.display = 'block';
    }
}

function showError(message) {
    const widgetContainer = document.getElementById('navMonthlyWidget');
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

function init() {
    console.log("Initializing Nav Monthly Widget...");

    // Kiểm tra flag để đảm bảo chỉ mount một lần
    if (isNavMonthlyWidgetMounted) {
        console.log('NavMonthlyWidget already mounted, skipping...');
        return;
    }

    // Lấy widget container
    const widgetContainer = document.getElementById('navMonthlyWidget');
    if (!widgetContainer) {
        console.error('NavMonthlyWidget container not found');
        showError('Không tìm thấy container widget');
        return;
    }

    // Kiểm tra xem widget đã được mount chưa
    if (widgetContainer.hasChildNodes()) {
        console.log('NavMonthlyWidget already mounted, skipping...');
        return;
    }

    // Hiển thị spinner
    showSpinner();

    // Dữ liệu mặc định
    let data = {
        funds: [],
        selectedFundId: null
    };

    try {
        // Lấy dữ liệu từ window.navMonthlyData
        if (window.navMonthlyData) {
            data.funds = window.navMonthlyData.funds || [];
            data.selectedFundId = window.navMonthlyData.selected_fund_id || null;
        }
    } catch (e) {
        console.error("Error parsing window.navMonthlyData:", e);
        showError('Có lỗi xảy ra khi phân tích dữ liệu: ' + e.message);
        return;
    }

    console.log("Data loaded:", data);

    try {
        console.log("Mounting NavMonthlyWidget...");
        // Mount widget với dữ liệu
        mount(NavMonthlyWidget, widgetContainer, {
            props: data
        });
        console.log("NavMonthlyWidget mounted successfully");
        isNavMonthlyWidgetMounted = true;
        hideSpinner();
    } catch (error) {
        console.error('Error mounting NavMonthlyWidget:', error);
        showError('Có lỗi xảy ra khi tải widget: ' + error.message);
    }
}

// Thử mount ngay lập tức
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Attempting to mount NavMonthlyWidget');
    setTimeout(init, 1000);
});

// Fallback: thử mount sau khi window load
window.addEventListener('load', () => {
    console.log('Window loaded - Fallback mount attempt');
    setTimeout(init, 2000);
});

// Global function để mount từ bên ngoài
window.mountNavMonthlyWidget = init;

// Flag để đảm bảo chỉ mount một lần
let isNavMonthlyWidgetMounted = false;
