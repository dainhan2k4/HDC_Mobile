/** @odoo-module */

import { mount } from "@odoo/owl";
import { InvestorReportWidget } from './investor_report_widget.js';

// Mount OWL widget when DOM is ready
function mountInvestorReportWidget() {
    console.log("Mounting Investor Report OWL Widget...");
    
    const container = document.getElementById('investorReportWidget');
    if (!container) {
        console.error("Investor Report container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(InvestorReportWidget, container);
        console.log("Investor Report OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting Investor Report OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountInvestorReportWidget);
} else {
    // DOM already ready
    mountInvestorReportWidget();
}