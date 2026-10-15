/**
 * CRM Web-to-Lead Embed Widget
 * Tự động tạo và nhúng biểu mẫu thu thập Lead vào bất kỳ website nào
 */
(function() {
    'use strict';

    const container = document.getElementById('crm-web-lead-form');
    if (!container) return;

    const scriptTag = document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    // Tự động suy ra base URL của CRM server từ URL của file script
    let baseUrl = 'http://localhost:8080/crm';
    if (scriptTag && scriptTag.src) {
        try {
            const url = new URL(scriptTag.src);
            baseUrl = url.origin + (url.pathname.startsWith('/crm') ? '/crm' : '');
        } catch (e) {}
    }

    const formKey = container.getAttribute('data-form-key') || (scriptTag && scriptTag.getAttribute('data-form-key')) || 'wf_landingpage_tuvan';

    // Tạo iframe an toàn, chống xung đột CSS của trang chủ
    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/lead-form-embed.html?key=${encodeURIComponent(formKey)}`;
    iframe.style.width = '100%';
    iframe.style.maxWidth = '560px';
    iframe.style.height = '620px';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.borderRadius = '14px';
    iframe.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'Biểu mẫu thu thập thông tin khách hàng tiềm năng CRM');

    container.innerHTML = '';
    container.appendChild(iframe);
})();
