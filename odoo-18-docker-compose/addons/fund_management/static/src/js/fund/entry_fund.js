/** @odoo-module **/

import { mount } from "@odoo/owl";
import { FundWidget } from "./fund_widget";

// Improved mount logic
console.log("🟢 Auto-mount script loaded");

let isMounted = false; // Thêm biến cờ để kiểm tra đã gắn hay chưa
let mountAttempts = 0;
const maxAttempts = 1;

function validateElement(element) {
    if (!element) return false;
    if (!(element instanceof Element)) return false;
    if (element.nodeType !== 1) return false;
    if (!element.isConnected) return false;
    if (!document.contains(element)) return false;
    return true;
}

function autoMount() {
    if (isMounted) { // Nếu đã gắn rồi, không làm gì nữa
        console.log("⏩ Widget already mounted, skipping autoMount.");
        return;
    }

    console.log("🔍 AutoMount function called");
    const target = document.getElementById("fund-widget-root");

    console.log("Target element:", target);

    if (!validateElement(target)) {
        console.log("❌ Element validation failed");
        return;
    }

    // Kiểm tra xem component đã có trong target chưa
    if (target.querySelector('.fund-widget-container')) { // Kiểm tra dựa trên class của template root
        console.log("⏩ Component already found in target, setting isMounted = true.");
        isMounted = true;
        return;
    }

    console.log("🧹 Clearing target element content...");
    target.innerHTML = '';

    console.log("✅ Valid target found, mounting...");
//    console.log("Target info:", {
//        id: target.id,
//        tagName: target.tagName,
//        className: target.className,
//        isConnected: target.isConnected,
//        innerHTML: target.innerHTML
//    });

    try {
        const app = new owl.App(FundWidget);
        app.mount(target)
            .then(() => {
                console.log("🎉 SUCCESS! Widget mounted!");
                isMounted = true; // Đặt cờ thành true khi thành công
            })
            .catch(error => {
                console.error("❌ App mount error:", error);
                console.log("Error details:", error.message);
                console.log("🔄 Trying direct mount...");
                return mount(FundWidget, { target });
            })
            .then(() => {
                console.log("🎉 SUCCESS! Direct mount worked!");
                isMounted = true; // Đặt cờ thành true khi thành công
            })
            .catch(error => {
                console.error("❌ Direct mount also failed:", error);
            });

    } catch (syncError) {
        console.error("❌ Sync mount error:", syncError);
    }
}

// Enhanced mounting strategy
console.log("Setting up enhanced mount attempts...");

function tryMount() {
    if (isMounted) { // Nếu đã gắn rồi, không thử nữa
        console.log("⏩ Widget already mounted, stopping further attempts.");
        return;
    }

    mountAttempts++;
    console.log(`🎯 Mount attempt ${mountAttempts}/${maxAttempts}`);

    if (mountAttempts > maxAttempts) {
        console.log("❌ Max mount attempts reached");
        return;
    }

    const target = document.getElementById("fund-widget-root");
    if (target && validateElement(target)) {
        autoMount();
    } else {
        console.log(`⏳ Target not ready, retrying in ${500 * mountAttempts}ms...`);
        setTimeout(tryMount, 500 * mountAttempts);
    }
}

// Multiple timing strategies
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
        console.log("🟢 DOM Content Loaded event");
        setTimeout(tryMount, 100);
    });
} else {
    console.log("🟢 DOM already ready");
    setTimeout(tryMount, 100);
}

window.addEventListener("load", () => {
    console.log("🟢 Window load event");
    setTimeout(tryMount, 200);
});

// Backup timer
setTimeout(() => {
    console.log("🟢 Backup timer");
    tryMount();
}, 2000);

// Observer for dynamic content
const observer = new MutationObserver((mutations) => {
    if (isMounted) { // Nếu đã gắn rồi, không cần quan sát nữa
        observer.disconnect(); // Ngắt kết nối observer
        console.log("🔇 Observer disconnected as widget is mounted.");
        return;
    }

    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            const target = document.getElementById("fund-widget-root");
            // Chỉ gọi tryMount nếu target có vẻ đã xuất hiện và chưa có component bên trong
            if (target && !target.querySelector('.fund-widget-container')) {
                console.log("🔍 Target element detected via observer");
                setTimeout(tryMount, 100);
            }
        }
    });
});

if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
} else {
    document.addEventListener("DOMContentLoaded", () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}