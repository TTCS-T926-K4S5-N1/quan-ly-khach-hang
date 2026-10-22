package com.crm.service.pipeline;

import com.crm.dao.pipeline.OpportunityDAO;
import com.crm.dao.pipeline.OpportunityItemDAO;
import com.crm.dao.products.ProductDAO;
import com.crm.dto.pipeline.OpportunityItemDTO;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;
import com.crm.service.permissions.ScopeType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.Connection;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class OpportunityItemServiceTest {

    private final Connection mockConnection = (Connection) Proxy.newProxyInstance(
            OpportunityItemServiceTest.class.getClassLoader(),
            new Class<?>[]{Connection.class},
            (p, m, a) -> null
    );

    private final OpportunityItemService.ConnectionProvider mockProvider = () -> mockConnection;

    private final DataScopeService permissiveScope = new DataScopeService() {
        @Override
        public DataScopeContext resolve(long userId, String module, String action) {
            return new DataScopeContext(userId, module, ScopeType.ALL, null, Set.of());
        }
    };

    private final DataScopeService restrictedScope = new DataScopeService() {
        @Override
        public DataScopeContext resolve(long userId, String module, String action) {
            return new DataScopeContext(userId, module, ScopeType.SELF, null, Set.of(userId));
        }
    };

    @Test
    @DisplayName("Thêm sản phẩm thiếu productId sẽ ném IllegalArgumentException")
    void addItemMissingProductIdThrows() {
        OpportunityItemService service = new OpportunityItemService(
                new OpportunityDAO(), new OpportunityItemDAO(), new ProductDAO(), permissiveScope, mockProvider
        );

        OpportunityItemDTO item = new OpportunityItemDTO();
        // no productId

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.addItem(1L, 10L, item)
        );
        assertTrue(ex.getMessage().contains("chọn sản phẩm"));
    }

    @Test
    @DisplayName("Thêm sản phẩm vào cơ hội không tồn tại sẽ ném NoSuchElementException")
    void addItemToNonExistentOpportunityThrows() {
        OpportunityDAO mockOppDAO = new OpportunityDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return null;
            }
        };

        OpportunityItemService service = new OpportunityItemService(
                mockOppDAO, new OpportunityItemDAO(), new ProductDAO(), permissiveScope, mockProvider
        );

        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(1L);

        assertThrows(NoSuchElementException.class, () ->
                service.addItem(1L, 999L, item)
        );
    }

    @Test
    @DisplayName("Thêm sản phẩm vào cơ hội ngoài phạm vi sở hữu sẽ ném SecurityException")
    void addItemOutOfScopeThrowsSecurityException() {
        OpportunityDAO mockOppDAO = new OpportunityDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of("id", id, "ownerUserId", 99L); // Chủ sở hữu là user 99
            }
        };

        // User hiện tại là 1, scope là SELF -> không được sửa cơ hội của user 99
        OpportunityItemService service = new OpportunityItemService(
                mockOppDAO, new OpportunityItemDAO(), new ProductDAO(), restrictedScope, mockProvider
        );

        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(1L);

        assertThrows(SecurityException.class, () ->
                service.addItem(1L, 10L, item)
        );
    }

    @Test
    @DisplayName("Thêm sản phẩm đã bị vô hiệu hóa (inactive) sẽ ném lỗi")
    void addItemInactiveProductThrows() {
        OpportunityDAO mockOppDAO = new OpportunityDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of("id", id, "ownerUserId", 1L);
            }
        };

        ProductDAO mockProdDAO = new ProductDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of("id", id, "name", "Gói cũ", "active", false);
            }
        };

        OpportunityItemService service = new OpportunityItemService(
                mockOppDAO, new OpportunityItemDAO(), mockProdDAO, permissiveScope, mockProvider
        );

        OpportunityItemDTO item = new OpportunityItemDTO();
        item.setProductId(1L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                service.addItem(1L, 10L, item)
        );
        assertTrue(ex.getMessage().contains("vô hiệu hóa"));
    }

    @Test
    @DisplayName("Thêm sản phẩm thành công: tự động lấy đơn giá từ bảng giá niêm yết và tính thành tiền + ACV")
    void addItemSuccessWithAutoListPriceAndAmounts() throws Exception {
        OpportunityDAO mockOppDAO = new OpportunityDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of("id", id, "ownerUserId", 1L);
            }
        };

        ProductDAO mockProdDAO = new ProductDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of(
                        "id", id,
                        "code", "CRM-SEAT-PRO",
                        "name", "CRM Professional",
                        "type", "RECURRING",
                        "unit", "User/tháng",
                        "listPrice", new BigDecimal("350000.00"),
                        "active", true
                );
            }
        };

        final OpportunityItemDTO[] savedItem = new OpportunityItemDTO[1];
        OpportunityItemDAO mockItemDAO = new OpportunityItemDAO() {
            @Override
            public long create(Connection conn, long oppId, OpportunityItemDTO item) {
                savedItem[0] = item;
                return 501L;
            }

            @Override
            public Map<String, BigDecimal> recalculateOpportunityTotals(Connection conn, long oppId) {
                return Map.of(
                        "amount", new BigDecimal("42000000.00"),
                        "annualAmount", new BigDecimal("42000000.00")
                );
            }

            @Override
            public Map<String, Object> findById(long id) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", id);
                map.put("productId", savedItem[0].getProductId());
                map.put("unitPrice", savedItem[0].getUnitPrice());
                map.put("listPrice", savedItem[0].getListPrice());
                map.put("quantity", savedItem[0].getQuantity());
                map.put("termCount", savedItem[0].getTermCount());
                map.put("totalAmount", savedItem[0].getTotalAmount());
                map.put("annualAmount", savedItem[0].getAnnualAmount());
                return map;
            }
        };

        OpportunityItemService service = new OpportunityItemService(
                mockOppDAO, mockItemDAO, mockProdDAO, permissiveScope, mockProvider
        );

        OpportunityItemDTO request = new OpportunityItemDTO();
        request.setProductId(10L);
        request.setQuantity(new BigDecimal("10")); // 10 users
        // unitPrice omitted -> should default to 350,000

        Map<String, Object> result = service.addItem(1L, 100L, request);

        assertNotNull(result);
        assertEquals(501L, result.get("id"));
        assertEquals(new BigDecimal("350000.00"), result.get("unitPrice"));
        assertEquals(new BigDecimal("350000.00"), result.get("listPrice"));
        assertEquals(12, result.get("termCount"));
        // 10 * 350,000 * 12 = 42,000,000
        assertEquals(new BigDecimal("42000000.00"), result.get("totalAmount"));
        assertEquals(new BigDecimal("42000000.00"), result.get("annualAmount"));
        // Giá trị cơ hội được trả về đồng bộ
        assertEquals(new BigDecimal("42000000.00"), result.get("opportunityAmount"));
        assertEquals(new BigDecimal("42000000.00"), result.get("opportunityAnnualAmount"));
    }

    @Test
    @DisplayName("Thêm dịch vụ thuê bao với số kỳ và đơn giá tự nhập")
    void addSubscriptionItemWithCustomTermsAndPrice() throws Exception {
        OpportunityDAO mockOppDAO = new OpportunityDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of("id", id, "ownerUserId", 1L);
            }
        };

        ProductDAO mockProdDAO = new ProductDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of(
                        "id", id,
                        "code", "SRV-MAINT-VIP",
                        "type", "RECURRING",
                        "listPrice", new BigDecimal("18000000.00"),
                        "active", true
                );
            }
        };

        final OpportunityItemDTO[] saved = new OpportunityItemDTO[1];
        OpportunityItemDAO mockItemDAO = new OpportunityItemDAO() {
            @Override
            public long create(Connection conn, long oppId, OpportunityItemDTO item) {
                saved[0] = item;
                return 502L;
            }

            @Override
            public Map<String, BigDecimal> recalculateOpportunityTotals(Connection conn, long oppId) {
                return Map.of("amount", saved[0].getTotalAmount(), "annualAmount", saved[0].getAnnualAmount());
            }

            @Override
            public Map<String, Object> findById(long id) {
                return Map.of(
                        "id", id,
                        "unitPrice", saved[0].getUnitPrice(),
                        "totalAmount", saved[0].getTotalAmount(),
                        "annualAmount", saved[0].getAnnualAmount()
                );
            }
        };

        OpportunityItemService service = new OpportunityItemService(
                mockOppDAO, mockItemDAO, mockProdDAO, permissiveScope, mockProvider
        );

        OpportunityItemDTO request = new OpportunityItemDTO();
        request.setProductId(12L);
        request.setProductType("RECURRING");
        request.setBillingCycle("MONTHLY");
        request.setTermCount(18); // 18 tháng
        request.setQuantity(new BigDecimal("1"));
        request.setUnitPrice(new BigDecimal("1500000.00")); // 1.5tr / tháng

        Map<String, Object> result = service.addItem(1L, 100L, request);

        // 1 * 1,500,000 * 18 = 27,000,000
        assertEquals(new BigDecimal("27000000.00"), result.get("totalAmount"));
        // ACV = 1 * 1,500,000 * 12 = 18,000,000
        assertEquals(new BigDecimal("18000000.00"), result.get("annualAmount"));
    }

    @Test
    @DisplayName("Xóa dòng sản phẩm và tính lại tổng cơ hội")
    void deleteItemSuccess() throws Exception {
        OpportunityDAO mockOppDAO = new OpportunityDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of("id", id, "ownerUserId", 1L);
            }
        };

        OpportunityItemDAO mockItemDAO = new OpportunityItemDAO() {
            @Override
            public Map<String, Object> findById(long id) {
                return Map.of("id", id, "opportunityId", 100L);
            }

            @Override
            public void delete(Connection conn, long id) {
            }

            @Override
            public Map<String, BigDecimal> recalculateOpportunityTotals(Connection conn, long oppId) {
                return Map.of("amount", BigDecimal.ZERO, "annualAmount", BigDecimal.ZERO);
            }
        };

        OpportunityItemService service = new OpportunityItemService(
                mockOppDAO, mockItemDAO, new ProductDAO(), permissiveScope, mockProvider
        );

        Map<String, BigDecimal> totals = service.deleteItem(1L, 100L, 501L);
        assertEquals(BigDecimal.ZERO, totals.get("amount"));
        assertEquals(BigDecimal.ZERO, totals.get("annualAmount"));
    }
}
