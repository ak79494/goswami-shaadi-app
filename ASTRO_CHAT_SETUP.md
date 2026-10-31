# Goswami Shaadi — Astro Chat Setup

## Included
- Astro Chat listing with 4 astrologers.
- Astro Dilip uses the photo supplied by the project owner.
- Three additional female astrologer profiles use public professional profile photos/details from their own public websites for prototype/demo listing.
- Separate recharge page, UPI payment page, and private Astro chat page.
- Wallet balance is stored in browser localStorage for the prototype flow.

## Important payment setting
The existing project already contained the UPI VPA:

`goswamiarun263@okicici`

The Astro payment screen reuses that existing VPA and shows the payee as **Goswami Shaadi**. A phone number alone (for example 7903508584) is not enough to safely infer a UPI VPA, so do not replace the VPA with `7903508584@upi` unless that is the actual UPI VPA/UPI Number registered to the receiving account.

If the receiving UPI VPA is different, change `UPI_ID` at the top of:

`frontend/src/AstroPayment.jsx`

## Call privacy limitation
A browser `tel:` link can start a normal phone call, but it cannot provide true caller-ID masking. The current Astro session keeps the astrologer's phone number out of the UI and uses the phone call action for direct calling.

For **true masked calling** (user sees a service/virtual number and Dilip receives the call without exposing his personal number), the backend must be connected to a telephony provider such as Exotel, Twilio, Plivo, or a similar service. Provider credentials and a verified virtual number are required; they cannot be safely invented in source code.

## WhatsApp limitation
The chat flow opens WhatsApp with the astrologer's number and a prefilled message. WhatsApp click-to-chat does not provide a reliable way to hide the destination phone number from the user. True number masking requires a WhatsApp Business/API relay operated by the business account.

## Build
Run in `frontend`:

```bash
npm install
npm run dev
```

The supplied archive intentionally does not include `node_modules`.
