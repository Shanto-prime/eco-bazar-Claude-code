# Ecommerce Test Case Checklist

High-level feature checklist for manual QA. Each line is one verifiable behaviour, not a step-by-step script. Tick an item only when it passes on the target build.

Suggested location in a React repo: `docs/test-cases.md`.

## Roles

| Code | Role | Scope |
|---|---|---|
| A | Admin | Create, edit, delete, plus settings and reports |
| M | Moderator | Create and edit only. No delete anywhere |
| C | Customer | Browse, cart, order, review, return |

The single rule that gets broken most often: a moderator's delete must fail at the API layer, not only be hidden in the UI. Every module below has a paired UI check and API check for this.

## Permission matrix

| Module | Create | Edit | Delete | View |
|---|---|---|---|---|
| Products | A, M | A, M | A | A, M, C |
| Categories | A, M | A, M | A | A, M, C |
| Orders | C | A, M | A | A, M, own: C |
| Coupons | A, M | A, M | A | A, M |
| Flash offer cards | A, M | A, M | A | A, M, C |
| Linking pages | A, M | A, M | A | A, M, C |
| Reviews | C | own: C, moderate: A, M | A | all |
| Users | A, M | A, M | A | A, M |
| Fraud blocks | A, M | A, M | A | A, M |
| Reports | n/a | n/a | n/a | A, read-only: M |
| Settings | A | A | A | A |

Confirm this matrix against the product owner before running the suite. Anything the team disagrees on here will produce false failures later.

## 1. Authentication and account (AUTH)

- [ ] AUTH-01 Customer registers with email and password
- [ ] AUTH-02 Customer registers with phone number and OTP
- [ ] AUTH-03 OTP expires after the configured window and cannot be reused
- [ ] AUTH-04 Duplicate email or phone registration is rejected with a clear message
- [ ] AUTH-05 Weak password is rejected by both client and server validation
- [ ] AUTH-06 Login succeeds with correct credentials for all three roles
- [ ] AUTH-07 Login fails with the same generic error for wrong password and unknown account
- [ ] AUTH-08 Account locks or rate-limits after repeated failed login attempts
- [ ] AUTH-09 Forgot password sends a single-use reset link that expires
- [ ] AUTH-10 An old reset link stops working after the password is changed
- [ ] AUTH-11 Logout clears the token and a back-button press does not restore the session
- [ ] AUTH-12 Session expiry redirects to login and preserves the intended destination
- [ ] AUTH-13 Refresh token rotation works and a stolen old token is rejected
- [ ] AUTH-14 Remember me keeps the session across a browser restart
- [ ] AUTH-15 Social login, if enabled, links to an existing account with the same email instead of creating a duplicate
- [ ] AUTH-16 Customer edits profile name, phone and email, with re-verification on email change
- [ ] AUTH-17 Customer manages multiple saved addresses and sets a default
- [ ] AUTH-18 Password change invalidates other active sessions
- [ ] AUTH-19 Account deletion or deactivation request behaves per policy and past orders survive
- [ ] AUTH-20 Admin and moderator login pages reject customer accounts

## 2. Roles and permissions (ROLE)

- [ ] ROLE-01 Admin sees delete controls across every module
- [ ] ROLE-02 Moderator does not see any delete control in the UI
- [ ] ROLE-03 A direct DELETE API call as moderator returns 403 and changes nothing in the database
- [ ] ROLE-04 Moderator cannot reach delete by editing a URL or replaying an admin request
- [ ] ROLE-05 Moderator cannot bulk-delete through an import, export or bulk-action endpoint
- [ ] ROLE-06 Moderator cannot soft-delete, archive or set status to "removed" as a delete workaround
- [ ] ROLE-07 Customer hitting `/admin` or any admin API route gets 403 or a redirect, never a partial render
- [ ] ROLE-08 An unauthenticated user hitting an admin route is redirected to login, not shown a blank shell
- [ ] ROLE-09 Role change by an admin takes effect on the next request without needing a manual cache clear
- [ ] ROLE-10 A demoted user loses admin access immediately, including in an already open tab
- [ ] ROLE-11 Admin cannot delete their own account
- [ ] ROLE-12 The last remaining admin cannot be deleted or demoted
- [ ] ROLE-13 Moderator cannot promote themselves or anyone else to admin
- [ ] ROLE-14 Every create, edit and delete writes an audit log entry with actor, timestamp and record ID
- [ ] ROLE-15 Audit log is visible to admin and cannot be edited or cleared from the UI
- [ ] ROLE-16 Menu items and route guards match the permission matrix exactly, with no orphaned links

