/** @odoo-module */

import { mount } from "@odoo/owl";
import { ReportEarlySaleWidget } from './report_early_sale_widget.js';

// Mount OWL widget when DOM is ready
function mountReportEarlySaleWidget() {
    console.log("Mounting Report Early Sale OWL Widget...");
    
    const container = document.getElementById('reportEarlySaleWidget');
    if (!container) {
        console.error("Report Early Sale container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ReportEarlySaleWidget, container);
        console.log("Report Early Sale OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Report Early Sale OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReportEarlySaleWidget);
} else {
    // DOM already ready
    mountReportEarlySaleWidget();
}