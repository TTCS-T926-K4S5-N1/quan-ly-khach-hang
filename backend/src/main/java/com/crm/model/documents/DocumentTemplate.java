package com.crm.model.documents;

/** SCRUM-94: Mẫu tài liệu PDF (báo giá / hợp đồng) đọc từ bảng document_templates. */
public class DocumentTemplate {

    public static final String TYPE_QUOTE = "QUOTE";
    public static final String TYPE_CONTRACT = "CONTRACT";

    private Long id;
    private String documentType;
    private String name;
    private String title;
    private String companyName;
    private String companyAddress;
    private String companyTaxCode;
    private String companyPhone;
    private String companyEmail;
    private String companyWebsite;
    private String companyBankAccount;
    private String representativeName;
    private String representativeTitle;
    private String logoData;
    private String primaryColor = "#1E3A8A";
    private String introText;
    private String termsText;
    private String footerText;
    private String currencyUnit = "đồng";
    private int validityDays = 30;
    private Long updatedBy;
    private String updatedAt;

    public static boolean isSupportedType(String type) {
        return TYPE_QUOTE.equals(type) || TYPE_CONTRACT.equals(type);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getCompanyAddress() { return companyAddress; }
    public void setCompanyAddress(String companyAddress) { this.companyAddress = companyAddress; }

    public String getCompanyTaxCode() { return companyTaxCode; }
    public void setCompanyTaxCode(String companyTaxCode) { this.companyTaxCode = companyTaxCode; }

    public String getCompanyPhone() { return companyPhone; }
    public void setCompanyPhone(String companyPhone) { this.companyPhone = companyPhone; }

    public String getCompanyEmail() { return companyEmail; }
    public void setCompanyEmail(String companyEmail) { this.companyEmail = companyEmail; }

    public String getCompanyWebsite() { return companyWebsite; }
    public void setCompanyWebsite(String companyWebsite) { this.companyWebsite = companyWebsite; }

    public String getCompanyBankAccount() { return companyBankAccount; }
    public void setCompanyBankAccount(String companyBankAccount) { this.companyBankAccount = companyBankAccount; }

    public String getRepresentativeName() { return representativeName; }
    public void setRepresentativeName(String representativeName) { this.representativeName = representativeName; }

    public String getRepresentativeTitle() { return representativeTitle; }
    public void setRepresentativeTitle(String representativeTitle) { this.representativeTitle = representativeTitle; }

    public String getLogoData() { return logoData; }
    public void setLogoData(String logoData) { this.logoData = logoData; }

    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }

    public String getIntroText() { return introText; }
    public void setIntroText(String introText) { this.introText = introText; }

    public String getTermsText() { return termsText; }
    public void setTermsText(String termsText) { this.termsText = termsText; }

    public String getFooterText() { return footerText; }
    public void setFooterText(String footerText) { this.footerText = footerText; }

    public String getCurrencyUnit() { return currencyUnit; }
    public void setCurrencyUnit(String currencyUnit) { this.currencyUnit = currencyUnit; }

    public int getValidityDays() { return validityDays; }
    public void setValidityDays(int validityDays) { this.validityDays = validityDays; }

    public Long getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(Long updatedBy) { this.updatedBy = updatedBy; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
