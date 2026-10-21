package lk.supermarket.inventory.service;

import lk.supermarket.inventory.dao.PurchaseOrderDao;
import lk.supermarket.inventory.dto.ConfirmPoRequest;
import lk.supermarket.inventory.dto.CreatePoRequest;
import lk.supermarket.inventory.dto.PurchaseOrderDto;
import lk.supermarket.inventory.dto.ReceivePoRequest;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service orchestrating Purchase Order 3-Way matching workflows:
 * Store Requisition -> Supplier Confirmation -> Warehouse GRN Receipt.
 */
@Service
public class PurchaseOrderService {

    private final PurchaseOrderDao purchaseOrderDao;

    public PurchaseOrderService(PurchaseOrderDao purchaseOrderDao) {
        this.purchaseOrderDao = purchaseOrderDao;
    }

    public List<PurchaseOrderDto> getOrders(Integer branchId, Integer supplierId) {
        return purchaseOrderDao.getPurchaseOrders(branchId, supplierId);
    }

    public PurchaseOrderDto getOrderById(int poId) {
        return purchaseOrderDao.getPurchaseOrderById(poId);
    }

    public Integer createOrder(CreatePoRequest request) {
        return purchaseOrderDao.createPurchaseOrder(request);
    }

    public void confirmOrder(ConfirmPoRequest request) {
        purchaseOrderDao.confirmOrder(request);
    }

    public void receiveOrder(ReceivePoRequest request) {
        purchaseOrderDao.receiveOrder(request);
    }
}
