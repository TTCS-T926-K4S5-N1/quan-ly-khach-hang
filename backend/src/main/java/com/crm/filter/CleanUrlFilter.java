package com.crm.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.*;

import java.io.IOException;

/**
 * Filter chuyển đổi các đường dẫn đẹp (Clean URLs) không có đuôi .html
 * Ví dụ:
 *   /crm/dashboard        -> forward sang /dashboard.html (URL trên trình duyệt giữ nguyên /crm/dashboard)
 *   /crm/organization     -> forward sang /organization.html
 *   /crm/login            -> forward sang /login.html
 *   /crm/                 -> redirect sang /crm/login
 *   /crm/dashboard.html   -> redirect 302 sang /crm/dashboard
 */
@WebFilter("/*")
public class CleanUrlFilter implements Filter {

    @Override
    public void doFilter(
            ServletRequest request,
            ServletResponse response,
            FilterChain chain
    ) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String contextPath = req.getContextPath();
        String uri = req.getRequestURI();
        String path = uri.substring(contextPath.length());

        // 1. Bỏ qua các API endpoint
        if (path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        // 2. Truy cập trang gốc /crm hoặc /crm/ -> chuyển về /crm/login
        if (path.isEmpty() || path.equals("/")) {
            res.sendRedirect(contextPath + "/login");
            return;
        }

        // 3. Bỏ qua các tài nguyên tĩnh (css, js, images, fonts, maps, etc.)
        if (path.matches("(?i).*\\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json|txt|xml)$")) {
            chain.doFilter(request, response);
            return;
        }

        // 4. Nếu người dùng nhập đường dẫn có đuôi .html, chuyển hướng 302 sang Clean URL
        if (path.endsWith(".html")) {
            String clean = path.substring(0, path.length() - 5);
            if (clean.equals("/index")) {
                clean = "/login";
            }
            String query = req.getQueryString() != null ? "?" + req.getQueryString() : "";
            res.sendRedirect(contextPath + clean + query);
            return;
        }

        // 5. Kiểm tra nếu file {path}.html có tồn tại trong webapp thì forward nội bộ
        String htmlPath = path + ".html";
        if (req.getServletContext().getResource(htmlPath) != null) {
            req.getRequestDispatcher(htmlPath).forward(request, response);
            return;
        }

        chain.doFilter(request, response);
    }
}
