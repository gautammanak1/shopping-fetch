# Environment Variables Setup

## ✅ Credentials Already Hardcoded!

Your Shiprocket credentials are **already hardcoded** in `config/shiprocket.config.ts`:
- Email: `gautammanak2@gmail.com`
- Password: `4z@ItFRvI9AhvC0Y`

**You don't need to set environment variables** - they work out of the box!

## Optional: Override with Environment Variables

If you want to use different credentials, create `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Shiprocket API User Credentials
# ✅ These are your API user credentials (tested and working)
SHIPROCKET_EMAIL=gautammanak2@gmail.com
SHIPROCKET_PASSWORD=4z@ItFRvI9AhvC0Y
SHIPROCKET_PICKUP_PINCODE=201301
SHIPROCKET_PICKUP_LOCATION=Home

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Verification

Your Shiprocket credentials are tested and working:
- ✅ API User Email: `gautammanak2@gmail.com`
- ✅ Token successfully generated
- ✅ Company ID: 3406078
- ✅ User ID: 8419925

## Important Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **API User vs Main Login**: These are API user credentials, different from your Shiprocket dashboard login
3. **Token Validity**: Token is valid for 240 hours (10 days), auto-refreshes when needed

## Test Authentication

You can verify credentials work:
```bash
curl -X POST https://apiv2.shiprocket.in/v1/external/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gautammanak2@gmail.com","password":"4z@ItFRvI9AhvC0Y"}'
```

Expected response: JSON with `token` field

