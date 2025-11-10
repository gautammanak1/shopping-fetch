# Shiprocket Order Verification Guide

## ✅ Order कैसे Check करें

### 1. Console Logs में Check करें

जब आप order place करते हैं, तो terminal में आपको निम्न logs दिखेंगे:

```
✅ Shiprocket order created successfully!
📦 Shiprocket Response: { order_id: "...", shipment_id: ... }
🔗 View in Shiprocket Dashboard: https://app.shiprocket.in/orders/...
✅ AWB assigned: ...
```

अगर ये logs दिखते हैं, तो order Shiprocket में successfully create हो गया है।

---

### 2. API Response में Check करें

Order place करने के बाद, API response में ये fields check करें:

```json
{
  "shiprocket_order_id": "...",
  "shiprocket_shipment_id": 123,
  "shiprocket_success": true,
  "shiprocket_dashboard_url": "https://app.shiprocket.in/orders/...",
  "verify_url": "http://localhost:3000/api/shiprocket/verify?order_id=..."
}
```

- `shiprocket_success: true` → Order Shiprocket में successfully add हुआ
- `shiprocket_order_id` → Shiprocket का order ID
- `shiprocket_dashboard_url` → Direct link to Shiprocket dashboard

---

### 3. Verify API Endpoint Use करें

#### Order ID से Verify करें:
```bash
curl "http://localhost:3000/api/shiprocket/verify?order_id=YOUR_ORDER_ID"
```

**Response:**
```json
{
  "success": true,
  "found": true,
  "type": "order",
  "data": { ... },
  "message": "Order ... found in Shiprocket"
}
```

#### Shipment ID से Verify करें:
```bash
curl "http://localhost:3000/api/shiprocket/verify?shipment_id=123456"
```

---

### 4. All Orders Fetch करें

Shiprocket से सभी orders fetch करें:

```bash
curl "http://localhost:3000/api/shiprocket/orders?page=1&per_page=100"
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 100)
- `order_id` - Filter by specific order ID
- `status` - Filter by status

---

### 5. Shiprocket Dashboard में Check करें

1. https://app.shiprocket.in पर login करें
2. **Orders** section में जाएं
3. Order ID या customer name से search करें

या direct link use करें (API response में `shiprocket_dashboard_url` मिलेगा):
```
https://app.shiprocket.in/orders/YOUR_ORDER_ID
```

---

### 6. Database में Check करें

Database में order table में ये fields check करें:

```sql
SELECT 
  id,
  shiprocket_order_id,
  shiprocket_shipment_id,
  awb_number,
  tracking_number,
  status
FROM orders
WHERE shiprocket_order_id IS NOT NULL;
```

- अगर `shiprocket_order_id` है → Order Shiprocket में add हुआ
- अगर `awb_number` है → AWB भी assign हो गया
- अगर `shiprocket_order_id` NULL है → Order Shiprocket में add नहीं हुआ (manual processing)

---

## ❌ Troubleshooting

### Order Shiprocket में Add नहीं हुआ

1. **Console logs check करें:**
   ```
   Shiprocket integration error: ...
   ```
   
2. **Common Errors:**
   - `Access forbidden` → API credentials check करें
   - `Invalid Data` → Order payload format check करें
   - `Pickup location not found` → Pickup location name check करें

3. **Verify करें:**
   - API user credentials सही हैं?
   - Pickup location Shiprocket dashboard में configured है?
   - Address format सही है? (city, state, pincode)

---

## 🔍 Quick Check Commands

```bash
# Verify specific order
curl "http://localhost:3000/api/shiprocket/verify?order_id=YOUR_ORDER_ID"

# Get all orders
curl "http://localhost:3000/api/shiprocket/orders"

# Check order by shipment ID
curl "http://localhost:3000/api/shiprocket/verify?shipment_id=123456"
```

---

## 📝 Notes

- Order place करने के बाद, console logs में success message दिखेगा
- अगर Shiprocket API fail होती है, order फिर भी database में create होगा (manual processing के लिए)
- `shiprocket_success: false` का मतलब है order database में है लेकिन Shiprocket में नहीं
- AWB assignment optional है - order बिना AWB के भी Shiprocket में add हो सकता है

