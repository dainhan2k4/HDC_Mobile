// Personal Profile Entrypoint
document.addEventListener('DOMContentLoaded', function() {
    console.log('Personal Profile Entrypoint loaded');
    
    // Check if OWL is available
    if (typeof owl === 'undefined') {
        console.error('OWL is not available');
        return;
    }
    
    const widgetContainer = document.getElementById('personalProfileWidget');
    if (!widgetContainer) {
        console.error('Widget container not found');
        return;
    }
    
    // Wait a bit for the component to be loaded
    setTimeout(() => {
        if (typeof window.PersonalProfileWidget !== 'undefined') {
            console.log('Mounting PersonalProfileWidget');
            owl.mount(window.PersonalProfileWidget, widgetContainer);
        } else {
            console.error('PersonalProfileWidget not found in window object');
            console.log('Available globals:', Object.keys(window).filter(key => key.includes('Profile')));
        }
    }, 500);
}); 