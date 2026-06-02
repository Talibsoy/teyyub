-- docs/booking_orchestration.sql
-- Natoure Unified Booking & Orchestration Schema

-- 1. BOOKING CARTS
CREATE TABLE IF NOT EXISTS booking_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    markup_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    order_status VARCHAR(50) NOT NULL DEFAULT 'cart', -- 'cart', 'processing', 'completed', 'manual_review'
    payment_intent_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BOOKING ITEMS (Flights, Hotels, Cars, Activities)
CREATE TABLE IF NOT EXISTS booking_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES booking_carts(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- 'flight', 'hotel', 'car', 'activity'
    provider_offer_id VARCHAR(255) NOT NULL, -- original ID from B2B API (Duffel/RateHawk)
    raw_price NUMERIC(10, 2) NOT NULL, -- Net price from provider
    displayed_price NUMERIC(10, 2) NOT NULL, -- Price shown to user (+10% markup)
    details JSONB NOT NULL DEFAULT '{}'::jsonb, -- Destination, airline, hotel room details
    booking_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'booked', 'failed'
    provider_confirmation_code VARCHAR(100), -- PNR or booking code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BOOKING TRAVELERS (Unified passport form data)
CREATE TABLE IF NOT EXISTS booking_travelers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES booking_carts(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    passport_number VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. NOTIFICATIONS (Quiet luxury fallback alerts for customer dashboard)
CREATE TABLE IF NOT EXISTS booking_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cart_id UUID REFERENCES booking_carts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'upgrade', 'alert'
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS) policies
ALTER TABLE booking_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;

-- Simple read policy for owner users
CREATE POLICY "Users can read own carts" ON booking_carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own booking items" ON booking_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM booking_carts 
            WHERE booking_carts.id = booking_items.cart_id AND booking_carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can read own travelers info" ON booking_travelers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM booking_carts 
            WHERE booking_carts.id = booking_travelers.cart_id AND booking_carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can read own notifications" ON booking_notifications
    FOR SELECT USING (auth.uid() = user_id);
