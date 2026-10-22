package com.crm.service.pipeline;

import com.crm.config.DatabaseConfig;
import com.crm.dao.pipeline.OpportunityDAO;
import com.crm.dao.pipeline.OpportunityItemDAO;
import com.crm.dao.products.ProductDAO;
import com.crm.dto.pipeline.OpportunityItemDTO;
import com.crm.service.permissions.DataScopeContext;
import com.crm.service.permissions.DataScopeService;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.*;

public class OpportunityItemService {

    @FunctionalInterface
    public interface ConnectionProvider {
        Connection getConnection() throws SQLException;
    }

    private final OpportunityDAO opportunityDAO;
    private final OpportunityItemDAO itemDAO;
    private final ProductDAO productDAO;
    private final DataScopeService dataScopeService;
    private final ConnectionProvider connectionProvider;

    public OpportunityItemService() {
        this(new OpportunityDAO(), new OpportunityItemDAO(), new ProductDAO(), new DataScopeService(), DatabaseConfig::getConnection);
    }

    public OpportunityItemService(
            OpportunityDAO opportunityDAO,
            OpportunityItemDAO itemDAO,
            ProductDAO productDAO,
            DataScopeService dataScopeService
    ) {
        this(opportunityDAO, itemDAO, productDAO, dataScopeService, DatabaseConfig::getConnection);
    }

    public OpportunityItemService(
            OpportunityDAO opportunityDAO,
            OpportunityItemDAO itemDAO,
            ProductDAO productDAO,
            DataScopeService dataScopeService,
            ConnectionProvider connectionProvider
    ) {
        this.opportunityDAO = opportunityDAO;
        this.itemDAO = itemDAO;
        this.productDAO = productDAO;
        this.dataScopeService = dataScopeService;
        this.connectionProvider = connectionProvider != null ? connectionProvider : DatabaseConfig::getConnection;
    }

    public List<Map<String, Object>> getItems(long currentUserId, long opportunityId) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        Map<String, Object> opp = opportunityDAO.findById(opportunityId);
        if (opp == null) {
            throw new NoSuchElementException("Không tìm thấy cơ hội bán hàng.");
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        return itemDAO.findByOpportunityId(opportunityId);
    }