## 3. User management (USER)

- [ ] USER-01 Admin creates a user and assigns any role
- [ ] USER-02 Moderator creates a user but cannot assign the admin role
- [ ] USER-03 Admin edits a user's role, status and contact details
- [ ] USER-04 Admin deletes a user, and the effect on that user's orders matches policy
- [ ] USER-05 Moderator's delete attempt on a user fails in UI and API
- [ ] USER-06 User list search by name, email, phone and role returns correct results
- [ ] USER-07 Filters for status, registration date and order count work together
- [ ] USER-08 Pagination holds filters when moving between pages
- [ ] USER-09 Customer detail view shows order history, total spend and address book
- [ ] USER-10 Password reset triggered by an admin does not expose the new password in the UI or logs

## 4. Product and catalog management (CAT)

- [ ] CAT-01 Admin creates a product with title, description, price, images and category
- [ ] CAT-02 Moderator creates a product with the same fields
- [ ] CAT-03 Required-field validation fires on empty title, price and category
- [ ] CAT-04 Negative price, zero price and non-numeric price are rejected
- [ ] CAT-05 Discount price higher than the regular price is rejected
- [ ] CAT-06 Product variants save correctly with separate SKU, price and stock per combination
- [ ] CAT-07 Duplicate SKU is rejected
- [ ] CAT-08 Slug is generated from the title, stays unique, and handles Bangla titles
- [ ] CAT-09 Image upload enforces file type and size limits, and rejects an executable renamed to `.jpg`
- [ ] CAT-10 Gallery images reorder and the primary image updates on the listing page
- [ ] CAT-11 Draft product is not visible on the storefront and returns 404 on a direct URL
- [ ] CAT-12 Publishing a draft makes it appear in listing, search and sitemap
- [ ] CAT-13 Moderator edits an existing product and changes are reflected on the storefront
- [ ] CAT-14 Admin deletes a product that has never been ordered
- [ ] CAT-15 Deleting a product that exists in a past order does not break the order record or invoice
- [ ] CAT-16 Deleting a product removes it from other customers' active carts with a visible message
- [ ] CAT-17 Deleting a product removes it from wishlists without a crash
- [ ] CAT-18 Moderator delete on a product fails in UI and API
- [ ] CAT-19 Category create, rename and reparent works, including nested subcategories
- [ ] CAT-20 Deleting a category with products in it either blocks or reassigns, per policy, and never orphans products
- [ ] CAT-21 Bulk CSV import creates products, reports row-level errors and does not partially corrupt on failure
- [ ] CAT-22 Bulk export produces a file that re-imports cleanly
- [ ] CAT-23 Rich text in the description renders as formatted output, not raw HTML, and script tags are stripped

## 5. Storefront browsing (BROWSE)

- [ ] BROWSE-01 Home page loads with banners, categories and featured products
- [ ] BROWSE-02 Category listing shows only products in that category and its children
- [ ] BROWSE-03 Pagination or infinite scroll loads the next set without duplicating items
- [ ] BROWSE-04 Filters for price range, category, size, colour, rating and availability apply together
- [ ] BROWSE-05 Applied filters are reflected in the URL and survive a page refresh
- [ ] BROWSE-06 A shared filtered URL opens with the same filters for another user
- [ ] BROWSE-07 Clearing filters returns the full listing
- [ ] BROWSE-08 Sorting by price low to high, price high to low, newest and popularity is correct
- [ ] BROWSE-09 Empty result state shows a message and a way back, not a blank grid
- [ ] BROWSE-10 Product detail page shows correct price, stock, images, variants and description
- [ ] BROWSE-11 Selecting a variant updates price, stock and image without a full page reload
- [ ] BROWSE-12 Out of stock variant disables add to cart and shows the reason
- [ ] BROWSE-13 Discounted product shows the original price struck through and the correct percentage
- [ ] BROWSE-14 Related and recently viewed products load and exclude the current product
- [ ] BROWSE-15 Breadcrumb reflects the real category path and each level is clickable
- [ ] BROWSE-16 A deleted or unpublished product URL returns a proper 404 page
- [ ] BROWSE-17 Currency, decimal and thousands separators are formatted for the local market

