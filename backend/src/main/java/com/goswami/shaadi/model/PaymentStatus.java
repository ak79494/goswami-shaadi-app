package com.goswami.shaadi.model;

public enum PaymentStatus {
    CREATED,
    /** The member submitted a UPI reference; an admin still has to confirm the money arrived. */
    PENDING,
    PAID,
    REJECTED
}
