// entrypoint.js for AddressInfoWidget
console.log('AddressInfo entrypoint.js loaded');

// Wait for OWL to be available and then mount the component
function mountAddressInfoWidget() {
    if (typeof owl !== 'undefined' && typeof AddressInfoWidget !== 'undefined') {
        const widgetContainer = document.getElementById('addressInfoWidget');
        if (widgetContainer) {
            console.log('Mounting AddressInfoWidget from entrypoint.js');
            owl.mount(AddressInfoWidget, widgetContainer);
        } else {
            console.warn('AddressInfoWidget container not found. Retrying in 100ms...');
            setTimeout(mountAddressInfoWidget, 100);
        }
    } else {
        console.warn('OWL or AddressInfoWidget not yet defined. Retrying in 100ms...');
        setTimeout(mountAddressInfoWidget, 100);
    }
}

mountAddressInfoWidget(); 