## 6. Search (SRCH)

- [ ] SRCH-01 Keyword search returns relevant products ranked sensibly
- [ ] SRCH-02 Search works for both Bangla and English queries
- [ ] SRCH-03 Autocomplete suggestions appear and are keyboard navigable
- [ ] SRCH-04 Minor typos still return results
- [ ] SRCH-05 Search matches on title, SKU, category and tags per the agreed rules
- [ ] SRCH-06 Zero-result state suggests alternatives instead of a dead end
- [ ] SRCH-07 Filters and sorting apply on top of search results
- [ ] SRCH-08 Special characters and a very long query do not throw an error
- [ ] SRCH-09 Search does not return draft, deleted or out of stock items unless configured to
- [ ] SRCH-10 Rapid typing does not fire an unbounded number of requests
- [ ] SRCH-11 Admin can see top search terms and terms with no results

## 7. Cart (CART)

- [ ] CART-01 Add to cart works from listing, detail page and quick view
- [ ] CART-02 Cart badge count updates immediately after add and remove
- [ ] CART-03 Adding the same variant twice increments quantity instead of creating a second line
- [ ] CART-04 Different variants of the same product appear as separate lines
- [ ] CART-05 Quantity increase beyond available stock is blocked with a message
- [ ] CART-06 Quantity cannot be set to zero, negative or a non-integer
- [ ] CART-07 Maximum quantity per product per order is enforced, if configured
- [ ] CART-08 Remove item and clear cart both work and are reversible or confirmed
- [ ] CART-09 Subtotal, discount, shipping and grand total recalculate on every change
- [ ] CART-10 Guest cart persists across a page refresh
- [ ] CART-11 Guest cart merges into the account cart on login without losing or duplicating items
- [ ] CART-12 Cart persists across devices for a logged-in customer
- [ ] CART-13 Price change made by an admin while an item sits in the cart is reflected before checkout, with notice
- [ ] CART-14 An item that goes out of stock while in the cart is flagged before checkout, not after payment
- [ ] CART-15 Empty cart state shows a message and a link back to shopping
- [ ] CART-16 Two tabs open on the same cart stay in sync or reconcile on checkout

## 8. Wishlist (WISH)

- [ ] WISH-01 Add and remove from wishlist works from listing and detail page
- [ ] WISH-02 Wishlist requires login, or persists for guests, per the agreed rule
- [ ] WISH-03 Wishlist survives logout and login
- [ ] WISH-04 Move to cart transfers the item and respects stock
- [ ] WISH-05 A wishlist item that goes out of stock is marked, not hidden
- [ ] WISH-06 A wishlist item deleted by admin disappears without breaking the page
- [ ] WISH-07 Wishlist count and page pagination are correct with a large number of items

## 9. Coupons and discounts (COUP)

