package com.crm.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;

import java.io.IOException;

/**
 * Filter đảm bảo toàn bộ HTTP Request và Response được xử lý bằng mã hóa UTF-8.
 * Tránh lỗi double-encoding (Mojibake) khi Servlet đọc JSON hoặc form parameters.
 */
@WebFilter("/*")
public class CharacterEncodingFilter implements Filter {

    private static final String ENCODING = "UTF-8";

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (request.getCharacterEncoding() == null) {
            request.setCharacterEncoding(ENCODING);
        }
        response.setCharacterEncoding(ENCODING);
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }
}