    public Map<String, Object> getItemById(long currentUserId, long opportunityId, long itemId) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "read");
        Map<String, Object> opp = opportunityDAO.findById(opportunityId);
        if (opp == null) {
            throw new NoSuchElementException("Không tìm thấy cơ hội bán hàng.");
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền truy cập dữ liệu này do giới hạn phạm vi sở hữu.");
        }

        Map<String, Object> item = itemDAO.findById(itemId);
        if (item == null || !Long.valueOf(opportunityId).equals(item.get("opportunityId"))) {
            return null;
        }
        return item;
    }

    public Map<String, Object> addItem(long currentUserId, long opportunityId, OpportunityItemDTO item) throws Exception {
        if (item == null || item.getProductId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn sản phẩm từ danh mục.");
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> opp = opportunityDAO.findById(opportunityId);
        if (opp == null) {
            throw new NoSuchElementException("Không tìm thấy cơ hội bán hàng.");
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa cơ hội này do giới hạn phạm vi sở hữu.");
        }

        // Get product info from catalog
        Map<String, Object> product = productDAO.findById(item.getProductId());
        if (product == null) {
            throw new IllegalArgumentException("Sản phẩm không tồn tại trong danh mục.");
        }
        if (Boolean.FALSE.equals(product.get("active"))) {
            throw new IllegalArgumentException("Sản phẩm đã bị vô hiệu hóa.");
        }

        // Auto compute item amounts, defaulting unit price to list price if not specified
        OpportunityCalculator.computeItemAmounts(item, product);

        long itemId;
        Map<String, BigDecimal> newTotals;
        try (Connection conn = connectionProvider.getConnection()) {
            conn.setAutoCommit(false);
            try {
                itemId = itemDAO.create(conn, opportunityId, item);
                newTotals = itemDAO.recalculateOpportunityTotals(conn, opportunityId);
                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        }

        Map<String, Object> raw = itemDAO.findById(itemId);
        if (raw == null) {
            return null;
        }
        Map<String, Object> result = new LinkedHashMap<>(raw);
        result.put("opportunityAmount", newTotals.get("amount"));
        result.put("opportunityAnnualAmount", newTotals.get("annualAmount"));
        return result;
    }

    public Map<String, Object> updateItem(long currentUserId, long opportunityId, long itemId, OpportunityItemDTO item) throws Exception {
        if (item == null) {
            throw new IllegalArgumentException("Dữ liệu sản phẩm không hợp lệ.");
        }

        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> opp = opportunityDAO.findById(opportunityId);
        if (opp == null) {
            throw new NoSuchElementException("Không tìm thấy cơ hội bán hàng.");
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa cơ hội này do giới hạn phạm vi sở hữu.");
        }

        Map<String, Object> existingItem = itemDAO.findById(itemId);
        if (existingItem == null || !Long.valueOf(opportunityId).equals(existingItem.get("opportunityId"))) {
            throw new NoSuchElementException("Không tìm thấy dòng sản phẩm trong cơ hội.");
        }

        Long prodId = item.getProductId() != null ? item.getProductId() : (Long) existingItem.get("productId");
        item.setProductId(prodId);

        Map<String, Object> product = productDAO.findById(prodId);
        if (product == null) {
            throw new IllegalArgumentException("Sản phẩm không tồn tại trong danh mục.");
        }

        // Auto compute item amounts
        OpportunityCalculator.computeItemAmounts(item, product);

        Map<String, BigDecimal> newTotals;
        try (Connection conn = connectionProvider.getConnection()) {
            conn.setAutoCommit(false);
            try {
                itemDAO.update(conn, itemId, item);
                newTotals = itemDAO.recalculateOpportunityTotals(conn, opportunityId);
                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        }

        Map<String, Object> raw = itemDAO.findById(itemId);
        if (raw == null) {
            return null;
        }
        Map<String, Object> result = new LinkedHashMap<>(raw);
        result.put("opportunityAmount", newTotals.get("amount"));
        result.put("opportunityAnnualAmount", newTotals.get("annualAmount"));
        return result;
    }

    public Map<String, BigDecimal> deleteItem(long currentUserId, long opportunityId, long itemId) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> opp = opportunityDAO.findById(opportunityId);
        if (opp == null) {
            throw new NoSuchElementException("Không tìm thấy cơ hội bán hàng.");
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa cơ hội này do giới hạn phạm vi sở hữu.");
        }

        Map<String, Object> existingItem = itemDAO.findById(itemId);
        if (existingItem == null || !Long.valueOf(opportunityId).equals(existingItem.get("opportunityId"))) {
            throw new NoSuchElementException("Không tìm thấy dòng sản phẩm trong cơ hội.");
        }

        Map<String, BigDecimal> newTotals;
        try (Connection conn = connectionProvider.getConnection()) {
            conn.setAutoCommit(false);
            try {
                itemDAO.delete(conn, itemId);
                newTotals = itemDAO.recalculateOpportunityTotals(conn, opportunityId);
                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        }
        return newTotals;
    }

    public Map<String, Object> saveItems(long currentUserId, long opportunityId, List<OpportunityItemDTO> items) throws Exception {
        DataScopeContext scope = dataScopeService.resolve(currentUserId, "opportunity", "update");
        Map<String, Object> opp = opportunityDAO.findById(opportunityId);
        if (opp == null) {
            throw new NoSuchElementException("Không tìm thấy cơ hội bán hàng.");
        }

        long ownerId = (Long) opp.get("ownerUserId");
        if (!scope.canAccessOwner(ownerId)) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa cơ hội này do giới hạn phạm vi sở hữu.");
        }

        if (items != null) {
            for (OpportunityItemDTO item : items) {
                if (item.getProductId() == null) {
                    throw new IllegalArgumentException("Mỗi dòng sản phẩm phải có mã sản phẩm (productId).");
                }
                Map<String, Object> product = productDAO.findById(item.getProductId());
                if (product == null) {
                    throw new IllegalArgumentException("Sản phẩm ID " + item.getProductId() + " không tồn tại.");
                }
                OpportunityCalculator.computeItemAmounts(item, product);
            }
        }

        Map<String, BigDecimal> newTotals;
        try (Connection conn = connectionProvider.getConnection()) {
            conn.setAutoCommit(false);
            try {
                itemDAO.deleteByOpportunityId(conn, opportunityId);
                if (items != null) {
                    for (OpportunityItemDTO item : items) {
                        itemDAO.create(conn, opportunityId, item);
                    }
                }
                newTotals = itemDAO.recalculateOpportunityTotals(conn, opportunityId);
                conn.commit();
            } catch (Exception e) {
                conn.rollback();
                throw e;
            }
        }

        List<Map<String, Object>> savedItems = itemDAO.findByOpportunityId(opportunityId);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("opportunityId", opportunityId);
        response.put("items", savedItems);
        response.put("amount", newTotals.get("amount"));
        response.put("annualAmount", newTotals.get("annualAmount"));
        return response;
    }
}