- [ ] COUP-01 Admin creates a percentage coupon, a fixed amount coupon and a free shipping coupon
- [ ] COUP-02 Moderator creates and edits coupons but cannot delete one
- [ ] COUP-03 Duplicate coupon code is rejected
- [ ] COUP-04 Coupon applies correctly at checkout and the discount amount is right to the last unit
- [ ] COUP-05 Minimum order value is enforced and the error names the shortfall
- [ ] COUP-06 Removing an item that drops the cart below the minimum removes or invalidates the coupon
- [ ] COUP-07 Expired coupon is rejected
- [ ] COUP-08 Coupon not yet started is rejected
- [ ] COUP-09 Global usage limit stops further use after the cap is reached
- [ ] COUP-10 Per-customer usage limit is enforced across sessions and devices
- [ ] COUP-11 Product-specific and category-specific restrictions apply correctly
- [ ] COUP-12 First-order-only coupon is rejected for a returning customer
- [ ] COUP-13 Coupon stacking follows the configured rule, whether allowed or blocked
- [ ] COUP-14 Percentage coupon with a maximum discount cap does not exceed the cap
- [ ] COUP-15 A fixed coupon larger than the cart total does not produce a negative total
- [ ] COUP-16 Coupon code is case-insensitive and trims whitespace
- [ ] COUP-17 A coupon deactivated mid-session is rejected at order placement, not silently honoured
- [ ] COUP-18 Coupon applied to an order that is then cancelled or returned restores the usage count per policy
- [ ] COUP-19 Coupon discount appears on the invoice with the code shown

## 10. Offer and flash sale cards (FLASH)

- [ ] FLASH-01 Admin creates a flash offer card with product selection, discount, start time and end time
- [ ] FLASH-02 Moderator creates and edits a flash card but cannot delete one
- [ ] FLASH-03 End time earlier than start time is rejected
- [ ] FLASH-04 The card does not appear on the storefront before the start time
- [ ] FLASH-05 The card appears automatically at the start time without a manual publish
- [ ] FLASH-06 The card disappears automatically at the end time
- [ ] FLASH-07 Countdown timer is accurate and uses the customer's local time correctly
- [ ] FLASH-08 Countdown reaching zero disables the offer price without a page reload
- [ ] FLASH-09 Flash price is what actually gets charged at checkout, not just what is displayed
- [ ] FLASH-10 Price reverts to the regular price for orders placed one second after the end time
- [ ] FLASH-11 An item sitting in the cart when the flash ends is repriced before payment with a clear notice
- [ ] FLASH-12 Stock cap on the flash offer is enforced and shows a sold out state
- [ ] FLASH-13 Concurrent purchases do not oversell the flash quantity
- [ ] FLASH-14 Interaction between flash price and a coupon follows the configured rule
- [ ] FLASH-15 Multiple active flash cards display in the configured order
- [ ] FLASH-16 Card image, title and badge render correctly on mobile and desktop
- [ ] FLASH-17 A flash card pointing at a deleted or unpublished product does not render a broken card
- [ ] FLASH-18 Scheduling a card in a different timezone stores and displays the intended time

## 11. Linking page (LINK)

Interpreting this as a manageable landing or link page that groups products, categories and campaign links under its own URL. Adjust the section if the intended meaning differs.

- [ ] LINK-01 Admin creates a linking page with a title, slug and content blocks
- [ ] LINK-02 Moderator creates and edits a linking page but cannot delete one
- [ ] LINK-03 Slug is validated for allowed characters and rejected if it collides with an existing route
- [ ] LINK-04 Draft page is not publicly reachable and returns 404 on a direct URL
- [ ] LINK-05 Preview shows the unpublished page to an authorised user only
- [ ] LINK-06 Publishing makes the page live at its slug immediately
- [ ] LINK-07 Blocks link correctly to products, categories, collections and external URLs
- [ ] LINK-08 An external link opens in a new tab with safe rel attributes
- [ ] LINK-09 A block pointing at a deleted product is flagged in the admin and hidden on the storefront
- [ ] LINK-10 Reordering blocks changes the public page order
- [ ] LINK-11 Changing a published slug either sets up a redirect or warns about the broken old URL
- [ ] LINK-12 Unpublishing a live page returns 404 rather than a blank page
- [ ] LINK-13 Open Graph title, description and image render in a social share preview
- [ ] LINK-14 Page is responsive and blocks stack correctly on a narrow screen
- [ ] LINK-15 Click tracking records visits and per-link clicks, and the numbers appear in reports
- [ ] LINK-16 Admin deletes a linking page and the URL stops resolving

## 12. Checkout (CHK)

