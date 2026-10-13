/**
 * =============================================================================
 * pricing.js — Namaste Junction Indian Hotel Accommodation Pricing & GST Engine
 * Supports Dynamic Room Types, Guest Occupancy Rules, and Statutory GST Slabs
 * =============================================================================
 */

// Statutory Indian Hotel Accommodation GST Rate Slabs (CBIC / GST Council Regulations)
// Threshold is based on effective accommodation value per unit/room per day.
const GST_CONFIG = {
    slabs: [
        { max: 1000, rate: 0.00, label: "GST (Exempt)" },
        { max: 7500, rate: 0.12, label: "GST (12%)" },
        { max: Infinity, rate: 0.18, label: "GST (18%)" }
    ],
    /**
     * Determines applicable GST slab based on daily room tariff
     * @param {number} dailyTariffPerRoom 
     * @returns {{ max: number, rate: number, label: string }}
     */
    getGSTRate(dailyTariffPerRoom) {
        const val = Math.max(0, Number(dailyTariffPerRoom) || 0);
        for (const slab of this.slabs) {
            if (val <= slab.max) {
                return slab;
            }
        }
        return this.slabs[this.slabs.length - 1];
    }
};

/**
 * Standard authentic room templates generated when a property doesn't have custom room data
 * @param {number} basePrice Base property nightly rate
 * @returns {Array<Object>}
 */
function getDefaultRoomTypes(basePrice) {
    const base = Math.max(1000, Number(basePrice) || 3000);
    return [
        {
            code: "standard",
            name: "Standard Room",
            price: Math.max(800, Math.round(base * 0.85)),
            baseOccupancy: 2,
            maxOccupancy: 2,
            extraGuestRate: 0,
            bedConfig: "1 Queen Bed",
            roomSize: "280 sq.ft",
            amenities: ["Ensuite Bathroom", "High-Speed Wi-Fi", "Air Conditioning", "Electric Kettle", "Daily Housekeeping"],
            description: "Comfortable and cozy room featuring premium mattress, warm lighting, and essential amenities for solo travelers or couples."
        },
        {
            code: "deluxe",
            name: "Deluxe Room",
            price: base,
            baseOccupancy: 2,
            maxOccupancy: 3,
            extraGuestRate: Math.max(500, Math.round(base * 0.12)),
            bedConfig: "1 King Bed",
            roomSize: "380 sq.ft",
            amenities: ["Private Balcony", "High-Speed Wi-Fi", "Smart TV", "Mini Fridge", "Complimentary Tea & Coffee", "Premium Toiletries"],
            description: "Spacious and elegant room with private balcony view, plush king bed, ergonomic workspace, and premium bath essentials."
        },
        {
            code: "suite",
            name: "Executive Suite",
            price: Math.round(base * 1.45),
            baseOccupancy: 2,
            maxOccupancy: 4,
            extraGuestRate: Math.max(800, Math.round(base * 0.15)),
            bedConfig: "1 King Bed + 1 Sofa Bed",
            roomSize: "550 sq.ft",
            amenities: ["Panoramic Scenic View", "Separate Living Lounge", "Luxury Soaking Tub", "Espresso Machine", "Complimentary Breakfast", "Smart TV"],
            description: "Luxurious open-plan suite featuring a dedicated living lounge, deep soaking tub, scenic landscape views, and bespoke concierge service."
        },
        {
            code: "family",
            name: "Family Suite",
            price: Math.round(base * 1.85),
            baseOccupancy: 4,
            maxOccupancy: 6,
            extraGuestRate: Math.max(600, Math.round(base * 0.10)),
            bedConfig: "2 Queen Beds + 1 Daybed",
            roomSize: "680 sq.ft",
            amenities: ["Spacious Living & Dining", "Two Full Bathrooms", "Balcony Deck", "Kids Welcome Kit", "Mini Kitchenette", "High-Speed Wi-Fi"],
            description: "Expansive multi-bed sanctuary tailor-made for families and groups, featuring dual bathrooms, dining space, and panoramic outdoor balcony."
        }
    ];
}

