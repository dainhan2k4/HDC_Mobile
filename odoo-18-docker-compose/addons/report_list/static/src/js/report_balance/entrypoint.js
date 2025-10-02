/** @odoo-module */

import { mount } from "@odoo/owl";
import { ReportBalanceWidget } from './report_balance_widget.js';

// Mount OWL widget when DOM is ready
function mountReportBalanceWidget() {
    console.log("Mounting Report Balance OWL Widget...");
    
    const container = document.getElementById('reportBalanceWidget');
    if (!container) {
        console.error("Report Balance container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ReportBalanceWidget, container);
        console.log("Report Balance OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Report Balance OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReportBalanceWidget);
} else {
    // DOM already ready
    mountReportBalanceWidget();
}