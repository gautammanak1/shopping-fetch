# Shiprocket Pickup Location Setup

## ⚠️ Important: Pickup Location Name

The `pickup_location` field in the API **must be the exact name** from your Shiprocket dashboard, NOT the full address.

## How to Find Your Pickup Location Name

1. Login to [Shiprocket Dashboard](https://app.shiprocket.in/)
2. Go to **Settings** → **Pickup Locations**
3. You'll see your pickup locations listed with names like:
   - "Home" (Currently configured)
   - "Primary"
   - "Warehouse 1"
   - "Noida Warehouse"
   - etc.
4. **Copy the exact name** (not the address)

## Update Environment Variable

Set `SHIPROCKET_PICKUP_LOCATION` to the **location name**, not the address:

```env
# ✅ CORRECT - Use location name
SHIPROCKET_PICKUP_LOCATION=Primary

# ❌ WRONG - Don't use full address
SHIPROCKET_PICKUP_LOCATION=374 Gali No. 2 Sector 59, Noida...
```

## Current Configuration

**Default Pickup Location:** `"Home"`

**Address Details:**
- Address: 374 Gali No. 2 Sector 59, Noida, UP
- Pincode: 201301
- City: Gautam Buddha Nagar
- State: Uttar Pradesh
- Contact: GAUTAM KUMAR (9997355153)

## Default Behavior

If not set or if it looks like an address (contains commas), the code will default to **"Home"** (as configured).

## Common Errors

- ❌ "Invalid Data" → Check pickup_location name matches dashboard
- ❌ "Location not found" → Verify location exists in Shiprocket dashboard
- ❌ "Access forbidden" → Check API user credentials

## Quick Test

You can check your locations by calling the Shiprocket API (after authentication):

```bash
curl -X GET https://apiv2.shiprocket.in/v1/external/settings/company/pickup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This will list all your pickup locations with their exact names.

