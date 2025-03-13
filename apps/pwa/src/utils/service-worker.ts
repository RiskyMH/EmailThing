export const registerServiceWorker = async (hash?: string) => {
    if ('serviceWorker' in navigator) {
        try {
            return await navigator.serviceWorker.register(`/service.js?${hash ?? ""}`);
            // return navigator.serviceWorker.register("/service.js", {
            //     scope: '/'
            // });
        } catch (error) {
            console.error('Service worker registration failed:', error);
        }
    } else {
        console.log('service worker not supported')
    }
};

export const unregisterServiceWorkers = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
};

export const resetServiceWorker = async () => {
    await unregisterServiceWorkers();
    return registerServiceWorker();
};

export const checkOnlineStatus = async () => {
    // try {
    //     const response = await fetch('/api/health');
    //     return response.ok;
    // } catch (error) {
    //     return false;
    // }
    return navigator.onLine;
};