/**
 * Calculates a complete, verified server-side price breakdown.
 * Never trusts client numbers; recalculates from listing and room rates.
 * 
 * @param {Object} options
 * @param {Object} options.listing Listing document or object
 * @param {number} options.nights Number of nights (1 to 60)
 * @param {number} options.guestsCount Number of guests (1 to 12)
 * @param {string} [options.roomTypeCode] Selected room code (standard, deluxe, suite, family)
 * @returns {Object} itemized price breakdown
 */
function calculateBookingPrice({ listing, nights, guestsCount, roomTypeCode }) {
    const validNights = Math.max(1, Math.min(60, Number(nights) || 1));
    const validGuests = Math.max(1, Math.min(12, Number(guestsCount) || 2));
    const baseListingPrice = Math.max(0, Number(listing ? listing.price : 0) || 0);

    // Resolve room types from listing or standard defaults
    const roomTypes = (listing && Array.isArray(listing.roomTypes) && listing.roomTypes.length > 0)
        ? listing.roomTypes
        : getDefaultRoomTypes(baseListingPrice);

    // Select matched room type, or fallback to deluxe / first available
    let room = roomTypes.find((r) => r.code === roomTypeCode);
    if (!room) {
        room = roomTypes.find((r) => r.code === "deluxe") || roomTypes[0];
    }

    const nightlyRate = Math.max(0, Number(room.price) || baseListingPrice);
    const baseOccupancy = Math.max(1, Number(room.baseOccupancy) || 2);
    const maxOccupancy = Math.max(baseOccupancy, Number(room.maxOccupancy) || 3);
    const extraGuestRate = Math.max(0, Number(room.extraGuestRate) || 0);

    // Dynamic Multi-Room Allocation when guest count exceeds single room maxOccupancy
    let roomsRequired = 1;
    let occupancyNote = null;
    if (validGuests > maxOccupancy) {
        roomsRequired = Math.ceil(validGuests / maxOccupancy);
        occupancyNote = `${validGuests} guests allocated across ${roomsRequired} rooms (max ${maxOccupancy} guests per ${room.name}).`;
    }

    // Total base capacity included across allocated rooms
    const totalIncludedCapacity = baseOccupancy * roomsRequired;

    // Extra guests calculation (guests above base occupancy across the allocated rooms)
    let extraGuestsCount = 0;
    if (validGuests > totalIncludedCapacity) {
        extraGuestsCount = validGuests - totalIncludedCapacity;
    }

    const roomBaseCharge = nightlyRate * roomsRequired * validNights;
    const extraGuestCharge = extraGuestsCount * extraGuestRate * validNights;
    const accommodationSubtotal = roomBaseCharge + extraGuestCharge;

    // Statutory Indian Hotel GST:
    // Rate applies based on per-unit (per room) daily tariff
    const dailyTariffPerRoom = (nightlyRate * roomsRequired + (extraGuestsCount * extraGuestRate)) / roomsRequired;
    const gstSlab = GST_CONFIG.getGSTRate(dailyTariffPerRoom);
    const taxAmount = Math.round(accommodationSubtotal * gstSlab.rate);
    const totalPrice = accommodationSubtotal + taxAmount;

    return {
        roomTypeCode: room.code,
        roomTypeName: room.name,
        bedConfig: room.bedConfig || "1 King Bed",
        nightlyRate,
        nights: validNights,
        guestsCount: validGuests,
        roomsRequired,
        baseOccupancy,
        maxOccupancy,
        extraGuestsCount,
        extraGuestRate,
        roomBaseCharge,
        extraGuestCharge,
        accommodationSubtotal,
        gstRate: gstSlab.rate,
        gstLabel: gstSlab.label,
        taxAmount,
        totalPrice,
        occupancyNote,
        roomTypesSummary: roomTypes.map((r) => ({
            code: r.code,
            name: r.name,
            price: r.price,
            baseOccupancy: r.baseOccupancy,
            maxOccupancy: r.maxOccupancy,
            extraGuestRate: r.extraGuestRate,
            bedConfig: r.bedConfig,
            roomSize: r.roomSize,
            amenities: r.amenities,
            description: r.description,
        })),
    };
}

module.exports = {
    GST_CONFIG,
    getDefaultRoomTypes,
    calculateBookingPrice,
};