- [ ] CHK-01 Guest checkout works, or login is enforced, per the agreed rule
- [ ] CHK-02 Customer selects a saved address or adds a new one during checkout
- [ ] CHK-03 Address validation catches an empty required field and a malformed phone number
- [ ] CHK-04 Shipping options and costs update when the delivery area changes
- [ ] CHK-05 Order summary matches the cart exactly, line by line
- [ ] CHK-06 Cash on delivery order is placed successfully
- [ ] CHK-07 Online payment success returns to a confirmation page and marks the order paid
- [ ] CHK-08 Payment failure returns the customer to checkout with the cart intact and no order created
- [ ] CHK-09 Payment cancelled by the customer leaves no stuck pending order
- [ ] CHK-10 Browser closed mid-payment resolves correctly through the gateway callback
- [ ] CHK-11 Double-clicking place order creates exactly one order
- [ ] CHK-12 Refreshing the confirmation page does not create a second order
- [ ] CHK-13 Order number is unique and non-sequential enough not to leak volume
- [ ] CHK-14 Stock decrements only on successful order placement
- [ ] CHK-15 Two customers buying the last unit at the same time results in one success and one clear failure
- [ ] CHK-16 Order confirmation email and SMS are sent with correct totals
- [ ] CHK-17 Checkout is blocked for a blocked or fraud-flagged account
- [ ] CHK-18 Checkout is blocked when the delivery address is outside the served area
- [ ] CHK-19 Tampering with the price or total in the request is rejected server-side
- [ ] CHK-20 Totals recompute on the server and never trust the client-supplied amount

## 13. Orders (ORD)

- [ ] ORD-01 Customer sees their own orders and cannot open another customer's order by ID
- [ ] ORD-02 Order detail shows items, totals, address, payment method and status history
- [ ] ORD-03 Customer cancels an order within the allowed window and status updates
- [ ] ORD-04 Cancel after the window is blocked with an explanation
- [ ] ORD-05 Cancelled order restores stock
- [ ] ORD-06 Admin updates order status through the full lifecycle
- [ ] ORD-07 Moderator updates order status but cannot delete an order
- [ ] ORD-08 Invalid status transitions are blocked, for example delivered back to pending
- [ ] ORD-09 Each status change notifies the customer through the configured channel
- [ ] ORD-10 Admin deletes or archives an order and reports adjust accordingly
- [ ] ORD-11 Order search by order number, customer name, phone and status works
- [ ] ORD-12 Order list filters by date range, status and payment method
- [ ] ORD-13 Invoice generates with correct line items, discounts, shipping and tax
- [ ] ORD-14 Invoice downloads as PDF and prints without layout breakage
- [ ] ORD-15 Order placed with a since-deleted product still displays the historical item details
- [ ] ORD-16 Partial fulfilment, if supported, splits correctly and totals still reconcile

## 14. Inventory (INV)

- [ ] INV-01 Stock quantity is tracked per variant, not only per product
- [ ] INV-02 Manual stock adjustment by admin records a reason and an audit entry
- [ ] INV-03 Moderator adjusts stock but cannot delete a stock record
- [ ] INV-04 Stock reaching zero hides add to cart and shows out of stock
- [ ] INV-05 Low stock threshold triggers an alert to admin
- [ ] INV-06 Concurrent orders cannot push stock below zero
- [ ] INV-07 Cancelled and returned orders restock correctly
- [ ] INV-08 Reserved stock during an incomplete checkout is released after the timeout
- [ ] INV-09 Backorder or preorder behaviour matches configuration
- [ ] INV-10 Bulk stock update via file applies correctly and reports failed rows
- [ ] INV-11 Stock movement history shows every increase and decrease with its source

## 15. Shipping and delivery (SHIP)

- [ ] SHIP-01 Admin defines shipping zones and rates
- [ ] SHIP-02 Correct rate is applied based on the delivery address
- [ ] SHIP-03 Free shipping threshold applies at exactly the threshold amount
- [ ] SHIP-04 Weight or size based rates calculate correctly for a mixed cart
- [ ] SHIP-05 Delivery estimate is shown at checkout and on the order page
- [ ] SHIP-06 An unsupported delivery area blocks checkout with a clear message
- [ ] SHIP-07 Admin assigns a courier and enters a tracking number
- [ ] SHIP-08 Moderator enters tracking details but cannot delete a shipment record
- [ ] SHIP-09 Customer sees the tracking number and link once it is set
- [ ] SHIP-10 Shipping cost on the invoice matches what was charged
- [ ] SHIP-11 Changing the delivery address after order placement follows policy and recalculates cost if allowed

