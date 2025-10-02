/** @odoo-module **/

import { Header } from './header';
import { mount } from '@odoo/owl';

// Hàm mount component
function mountHeader() {
    const headerContainer = document.getElementById('headermana-container');
    if (headerContainer) {
        mount(Header, headerContainer, {
            props: {
                userName: window.userName || "TRẦN NGUYÊN TRƯỜNG PHÁT",
                accountNo: window.accountNo || "N/A"
            }
        });
    } else {
        setTimeout(mountHeader, 100);
    }
}

// Đợi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
    mountHeader();
}); 