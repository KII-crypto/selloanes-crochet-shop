# Selloane's Order Hub

Build a complete production-ready full-stack web application for a handmade crochet scrunchie business called Selloane's Crochet. Build the actual working system, not a static mockup. Use a real persistent database, backend logic and secure authentication. Do not use fake/demo orders or simulated functionality.



BRAND & DESIGN

Business: Selloane's Crochet

Tagline: "Handmade. Unique. Beautifully You."

Secondary: "Handmade with love ♡"



Make the site cute, warm, modern, professional and visually interesting, NOT boring and NOT overwhelmingly pink/girly. Use cream/off-white, burgundy/deep red, warm brown, white and tasteful accent colours. Use a cute but simple readable font, beautiful spacing, rounded cards, subtle shadows and tasteful animations. Make it excellent on phones.



The homepage must introduce the business first, then explain what it offers and how ordering works, then show products and reviews, then lead naturally to ordering.



IMPORTANT: Use REAL PHOTOGRAPHS of chunky wool/yarn crochet scrunchies. Do NOT use cartoon, illustrated, vector or emoji scrunchies. If real photos aren't available yet, create clean image areas that can easily be replaced with real product photos later.



PUBLIC CUSTOMER WEBSITE

Navigation:

Home | Our Story | Shop | How It Works | Reviews | Order | Track Order



HERO:

"Handmade. Unique. Beautifully You."

"Beautiful chunky crochet scrunchies, handmade with soft wool and lots of love."

Buttons: SHOP SCRUNCHIES and OUR STORY.

Include an attractive real-photo area.



OUR STORY:

"Welcome to Selloane's Crochet ♡

Selloane's Crochet is a small handmade business creating beautiful chunky crochet scrunchies from soft, colorful wool. Every piece is made with care, giving you something simple, cute and unique to wear."

Do not invent history, awards or claims.



SHOP:

Small — R20

Medium — R30

Large — R40

Mixed colours — +R10 PER ORDER, charged only once regardless of quantity.



Colours:

Red, White/Cream, Pink, Black, Purple, Blue, Green, Yellow, Orange.

Do not include "Other".



Create real-photo product cards with product name, price, colour selection and ADD TO ORDER.



ORDER BUILDER

Customer selects size, quantity, colour and whether to mix colours. Quantity cannot go below zero. Show a live order summary and total.



Example:

Small x2 = R40

Large x1 = R40

Mixed colours = R10

TOTAL = R90



The backend MUST recalculate prices/totals before saving. Never trust totals sent by the browser.



CUSTOMER DETAILS

Collect:

- Full name

- Phone number

- Delivery location



Current delivery locations:

Eshowe High School

Sunnydale

Gratton



Do NOT collect a street address.

Display: "🚚 Local delivery only"



Phone number is private contact information. Do NOT use WhatsApp as the ordering system. Do not automatically open or send WhatsApp messages.



PLACE ORDER

When submitted:

1. Validate customer information and order.

2. Recalculate total server-side.

3. Check the weekly order limit server-side.

4. Save the order to the database.

5. Generate a unique order number.

6. Generate a secure tracking token/link.

7. Show confirmation.

8. Prevent duplicate submissions.



ORDER NUMBERS

Use format SC-XXXX, e.g. SC-0047. Generate safely in the backend/database and never allow duplicates.



CONFIRMATION:

"🎉 ORDER RECEIVED!"

"Thank you for ordering from Selloane's Crochet. ♡"

"Order #SC-XXXX"

"Status: Received"

Button: TRACK MY ORDER →

Allow copying the order number.



CUSTOMER TRACKING

Create a secure tracking page using a private token. Customers can only access their own order.



Show:

Order number

Order date

Products

Quantities

Colours

Mixed-colour fee

Total

Delivery location

Current status

Expected delivery date if set



Statuses:

Received

Confirmed

Being Prepared

Ready

Out for Delivery

Delivered

Cancelled



Display status as a visual progress timeline. Never expose database IDs or private information in the URL.



REVIEWS

After an order is marked Delivered, allow the customer to leave ONE review:

- 1–5 stars

- written review



New reviews are Pending.

Owner must approve them before they appear publicly.



Public section:

"What our customers say ♡"

Only approved reviews appear.

Never display customer phone numbers or private information.



PRIVATE OWNER PORTAL

Create a protected admin area at:

 /admin



This is part of the same application, NOT a second website.



Public customer side:

/



Private owner side:

/admin



Customers must not see or access the admin dashboard.



If someone visits /admin without authentication, show a secure login page. Use proper authentication and authorization. Never hard-code an admin password in frontend code.



