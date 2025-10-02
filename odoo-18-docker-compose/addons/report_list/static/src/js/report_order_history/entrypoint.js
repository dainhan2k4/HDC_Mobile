/** @odoo-module */

import { mount } from "@odoo/owl";
import { ReportOrderHistoryWidget } from './report_order_history_widget.js';

// Mount OWL widget when DOM is ready
function mountReportOrderHistoryWidget() {
    console.log("Mounting Report Order History OWL Widget...");
    
    const container = document.getElementById('reportOrderHistoryWidget');
    if (!container) {
        console.error("Report Order History container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ReportOrderHistoryWidget, container);
        console.log("Report Order History OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Report Order History OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReportOrderHistoryWidget);
} else {
    // DOM already ready
    mountReportOrderHistoryWidget();
}