-- Featured add-ons: allow the new "website-link" type (owner, 2026-11-26: a developer who wants their own website on the Featured
-- search cards pays extra, booked as an add-on). Only the list of allowed types on featured_addons.type changes: the old list plus one
-- value. No column, row or other constraint is touched. Safe to run twice.
alter table featured_addons drop constraint if exists featured_addons_type_check;
alter table featured_addons add constraint featured_addons_type_check
  check (type in ('hero-slide', 'announcement-bar', 'developer-of-month', 'new-launch', 'city-tile', 'sponsored-article', 'social-post', 'reel', 'newsletter', 'website-link'));
