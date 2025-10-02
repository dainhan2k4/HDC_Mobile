/** @odoo-module **/
import HolidayWidget from './holiday_widget';
window.HolidayWidget = HolidayWidget;
// entrypoint.js cho holiday
// Bạn có thể import holiday_widget.js ở đây nếu cần
// Ví dụ: import './holiday_widget';

console.log('Holiday JS loaded');

// entrypoint.js cho HolidayWidget
console.log('HolidayWidget entrypoint.js loaded');

let mountAttempts = 0;
const maxAttempts = 50;

function mountHolidayWidget() {
    mountAttempts++;
    if (typeof owl !== 'undefined' && typeof window.HolidayWidget !== 'undefined') {
        const widgetContainer = document.getElementById('holidayWidget');
        if (widgetContainer) {
            try {
                widgetContainer.innerHTML = '';
                const app = new owl.App(window.HolidayWidget);
                app.mount(widgetContainer);
                console.log('HolidayWidget mounted successfully!');
                return;
            } catch (error) {
                console.error('Error mounting HolidayWidget:', error);
            }
        } else {
            console.warn('holidayWidget container not found!');
        }
    } else {
        if (typeof owl === 'undefined') console.warn('owl is undefined!');
        if (typeof window.HolidayWidget === 'undefined') console.warn('window.HolidayWidget is undefined!');
    }
    if (mountAttempts < maxAttempts) setTimeout(mountHolidayWidget, 100);
}
document.addEventListener('DOMContentLoaded', mountHolidayWidget);
window.addEventListener('load', () => { if (mountAttempts === 0) mountHolidayWidget(); });
if (document.readyState !== 'loading') setTimeout(mountHolidayWidget, 50); 