ADMIN DASHBOARD

Show:

- Orders this week: X / 5

- Orders remaining

- New orders

- Being Prepared

- Out for Delivery

- Delivered

- Cancelled

- Revenue



Show a clear NEW ORDER notification when an order arrives. Use realtime updates if supported.



ADMIN ORDERS

Selloane can:

- view all orders

- search by order number, customer name or phone

- filter by status

- open order details



Order details:

Order number

Customer name

Phone

Delivery location

Date/time

Products

Quantities

Colours

Subtotal

Mixed-colour fee

Total

Status

Expected delivery date

PRIVATE ADMIN NOTES



Admin notes must never be visible to customers.



Selloane can change status:

Received

Confirmed

Being Prepared

Ready

Out for Delivery

Delivered

Cancelled



Changes must save to the database and update customer tracking.



Selloane can set an expected delivery date.



Keep all historical orders permanently.



5-ORDER WEEKLY LIMIT

Default maximum = 5 accepted orders per week.



Enforce this SERVER-SIDE using safe database/transaction logic so two customers cannot simultaneously claim the final slot.



At 5/5 show:

"❤️ FULLY BOOKED"

"We've reached our 5 orders for this week."

"Please check back next week."



Do not create a sixth order.



Automatically reset the weekly count at the start of each new week without deleting old orders.



ADMIN SETTINGS

Create /admin/settings.



Selloane can change WITHOUT editing code or rebuilding:

- Business name

- Business phone number

- Small price

- Medium price

- Large price

- Mixed-colour fee

- Weekly order limit

- Delivery locations

- Product availability



Current business phone:

0660627555



IMPORTANT: Store the phone number in the database/settings, NOT hard-coded in frontend code. If Selloane changes her number, she changes it in Settings and the website automatically uses the new number.



Current delivery locations:

Eshowe High School

Sunnydale

Gratton



Allow adding, editing, removing and enabling/disabling locations.



Allow each product size to be Available/Unavailable. Unavailable products cannot be ordered.



DATABASE

Use a real persistent database with appropriate structures for:

- orders

- order_items

- products

- reviews

- delivery_locations

- business_settings

- authenticated admin users



Orders should store:

unique ID

order number

customer name

customer phone

delivery location

items

subtotal

mixed-colour fee

total

status

expected delivery date

secure tracking token

private admin notes

created_at

updated_at



SECURITY & PRIVACY

Customers cannot:

- access admin data

- view other customers' orders

- see private notes

- change prices

- change totals

- change weekly limits

- change settings



Use proper authentication, authorization and database security/RLS where available. Never expose secret credentials in frontend code.



Do not expose customer phone numbers publicly.

Do not expose database IDs unnecessarily.

Do not allow customers to browse database records.



NO DEVICE FILE ACCESS

Do not access, scan, read or browse files on customer devices.



MOBILE

Excellent on Android, iPhone, tablet and desktop. No horizontal scrolling. Large touch-friendly controls. Admin portal must also work well on mobile.



FOOTER

Selloane's Crochet ♡

Handmade. Unique. Beautifully You.

🚚 Local delivery only

© 2026 Selloane's Crochet



PUBLISHING

Prepare the app for public deployment.



Customers must NOT need a Lovable account and must NOT need to visit Lovable. They simply open the public website URL.



The same application must provide:

PUBLIC CUSTOMER URL: /

PRIVATE OWNER URL: /admin



The admin route must require authentication.



Add appropriate noindex metadata so search engines are discouraged from indexing the site while direct-link access still works.



FINAL REQUIREMENT

Build and test the COMPLETE system, including:

Customer browsing

Product selection

Colour selection

Mixed-colour fee

Correct totals

Customer details

Order submission

Database persistence

Unique SC-XXXX order numbers

Secure tracking

Admin login

Admin dashboard

New order notification

Order management

Status changes

Expected delivery dates

Private admin notes

5-order weekly limit

Editable business settings

Editable phone number

Editable prices

Editable delivery locations

Product availability

Reviews and moderation

Customer privacy

Mobile responsiveness

Error handling

Duplicate-order protection



Test the complete journey:

Customer places order → order is saved → customer receives order number/tracking → Selloane logs into /admin → sees order → confirms it → prepares it → sets delivery date → changes status → customer sees update → Selloane marks Delivered → customer reviews → Selloane approves review → review appears publicly.



Do not declare the project complete if important functionality is mocked. If any database, authentication, environment variable or deployment configuration requires my action, clearly explain exactly what I need to do.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://selloanes-crochet-shop.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/29138a10-762a-4aeb-a940-170e57e253d7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
