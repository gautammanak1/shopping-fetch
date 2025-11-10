# Shiprocket Integration Setup

Complete Shiprocket API integration for automated shipping and delivery tracking.

## Features

✅ **Automatic Order Creation** - Orders automatically created in Shiprocket
✅ **AWB Generation** - Automatic Airway Bill generation
✅ **Real-time Tracking** - Track shipments via AWB or Shipment ID
✅ **Shipping Rates** - Calculate shipping costs automatically
✅ **Order Management** - Full order lifecycle management

## Setup Instructions

### 1. Get Shiprocket API User Credentials

⚠️ **IMPORTANT**: You need to create an API User, NOT use your main login credentials!

1. Login to [Shiprocket Dashboard](https://app.shiprocket.in/)
2. Go to **Settings** → **API** from left menu
3. Click **Configure** → **Create an API User** button
4. Enter a **Valid Email ID** (MUST be different from your registered Shiprocket email)
5. Enter an appropriate password
6. Use these API user credentials (NOT your main login credentials)

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Shiprocket API User Credentials (NOT your main login!)
# These must be from Settings > API > Create API User
SHIPROCKET_EMAIL=your_api_user_email@example.com
SHIPROCKET_PASSWORD=your_api_user_password
SHIPROCKET_PICKUP_PINCODE=110001
SHIPROCKET_PICKUP_LOCATION=Your Warehouse Name
```

**⚠️ Critical**: 
- Use **API User email** (created in Settings > API), NOT your registered email
- API User email must be different from your main Shiprocket login email
- Token is valid for 240 hours (10 days), then needs to be refreshed

### 3. Setup Pickup Location in Shiprocket

1. Login to Shiprocket dashboard
2. Go to Settings → Pickup Locations
3. Add your warehouse/pickup location
4. Note the location name (use in `SHIPROCKET_PICKUP_LOCATION`)

### 4. Database Setup

Run `supabase-updates.sql` to add Shiprocket columns:
- `awb_number` - Shiprocket AWB tracking
- `shiprocket_order_id` - Shiprocket order ID
- `shiprocket_shipment_id` - Shiprocket shipment ID

## API Endpoints

### Shiprocket Authentication
- `POST /api/shiprocket/auth` - Get auth token

### Order Tracking
- `GET /api/shiprocket/track?shipment_id=123` - Track by shipment ID
- `GET /api/shiprocket/track?awb=1234567890` - Track by AWB

### Shipping Rates
- `POST /api/shiprocket/rates` - Calculate shipping cost
  ```json
  {
    "pickup_pincode": "110001",
    "delivery_pincode": "400001",
    "weight": 0.2
  }
  ```

## API Workflow (According to Shiprocket Docs)

Following the official Shiprocket API workflow:

1. **Authenticate** → POST `/v1/external/auth/login` (get token, valid 240 hours)
2. **Check Serviceability** → GET `/v1/external/courier/serviceability/` (optional)
3. **Create Order** → POST `/v1/external/orders/create/adhoc` (get order_id, shipment_id)
4. **Assign AWB** → POST `/v1/external/courier/assign/awb` (get awb_code)
5. **Generate Pickup** → POST `/v1/external/courier/generate/pickup`
6. **Generate Manifest** → POST `/v1/external/manifests/generate`
7. **Generate Label** → POST `/v1/external/courier/generate/label`
8. **Track** → GET `/v1/external/courier/track/awb/{awb_code}`

### Our Implementation Flow

1. **User places order** via agent or web
2. **Order created in database** with user details
3. **Shiprocket order created** automatically (step 3)
4. **AWB assigned** automatically (step 4)
5. **Order updated** with Shiprocket IDs and AWB
6. **Tracking number returned** to user

### Tracking

Users can track orders using:
- Internal tracking number (TRK-XXXXX)
- Shiprocket AWB number
- Shipment ID

## Features in Action

### Automatic Integration

When order is placed:
- ✅ Order synced to Shiprocket
- ✅ AWB automatically generated
- ✅ Tracking available immediately
- ✅ Delivery partner assigned
- ✅ Shipping cost calculated

### Agent Integration

Agent automatically:
- Shows Shiprocket AWB in order confirmation
- Displays tracking info with AWB
- Shows delivery partner details
- Provides Shiprocket shipment ID

## Error Handling

- If Shiprocket API fails, order still created in DB
- Falls back to internal tracking system
- Can retry Shiprocket sync later
- No order loss on API failures

## Testing

1. Place a test order with valid address
2. Check order response for `awb_number`
3. Track using AWB: `Track <awb_number>`
4. Verify in Shiprocket dashboard

## Support

- Shiprocket API Docs: https://apidocs.shiprocket.in/
- API Base URL: `https://apiv2.shiprocket.in/v1/external`

