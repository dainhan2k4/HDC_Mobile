/** @odoo-module **/

(function () {
    // Tránh khởi tạo nhiều lần
    if (window.__tl_autoMatchWorkerStarted) {
        return;
    }
    window.__tl_autoMatchWorkerStarted = true;

    let isMatchingInFlight = false;

    async function autoMatchTick() {
        if (isMatchingInFlight) {
            return;
        }

        // Gọi API khớp lệnh mỗi 1s, áp dụng Price-Time Priority
        isMatchingInFlight = true;
        try {
            const resp = await fetch('/api/transaction-list/match-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    match_type: 'all',
                    use_time_priority: true,
                    status_mode: 'pending'
                })
            });

            // Không cần xử lý UI; chỉ đảm bảo request thành công để backend chạy matching
            if (!resp.ok) {
                // Tránh spam log lỗi lớn; chỉ debug nhẹ
                // console.debug('AutoMatch worker HTTP:', resp.status);
            } else {
                // Optional: đọc JSON để backend flush transaction nếu cần
                // const data = await resp.json();
            }
        } catch (e) {
            // Giữ im lặng để không gây ồn console khi không đăng nhập/không có quyền
            // console.debug('AutoMatch worker error:', e);
        } finally {
            isMatchingInFlight = false;
        }
    }

    // Khởi chạy interval 1s toàn cục
    const intervalId = setInterval(autoMatchTick, 1000);

    // Dọn dẹp khi rời trang
    window.addEventListener('beforeunload', function () {
        clearInterval(intervalId);
    });
})();


