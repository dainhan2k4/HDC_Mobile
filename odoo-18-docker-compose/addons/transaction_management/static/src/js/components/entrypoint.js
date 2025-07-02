/** @odoo-module **/

import { Header } from './header';
import { mount } from '@odoo/owl';

// Hàm mount component
function mountHeader() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        console.log('Mounting Header component...');
        mount(Header, headerContainer);
    } else {
        console.warn('Header container not found. Retrying in 100ms...');
        setTimeout(mountHeader, 100);
    }
}

// Đợi DOM load xong
document.addEventListener('DOMContentLoaded', () => {
    mountHeader();
}); 