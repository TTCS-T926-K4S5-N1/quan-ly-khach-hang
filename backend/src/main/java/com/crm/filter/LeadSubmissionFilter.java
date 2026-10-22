package com.crm.filter;

import com.crm.service.leads.IpRateLimiter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Clock;

@WebFilter("/public/lead-form")
public class LeadSubmissionFilter implements Filter {

    private final IpRateLimiter limiter = new IpRateLimiter(
            5,
            600_000,
            10_000,
            Clock.systemUTC()
    );

    @Override
    public void doFilter(
            ServletRequest request,
            ServletResponse response,
            FilterChain chain
    ) throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        req.setCharacterEncoding("UTF-8");
        res.setCharacterEncoding("UTF-8");

        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "no-referrer");

        // Cho phép website khác nhúng biểu mẫu bằng iframe.
        res.setHeader(
                "Content-Security-Policy",
                "default-src 'none'; "
                        + "style-src 'self'; "
                        + "form-action 'self'; "
                        + "base-uri 'none'; "
                        + "frame-ancestors *"
        );

        if ("POST".equals(req.getMethod())) {

            // Dùng IP kết nối, không tin X-Forwarded-For do client gửi.
            long retryAfter = limiter.acquire(req.getRemoteAddr());

            if (retryAfter > 0) {
                res.setHeader(
                        "Retry-After",
                        Long.toString(retryAfter)
                );

                plain(
                        res,
                        429,
                        "Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau "
                                + retryAfter + " giây."
                );
                return;
            }

            String contentType = req.getContentType();

            if (contentType == null
                    || !contentType.split(";", 2)[0].trim()
                    .equalsIgnoreCase(
                            "application/x-www-form-urlencoded"
                    )) {

                plain(res, 415, "Kiểu dữ liệu không được hỗ trợ.");
                return;
            }

            long contentLength = req.getContentLengthLong();

            if (contentLength < 0 || contentLength > 32_768) {
                plain(
                        res,
                        413,
                        "Biểu mẫu vượt quá dung lượng cho phép."
                );
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private void plain(
            HttpServletResponse response,
            int status,
            String message
    ) throws IOException {

        response.setStatus(status);
        response.setContentType("text/plain;charset=UTF-8");
        response.getWriter().write(message);
    }
}