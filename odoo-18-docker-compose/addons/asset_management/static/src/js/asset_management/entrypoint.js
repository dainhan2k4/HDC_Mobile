/** @odoo-module */

import { AssetManagementWidget } from './asset_management_widget';
import { mount } from '@odoo/owl';
import { registry } from "@web/core/registry";

// Biến để theo dõi trạng thái mount
let isMounted = false;

// Hàm mount widget với validation
function mountWidget() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const widgetContainer = document.getElementById('asset-management-widget');
    
    // Kiểm tra các điều kiện cần thiết
    if (!widgetContainer) {
        console.warn('Widget container not found');
        return false;
    }
    
    if (isMounted) {
        console.warn('Widget already mounted');
        return false;
    }
    
    if (!window.assetManagementData) {
        console.warn('Asset management data not found');
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        widgetContainer.innerHTML = '<div class="text-center text-danger py-4">Không tìm thấy dữ liệu</div>';
        return false;
    }
    
    try {
        // Validate dữ liệu trước khi mount
        if (!validateData(window.assetManagementData)) {
            throw new Error('Dữ liệu không hợp lệ');
        }
        
        mount(AssetManagementWidget, widgetContainer, {
            props: window.assetManagementData
        });
        
        isMounted = true;
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        widgetContainer.style.display = 'block';
        return true;
    } catch (error) {
        console.error('Error mounting widget:', error);
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        widgetContainer.innerHTML = '<div class="text-center text-danger py-4">Có lỗi xảy ra khi tải widget: ' + error.message + '</div>';
        return false;
    }
}

// Hàm validate dữ liệu
function validateData(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    // Kiểm tra các trường bắt buộc
    const requiredFields = ['totalAssets', 'fundCertificates', 'holdings', 'swapOrders'];
    for (const field of requiredFields) {
        if (!(field in data)) {
            console.warn(`Missing required field: ${field}`);
            return false;
        }
    }
    
    // Kiểm tra kiểu dữ liệu
    if (typeof data.totalAssets !== 'number') {
        console.warn('totalAssets must be a number');
        return false;
    }
    
    if (!Array.isArray(data.fundCertificates)) {
        console.warn('fundCertificates must be an array');
        return false;
    }
    
    if (!Array.isArray(data.holdings)) {
        console.warn('holdings must be an array');
        return false;
    }
    
    if (!data.swapOrders || typeof data.swapOrders !== 'object') {
        console.warn('swapOrders must be an object');
        return false;
    }
    
    return true;
}

// Đợi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
    mountWidget();
});

// Thêm timeout để đảm bảo DOM đã sẵn sàng (chỉ nếu chưa mount)
setTimeout(() => {
    if (!isMounted) {
        mountWidget();
    }
}, 1000);

// Đăng ký hàm mountWidget để chạy khi Odoo sẵn sàng
registry.category("website_frontend_ready").add("asset_management.init", mountWidget); 