## 16. Returns and refunds (RET)

- [ ] RET-01 Customer raises a return request within the return window
- [ ] RET-02 Return request after the window is blocked
- [ ] RET-03 Return reason is required and image upload works
- [ ] RET-04 Customer sees the return status and history
- [ ] RET-05 Admin approves and rejects return requests
- [ ] RET-06 Moderator reviews and updates a return but cannot delete the request
- [ ] RET-07 Partial return of one item from a multi-item order calculates the right refund
- [ ] RET-08 Refund amount accounts for the coupon discount applied at purchase
- [ ] RET-09 Shipping cost refund follows policy
- [ ] RET-10 Refund to the original payment method is recorded with a reference
- [ ] RET-11 COD refund flow captures bank or wallet details securely
- [ ] RET-12 Store credit refund creates a usable balance
- [ ] RET-13 Approved return restocks the item only when marked received
- [ ] RET-14 Customer is notified at each return status change
- [ ] RET-15 A returned order is excluded from revenue in reports and counted under refunds

## 17. Reviews and ratings (REV)

- [ ] REV-01 Only a customer who purchased and received the product can review it, if that rule applies
- [ ] REV-02 Star rating is required and text is optional, or per configuration
- [ ] REV-03 Image upload on a review enforces type and size limits
- [ ] REV-04 A customer cannot post two reviews on the same product
- [ ] REV-05 Customer edits and deletes their own review
- [ ] REV-06 A new review enters the moderation queue and is not public before approval
- [ ] REV-07 Admin approves, rejects and deletes a review
- [ ] REV-08 Moderator approves and hides a review but cannot delete it
- [ ] REV-09 Average rating and review count recalculate after approval, edit and removal
- [ ] REV-10 Script or HTML in review text is escaped and does not execute
- [ ] REV-11 Reviews paginate and sort by newest, highest and lowest rating
- [ ] REV-12 Helpful votes register once per customer per review
- [ ] REV-13 Product with no reviews shows an empty state, not a zero-star rating
- [ ] REV-14 Reviews from a blocked or fraud-flagged account are handled per policy

## 18. Fraud detection and user block (FRAUD)

- [ ] FRAUD-01 Admin blocks a user manually with a required reason
- [ ] FRAUD-02 Moderator flags or suspends a user but cannot delete the user or the fraud record
- [ ] FRAUD-03 Blocked user cannot log in and receives a non-specific message
- [ ] FRAUD-04 An already logged-in user is signed out on block, in every open session
- [ ] FRAUD-05 Blocked user cannot place an order even through a direct API call
- [ ] FRAUD-06 Blocked user's pending orders are handled per policy and the outcome is visible to admin
- [ ] FRAUD-07 Blocking by phone number, email and delivery address each work independently
- [ ] FRAUD-08 A blocked user re-registering with the same phone or email is caught
- [ ] FRAUD-09 Device or IP level block works and does not lock out an entire shared network by accident
- [ ] FRAUD-10 Auto-flag rule fires on repeated COD refusals above the configured count
- [ ] FRAUD-11 Auto-flag rule fires on repeated failed payment attempts
- [ ] FRAUD-12 Auto-flag rule fires on abnormal order velocity from one account
- [ ] FRAUD-13 Auto-flag rule fires on many accounts sharing one phone, device or address
- [ ] FRAUD-14 A flagged order is held for review rather than auto-confirmed
- [ ] FRAUD-15 Fraud score or flag reason is visible to admin with the triggering evidence
- [ ] FRAUD-16 Error messages shown to a blocked user do not reveal which rule triggered
- [ ] FRAUD-17 Unblock restores full access and the previous block stays in the audit trail
- [ ] FRAUD-18 A false positive can be cleared without deleting the user's order history
- [ ] FRAUD-19 Block and unblock actions are logged with actor, reason and timestamp
- [ ] FRAUD-20 Fraud list search and filter by reason, date and status works
- [ ] FRAUD-21 A legitimate high-value customer is not auto-blocked by the velocity rule alone

