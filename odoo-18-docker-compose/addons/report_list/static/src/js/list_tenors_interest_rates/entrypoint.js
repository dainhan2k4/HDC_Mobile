/** @odoo-module */

import { mount } from "@odoo/owl";
import { ListTenorsInterestRatesWidget } from './list_tenors_interest_rates_widget.js';

// Mount OWL widget when DOM is ready
function mountListTenorsInterestRatesWidget() {
    console.log("Mounting List Tenors Interest Rates OWL Widget...");
    
    const container = document.getElementById('listTenorsInterestRatesWidget');
    if (!container) {
        console.error("List Tenors Interest Rates container not found");
        return;
    }
    
    console.log("Container found:", container);
    
    try {
        // Mount OWL component using OWL mount function
        mount(ListTenorsInterestRatesWidget, container);
        console.log("List Tenors Interest Rates OWL Widget mounted successfully");
    } catch (error) {
        console.error("Error mounting List Tenors Interest Rates OWL Widget:", error);
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountListTenorsInterestRatesWidget);
} else {
    // DOM already ready
    mountListTenorsInterestRatesWidget();
}