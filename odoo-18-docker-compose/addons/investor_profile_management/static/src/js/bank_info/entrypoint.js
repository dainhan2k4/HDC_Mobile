// entrypoint.js for BankInfoWidget
console.log('BankInfo entrypoint.js loaded');

// Wait for OWL to be available and then mount the component
function mountBankInfoWidget() {
    if (typeof owl !== 'undefined' && typeof BankInfoWidget !== 'undefined') {
        const widgetContainer = document.getElementById('bankInfoWidget');
        if (widgetContainer) {
            console.log('Mounting BankInfoWidget from entrypoint.js');
            owl.mount(BankInfoWidget, widgetContainer);
        } else {
            console.warn('BankInfoWidget container not found. Retrying in 100ms...');
            setTimeout(mountBankInfoWidget, 100);
        }
    } else {
        console.warn('OWL or BankInfoWidget not yet defined. Retrying in 100ms...');
        setTimeout(mountBankInfoWidget, 100);
    }
}

mountBankInfoWidget(); 