## 19. Reports and analytics (RPT)

- [ ] RPT-01 Sales report totals match the sum of orders for the same date range
- [ ] RPT-02 Date range filter is inclusive at both ends and uses the store timezone
- [ ] RPT-03 Revenue excludes cancelled and refunded orders
- [ ] RPT-04 Top selling products report matches order line quantities
- [ ] RPT-05 Coupon usage report shows redemptions and total discount given
- [ ] RPT-06 Inventory report reflects current stock and flags low stock items
- [ ] RPT-07 Customer report shows new versus returning customers correctly
- [ ] RPT-08 Fraud and block report shows counts by reason
- [ ] RPT-09 Linking page and flash card performance appear with clicks and conversions
- [ ] RPT-10 Export to CSV and PDF produces the same numbers shown on screen
- [ ] RPT-11 Moderator has read-only access, or no access, per the agreed matrix
- [ ] RPT-12 Empty date range shows a no-data state instead of zeros that look like real values
- [ ] RPT-13 A large date range does not time out the page

## 20. Notifications (NOTIF)

- [ ] NOTIF-01 Registration, order placed, shipped, delivered, cancelled and refunded each trigger the right template
- [ ] NOTIF-02 Templates render with correct customer name, order number and amounts
- [ ] NOTIF-03 Bangla content in email and SMS renders without broken characters
- [ ] NOTIF-04 Failed sends are retried and logged
- [ ] NOTIF-05 A customer receives no duplicate notification for a single event
- [ ] NOTIF-06 Unsubscribe works for marketing messages and does not stop transactional ones
- [ ] NOTIF-07 Admin receives alerts for new orders, low stock and fraud flags per settings

## 21. Frontend and non-functional (UX)

- [ ] UX-01 Layout holds at mobile, tablet and desktop breakpoints on every main page
- [ ] UX-02 Loading states appear during data fetch instead of a blank screen
- [ ] UX-03 A failed request shows a retry option rather than an empty component
- [ ] UX-04 An error in one component does not blank the whole page
- [ ] UX-05 Optimistic UI updates roll back when the request fails
- [ ] UX-06 Browser back and forward move through routes correctly and restore scroll position
- [ ] UX-07 A page refresh mid-flow does not lose cart or checkout progress
- [ ] UX-08 Form validation messages appear inline next to the field
- [ ] UX-09 Submit buttons disable while a request is in flight
- [ ] UX-10 The app is usable on a slow connection and images load progressively
- [ ] UX-11 Keyboard navigation reaches every interactive element with a visible focus ring
- [ ] UX-12 Images have alt text and colour contrast meets the accessibility target
- [ ] UX-13 Language switching between Bangla and English updates all visible strings
- [ ] UX-14 No console errors or warnings on the main flows
- [ ] UX-15 Page titles, meta descriptions and canonical URLs are set per route
- [ ] UX-16 A 404 route renders the styled not-found page, not a framework error

## 22. Security (SEC)

- [ ] SEC-01 Every admin and moderator API route enforces authorisation server-side
- [ ] SEC-02 A customer token cannot read or write another customer's data by changing an ID
- [ ] SEC-03 Script injected in product description, review text and address fields does not execute
- [ ] SEC-04 File upload rejects executables and files above the size limit
- [ ] SEC-05 Login, OTP request, password reset and coupon apply are rate-limited
- [ ] SEC-06 Passwords, tokens and payment details never appear in logs or API responses
- [ ] SEC-07 Sensitive routes are not cached by the browser or a CDN
- [ ] SEC-08 CSRF protection is active on state-changing requests
- [ ] SEC-09 Error responses do not leak stack traces or database details
- [ ] SEC-10 Session tokens are stored and transmitted securely and expire as configured

## Coverage notes

Items to confirm with the product owner before the first run: whether guest checkout is allowed, whether reviews require a verified purchase, whether moderators get read-only report access, and what happens to a blocked user's pending orders. Each of these changes several checks above.
