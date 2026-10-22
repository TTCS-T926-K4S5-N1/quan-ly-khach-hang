package com.crm.controller.leads;

import com.crm.dto.leads.LeadForm;
import com.crm.dto.leads.LeadSubmission;
import com.crm.service.leads.LeadFormService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.SQLException;
import java.util.NoSuchElementException;

@WebServlet("/public/lead-form")
public class PublicLeadFormServlet extends HttpServlet {

    private final LeadFormService service = new LeadFormService();

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException, ServletException {

        render(request, response);
    }

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException, ServletException {

        try {
            LeadSubmission lead = new LeadSubmission(
                    request.getParameter("fullName"),
                    request.getParameter("email"),
                    request.getParameter("phone"),
                    request.getParameter("company"),
                    request.getParameter("interest")
            );

            service.submit(
                    request.getParameter("id"),
                    lead,
                    request.getParameter("token"),
                    request.getParameter("answer"),
                    request.getParameter("website")
            );

            response.setStatus(201);
            request.setAttribute("success", true);

        } catch (IllegalArgumentException exception) {
            response.setStatus(400);
            request.setAttribute("error", exception.getMessage());

        } catch (NoSuchElementException exception) {
            response.setStatus(404);
            request.setAttribute("error", exception.getMessage());

        } catch (SQLException exception) {
            getServletContext().log(
                    "Không thể lưu lead từ biểu mẫu nhúng.",
                    exception
            );

            response.setStatus(503);
            request.setAttribute(
                    "error",
                    "Chưa thể gửi thông tin. Vui lòng thử lại sau."
            );
        }

        render(request, response);
    }

    private void render(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException, ServletException {

        // Khi đã lưu thành công, hiển thị thông báo thành công.
        if (!Boolean.TRUE.equals(request.getAttribute("success"))) {
            try {
                LeadForm form = service.findActive(
                        request.getParameter("id")
                );

                request.setAttribute("leadForm", form);

                request.setAttribute(
                        "challenge",
                        service.challenge(form.id())
                );

            } catch (NoSuchElementException exception) {
                response.setStatus(404);
                request.setAttribute("error", exception.getMessage());

            } catch (SQLException exception) {
                getServletContext().log(
                        "Không thể tải biểu mẫu nhúng.",
                        exception
                );

                response.setStatus(503);
                request.setAttribute(
                        "error",
                        "Biểu mẫu tạm thời chưa khả dụng. "
                                + "Vui lòng thử lại sau."
                );
            }
        }

        request.getRequestDispatcher(
                "/WEB-INF/views/leads/public-form.jsp"
        ).forward(request, response);
    }
}