<%@ page contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8" %>
<%@ page import="java.util.List,java.util.Map" %>
<%@ page import="com.crm.dto.leads.LeadForm" %>
<%@ page import="com.crm.util.HtmlUtil" %>

<%
    String contextPath = request.getContextPath();
    String csrf = HtmlUtil.escape(request.getAttribute("csrf"));
%>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1">

    <title>Biểu mẫu thu thập lead</title>

    <link rel="stylesheet"
          href="<%= HtmlUtil.escape(contextPath) %>/css/pages/embedded-leads.css">
</head>

<body class="management-body">
<main class="management">

    <a href="<%= HtmlUtil.escape(contextPath) %>/dashboard">
        ← Về CRM
    </a>

    <p class="eyebrow">MARKETING</p>
    <h1>Biểu mẫu thu thập lead</h1>

    <p>
        Tạo biểu mẫu, chép mã iframe và dán vào website của bạn.
    </p>

    <% if (request.getAttribute("error") != null) { %>
        <p class="notice error" role="alert">
            <%= HtmlUtil.escape(request.getAttribute("error")) %>
        </p>
    <% } %>

    <%
        if (request.getAttribute("forms") instanceof List<?>
                && request.getAttribute("embeds") instanceof Map<?, ?>) {

            List<?> forms =
                    (List<?>) request.getAttribute("forms");

            Map<?, ?> embeds =
                    (Map<?, ?>) request.getAttribute("embeds");
    %>

    <section class="form-card">
        <h2>Tạo biểu mẫu</h2>

        <p class="small">
            Địa chỉ tạo mã nhúng:
            <%= HtmlUtil.escape(request.getAttribute("publicBase")) %>.
            Website thật cần địa chỉ CRM HTTPS công khai.
        </p>

        <form method="post"
              action="<%= HtmlUtil.escape(contextPath) %>/marketing/lead-forms">

            <input type="hidden" name="csrf" value="<%= csrf %>">
            <input type="hidden" name="action" value="create">

            <label for="name">Tên biểu mẫu</label>
            <input id="name"
                   name="name"
                   maxlength="150"
                   placeholder="Đăng ký tư vấn CRM"
                   required>

            <label for="source">Nguồn lead</label>
            <input id="source"
                   name="source"
                   maxlength="150"
                   placeholder="Website – Chiến dịch tháng 10"
                   required>

            <button type="submit">Tạo mã nhúng</button>
        </form>
    </section>

    <section>
        <h2>Biểu mẫu của bạn</h2>
        <p class="small">Hiển thị 100 biểu mẫu gần nhất.</p>

        <% if (forms.isEmpty()) { %>
            <p>Chưa có biểu mẫu. Hãy tạo biểu mẫu đầu tiên ở trên.</p>
        <% } %>

        <%
            for (Object item : forms) {
                LeadForm form = (LeadForm) item;
        %>

        <article class="form-card">
            <h3><%= HtmlUtil.escape(form.name()) %></h3>

            <p>
                Nguồn:
                <strong><%= HtmlUtil.escape(form.source()) %></strong>
                ·
                <%= form.active() ? "Đang nhận lead" : "Đã tắt" %>
            </p>

            <% if (form.active()) { %>

                <label>
                    Mã nhúng — chọn toàn bộ và nhấn Ctrl + C
                    <textarea readonly
                              rows="4"
                              aria-label="Mã nhúng"><%= HtmlUtil.escape(embeds.get(form.id())) %></textarea>
                </label>

                <a href="<%= HtmlUtil.escape(contextPath) %>/public/lead-form?id=<%= HtmlUtil.escape(form.id()) %>"
                   target="_blank"
                   rel="noopener">
                    Xem biểu mẫu
                </a>

                <form class="disable-form"
                      method="post"
                      action="<%= HtmlUtil.escape(contextPath) %>/marketing/lead-forms">

                    <input type="hidden" name="csrf" value="<%= csrf %>">
                    <input type="hidden" name="action" value="deactivate">
                    <input type="hidden"
                           name="id"
                           value="<%= HtmlUtil.escape(form.id()) %>">

                    <button class="secondary" type="submit">
                        Ngừng nhận lead
                    </button>
                </form>

            <% } %>
        </article>

        <% } %>
    </section>

    <section>
        <h2>Lead nhận được</h2>
        <p class="small">
            Hiển thị 100 lead gần nhất thuộc tài khoản của bạn.
        </p>

        <div class="table-scroll">
            <table>
                <thead>
                <tr>
                    <th>Họ tên</th>
                    <th>Email / Điện thoại</th>
                    <th>Công ty</th>
                    <th>Nhu cầu</th>
                    <th>Trạng thái</th>
                    <th>Nguồn / Biểu mẫu</th>
                    <th>Thời gian</th>
                </tr>
                </thead>

                <tbody>
                <%
                    if (request.getAttribute("leads") instanceof List<?>) {
                        List<?> leads =
                                (List<?>) request.getAttribute("leads");

                        if (leads.isEmpty()) {
                %>
                    <tr>
                        <td colspan="7">Chưa nhận được lead nào.</td>
                    </tr>
                <%
                        }

                        for (Object item : leads) {
                            Map<?, ?> lead = (Map<?, ?>) item;
                %>
                    <tr>
                        <td>
                            <%= HtmlUtil.escape(lead.get("full_name")) %>
                        </td>

                        <td>
                            <%= HtmlUtil.escape(lead.get("email")) %>
                            <br>
                            <%= HtmlUtil.escape(lead.get("phone")) %>
                        </td>

                        <td>
                            <%= HtmlUtil.escape(lead.get("company")) %>
                        </td>

                        <td class="interest">
                            <%= HtmlUtil.escape(lead.get("interest")) %>
                        </td>

                        <td>
                            <span class="badge">
                                <%= "NEW".equals(lead.get("status"))
                                        ? "Mới"
                                        : HtmlUtil.escape(lead.get("status")) %>
                            </span>
                        </td>

                        <td>
                            <%= HtmlUtil.escape(lead.get("source")) %>
                            <br>
                            <small>
                                <%= HtmlUtil.escape(lead.get("form_name")) %>
                            </small>
                        </td>

                        <td>
                            <%= HtmlUtil.escape(lead.get("created_at")) %>
                        </td>
                    </tr>
                <%
                        }
                    }
                %>
                </tbody>
            </table>
        </div>
    </section>

    <% } %>
</main>
</body>
</html>