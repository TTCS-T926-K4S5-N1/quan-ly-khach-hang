package com.crm.controller.leads;

import com.crm.dto.leads.LeadForm;
import com.crm.service.leads.LeadFormService;
import com.crm.service.permissions.AuthorizationService;
import com.crm.util.HtmlUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@WebServlet("/marketing/lead-forms")
public class MarketingLeadFormServlet extends HttpServlet {

    private final LeadFormService service = new LeadFormService();
    private final AuthorizationService auth = new AuthorizationService();

    private String publicBase;

    @Override
    public void init() throws ServletException {
        publicBase = System.getenv("CRM_PUBLIC_BASE_URL");

        if (publicBase == null || publicBase.isBlank()) {
            publicBase = "http://localhost:8080";
        }

        publicBase = publicBase.strip().replaceAll("/+$", "");

        try {
            URI uri = URI.create(publicBase);

            boolean validScheme = "http".equals(uri.getScheme())
                    || "https".equals(uri.getScheme());

            if (!validScheme
                    || uri.getHost() == null
                    || uri.getUserInfo() != null
                    || (uri.getPath() != null && !uri.getPath().isEmpty())
                    || uri.getQuery() != null
                    || uri.getFragment() != null) {

                throw new IllegalArgumentException();
            }

        } catch (IllegalArgumentException exception) {
            throw new ServletException(
                    "CRM_PUBLIC_BASE_URL phải là địa chỉ dạng "
                            + "https://crm.example.vn, không gồm /crm.",
                    exception
            );
        }
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException, ServletException {
        handle(request, response, false);
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException, ServletException {
        handle(request, response, true);
    }

    private void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            boolean post
    ) throws IOException, ServletException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("text/html;charset=UTF-8");

        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Frame-Options", "DENY");

        response.setHeader(
                "Content-Security-Policy",
                "default-src 'none'; "
                        + "style-src 'self'; "
                        + "form-action 'self'; "
                        + "base-uri 'none'; "
                        + "frame-ancestors 'none'"
        );

        try {
            auth.requirePermission(request, "marketing.forms.manage");
            auth.requirePermission(request, "marketing.leads.read");

            long ownerUserId =
                    AuthorizationService.currentUserId(request);

            HttpSession session = request.getSession(false);

            if (session == null) {
                throw new SecurityException("Bạn cần đăng nhập.");
            }

            String csrf;

            synchronized (session) {
                if (session.getAttribute("marketingCsrf") == null) {
                    session.setAttribute(
                            "marketingCsrf",
                            UUID.randomUUID().toString()
                    );
                }

                csrf = (String) session.getAttribute("marketingCsrf");
            }

            if (post) {
                String suppliedCsrf = request.getParameter("csrf");

                if (suppliedCsrf == null
                        || !MessageDigest.isEqual(
                                csrf.getBytes(StandardCharsets.UTF_8),
                                suppliedCsrf.getBytes(StandardCharsets.UTF_8)
                        )) {

                    throw new SecurityException(
                            "Mã xác minh phiên không hợp lệ. "
                                    + "Hãy tải lại trang."
                    );
                }

                try {
                    String action = request.getParameter("action");

                    if ("create".equals(action)) {
                        service.create(
                                request.getParameter("name"),
                                request.getParameter("source"),
                                ownerUserId
                        );

                    } else if ("deactivate".equals(action)) {
                        service.deactivate(
                                request.getParameter("id"),
                                ownerUserId
                        );

                    } else {
                        throw new IllegalArgumentException(
                                "Thao tác không hợp lệ."
                        );
                    }

                    response.sendRedirect(
                            request.getContextPath()
                                    + "/marketing/lead-forms"
                    );
                    return;

                } catch (IllegalArgumentException
                         | NoSuchElementException exception) {

                    response.setStatus(400);
                    request.setAttribute(
                            "error",
                            exception.getMessage()
                    );
                }
            }

            List<LeadForm> forms = service.forms(ownerUserId);

            Map<String, String> embeds = new HashMap<>();

            for (LeadForm form : forms) {
                embeds.put(
                        form.id(),
                        embed(request.getContextPath(), form.id())
                );
            }

            request.setAttribute("forms", forms);
            request.setAttribute("embeds", embeds);
            request.setAttribute("leads", service.leads(ownerUserId));
            request.setAttribute("csrf", csrf);
            request.setAttribute("publicBase", publicBase);

        } catch (SecurityException exception) {
            response.setStatus(403);
            request.setAttribute("error", exception.getMessage());

        } catch (Exception exception) {
            getServletContext().log(
                    "Không thể quản lý biểu mẫu Marketing.",
                    exception
            );

            response.setStatus(503);
            request.setAttribute(
                    "error",
                    "Không thể tải dữ liệu Marketing. "
                            + "Vui lòng thử lại sau."
            );
        }

        request.getRequestDispatcher(
                "/WEB-INF/views/leads/manage-forms.jsp"
        ).forward(request, response);
    }

    private String embed(String contextPath, String formId) {
        String url = publicBase
                + contextPath
                + "/public/lead-form?id="
                + formId;

        return "<iframe src=\"" + HtmlUtil.escape(url)
                + "\" title=\"Đăng ký tư vấn\""
                + " style=\"width:100%;height:900px;border:0\""
                + " loading=\"lazy\"></iframe>";
    }
}