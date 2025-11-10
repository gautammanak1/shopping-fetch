# Shiprocket Integration Troubleshooting

## Common Error: "Access forbidden"

### Cause
Using main Shiprocket login credentials instead of API user credentials.

### Solution

1. **Create API User (NOT your main login)**:
   - Login to Shiprocket Dashboard
   - Go to **Settings** → **API** → **Configure**
   - Click **Create an API User**
   - Enter email **different** from your registered email
   - Set password
   - **Use these credentials** in `.env.local`

2. **Environment Variables**:
   ```env
   # WRONG - Don't use your main login email
   # SHIPROCKET_EMAIL=your_registered_email@example.com
   
   # CORRECT - Use API user email
   SHIPROCKET_EMAIL=api_user_email@example.com
   SHIPROCKET_PASSWORD=api_user_password
   ```

### Verification Steps

1. Test authentication:
   ```bash
   curl -X POST https://apiv2.shiprocket.in/v1/external/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"YOUR_API_USER_EMAIL","password":"YOUR_API_USER_PASSWORD"}'
   ```

2. Should return token:
   ```json
   {
     "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
     "expires_at": "2024-01-15T10:00:00Z"
   }
   ```

## API Workflow

Following official Shiprocket documentation:

1. ✅ **Authenticate** → `/v1/external/auth/login` (POST)
2. ✅ **Check Serviceability** → `/v1/external/courier/serviceability/` (GET)
3. ✅ **Create Order** → `/v1/external/orders/create/adhoc` (POST)
4. ✅ **Assign AWB** → `/v1/external/courier/assign/awb` (POST)
5. **Generate Pickup** → `/v1/external/courier/generate/pickup` (POST) - Optional
6. **Generate Manifest** → `/v1/external/manifests/generate` (POST) - Optional
7. **Generate Label** → `/v1/external/courier/generate/label` (POST) - Optional
8. ✅ **Track** → `/v1/external/courier/track/awb/{awb_code}` (GET)

## Token Validity

- Token is valid for **240 hours (10 days)**
- Automatically refreshed when expired
- Pass as: `Authorization: Bearer <token>`

## Testing

After fixing credentials, order placement should work:
- Order created in database ✅
- Shiprocket order created ✅
- AWB assigned ✅
- Tracking number returned ✅

If order creation succeeds but AWB fails, the order is still created in your database with internal tracking number.

