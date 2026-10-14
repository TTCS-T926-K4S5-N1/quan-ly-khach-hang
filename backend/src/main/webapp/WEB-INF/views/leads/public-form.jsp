<%@ page contentType="text/html; charset=UTF-8"
         pageEncoding="UTF-8"
         session="false" %>
<%@ page import="com.crm.dto.leads.LeadForm" %>
<%@ page import="com.crm.service.leads.SubmissionToken" %>
<%@ page import="com.crm.util.HtmlUtil" %>

<%
    LeadForm form = (LeadForm) request.getAttribute("leadForm");

    SubmissionToken.Challenge challenge =
            (SubmissionToken.Challenge) request.getAttribute("challenge");

    boolean success =
            Boolean.TRUE.equals(request.getAttribute("success"));

    String contextPath = request.getContextPath();
%>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1">

    <title>Đăng ký tư vấn</title>

    <link rel="stylesheet"
          href="<%= HtmlUtil.escape(contextPath) %>/css/pages/embedded-leads.css">
</head>

<body class="embed-body">
<main class="form-card">
    <p class="eyebrow">ĐĂNG KÝ TƯ VẤN</p>

    <h1>
        <%= form == null
                ? "Đăng ký tư vấn"
                : HtmlUtil.escape(form.name()) %>
    </h1>

    <% if (request.getAttribute("error") != null) { %>
        <p class="notice error" role="alert">
            <%= HtmlUtil.escape(request.getAttribute("error")) %>
        </p>
    <% } %>

    <% if (success) { %>

        <div class="notice success" role="status">
            <h2>Đã gửi thành công!</h2>
            <p>
                Chúng tôi đã nhận thông tin và sẽ liên hệ
                để tư vấn cho bạn.
            </p>
        </div>

    <% } else if (form != null && challenge != null) { %>

        <p class="description">
            Để lại thông tin để chúng tôi liên hệ
            theo nhu cầu của bạn.
        </p>

        <form method="post"
              action="<%= HtmlUtil.escape(contextPath) %>/public/lead-form">

            <input type="hidden"
                   name="id"
                   value="<%= HtmlUtil.escape(form.id()) %>">

            <input type="hidden"
                   name="token"
                   value="<%= HtmlUtil.escape(challenge.token()) %>">

            <label for="fullName">Họ tên</label>
            <input id="fullName"
                   name="fullName"
                   type="text"
                   autocomplete="name"
                   maxlength="150"
                   required
                   value="<%= HtmlUtil.escape(request.getParameter("fullName")) %>">

            <label for="email">Email</label>
            <input id="email"
                   name="email"
                   type="email"
                   autocomplete="email"
                   maxlength="254"
                   required
                   value="<%= HtmlUtil.escape(request.getParameter("email")) %>">

            <label for="phone">Số điện thoại</label>
            <input id="phone"
                   name="phone"
                   type="tel"
                   autocomplete="tel"
                   maxlength="32"
                   required
                   value="<%= HtmlUtil.escape(request.getParameter("phone")) %>">

            <label for="company">Công ty</label>
            <input id="company"
                   name="company"
                   type="text"
                   autocomplete="organization"
                   maxlength="150"
                   required
                   value="<%= HtmlUtil.escape(request.getParameter("company")) %>">

            <label for="interest">Nhu cầu quan tâm</label>
            <textarea id="interest"
                      name="interest"
                      rows="3"
                      maxlength="2000"
                      required><%= HtmlUtil.escape(request.getParameter("interest")) %></textarea>

            <!-- Ô bẫy bot: người dùng không cần điền. -->
            <div class="honeypot" aria-hidden="true">
                <label for="website">Để trống ô này</label>
                <input id="website"
                       name="website"
                       type="text"
                       tabindex="-1"
                       autocomplete="off">
            </div>

            <label for="answer">
                Xác minh:
                <%= HtmlUtil.escape(challenge.question()) %>
            </label>

            <input id="answer"
                   name="answer"
                   type="text"
                   inputmode="numeric"
                   pattern="[0-9]{1,3}"
                   maxlength="3"
                   autocomplete="off"
                   required>

            <p class="small">
                Khi gửi, bạn đồng ý để chúng tôi liên hệ
                về nhu cầu đã đăng ký.
            </p>

            <button type="submit">Gửi thông tin</button>
        </form>

    <% } %>
</main>
</body>
</html>