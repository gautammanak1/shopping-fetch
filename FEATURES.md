# New Features Added

## 1. User Details Collection
- Agent now collects user details before placing orders
- Required fields: Name, Email, Phone, Shipping Address
- Agent extracts details from natural language
- Details are stored temporarily during order process

## 2. Order Tracking System
- Every order gets a unique tracking number (format: TRK-XXXXX-XXXX)
- Users can track orders using tracking number
- Track orders via agent: "Track TRK-ABC123-XYZ"
- Shows order status, product details, and delivery partner info

## 3. Dealer/Delivery Partner System
- Dealers table for managing delivery partners
- Automatic dealer assignment (round-robin based on order count)
- Each order assigned to available dealer
- Track which dealer is handling which order

## Database Updates

Run `supabase-updates.sql` to add:
- User details columns to orders table
- Tracking number column
- Dealer ID column
- Dealers table
- Indexes for faster queries

## API Endpoints

### Orders
- `POST /api/orders` - Create order (now requires user details)
- `GET /api/orders` - Get all orders (filter by tracking or dealer_id)
- `GET /api/orders/[id]` - Get specific order
- `PATCH /api/orders/[id]` - Update order status

### Dealers
- `GET /api/dealers` - Get all dealers
- `POST /api/dealers` - Create new dealer

## Agent Features

### User Details Collection
Example conversation:
```
User: "I want to buy product #1 in size M"
Agent: "Great! I need your details: name, email, phone, shipping address"
User: "My name is John Doe, email is john@example.com, phone is +1234567890, address is 123 Main St"
Agent: "✅ Order placed! Tracking: TRK-XXXXX"
```

### Order Tracking
```
User: "Track TRK-ABC123-XYZ"
Agent: Shows order status, product, dealer info
```

### Dealer Assignment
- Automatically assigns dealer with least orders
- Shows dealer info in tracking response
- Updates dealer's order count

