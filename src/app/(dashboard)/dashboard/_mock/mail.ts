import { daysAgo } from "./seeds";

export type MailboxAddress = "developers@lankanewhomes.com" | "support@lankanewhomes.com" | "no-reply@lankanewhomes.com";
export type FolderId = "inbox" | "starred" | "sent" | "drafts" | "spam" | "trash" | "custom";

export type Person = { name: string; email: string };
export type Tracking = { opened: number; clicks: number; lastOpenedAt?: string };

export type MailMessage = {
  id: string;
  mailbox: MailboxAddress;
  folder: Exclude<FolderId, "starred">;
  from: Person;
  to: string[];
  cc: string[];
  subject: string;
  date: string;
  body: string;
  unread: boolean;
  starred: boolean;
  hasAttachment: boolean;
  tracking?: Tracking;
  threadId?: string;
};

export type Mailbox = { address: MailboxAddress; label: string; dot: string; customFolder: string };

export const MAILBOXES: Mailbox[] = [
  { address: "developers@lankanewhomes.com", label: "Developers", dot: "bg-accent", customFolder: "Prime Lands" },
  { address: "support@lankanewhomes.com", label: "Support", dot: "bg-ok", customFolder: "Viewings" },
  { address: "no-reply@lankanewhomes.com", label: "No-reply", dot: "bg-warn", customFolder: "Automatic" },
];

const DEV: MailboxAddress = "developers@lankanewhomes.com";
const SUP: MailboxAddress = "support@lankanewhomes.com";
const NOR: MailboxAddress = "no-reply@lankanewhomes.com";
const US = (address: MailboxAddress, name: string): Person => ({ name, email: address });

type Seed = Partial<MailMessage> & Pick<MailMessage, "id" | "mailbox" | "folder" | "from" | "subject" | "body"> & { ago: number };
const m = ({ ago, ...s }: Seed): MailMessage => ({
  to: [s.mailbox], cc: [], date: daysAgo(ago), unread: false, starred: false, hasAttachment: false, ...s,
});

const sig = "\n\nBest regards,\nLankaNewHomes Partnerships\nlankanewhomes.com";

export const MAIL_MESSAGES: MailMessage[] = [
  // developers@
  m({ id: "d1", mailbox: DEV, folder: "inbox", ago: 0.2, from: { name: "Dilini Perera (Prime Lands)", email: "info@primelands.lk" }, subject: "Re: Your Prime Lands page on LankaNewHomes", unread: true, threadId: "t-pl", body: "Dear team,\n\nThank you for the note. We would like to register our Colombo apartments and the Negombo land blocks. Please share the onboarding steps and the current price list format you need.\n\nI have attached our latest brochure for Prime Residencies.\n\nRegards,\nDilini Perera\nSales Coordinator, Prime Lands", hasAttachment: true }),
  m({ id: "d2", mailbox: DEV, folder: "inbox", ago: 1.1, from: { name: "Rush Lanka Sales", email: "sales@rushlankagroup.com" }, subject: "Rush Residencies Colombo 6 - updated unit availability", unread: true, starred: true, body: "Hello,\n\nPlease note that units 4B, 7A and 9C at Rush Residencies Colombo 6 are now reserved. Kindly update the listing so buyers are not misled.\n\nWe will send the revised floor plans on Friday.\n\nThank you,\nRush Lanka Group" }),
  m({ id: "d3", mailbox: DEV, folder: "inbox", ago: 2.4, from: { name: "Maison Ceylon", email: "contact@maisonceylon.com" }, subject: "Re: Project Pages", threadId: "t-pp", body: "Hi,\n\nThanks for the walkthrough call. We are happy with the draft page. Could you change the headline photo to the pool terrace render and add our WhatsApp number 077 123 4567?\n\nOnce done we will approve the listing.\n\nKind regards,\nMaison Ceylon marketing" }),
  m({ id: "d4", mailbox: DEV, folder: "inbox", ago: 4.3, from: { name: "Fairway Properties", email: "info@fairwayproperties.lk" }, subject: "Fairway Latitude - brochure and payment plan", starred: true, hasAttachment: true, body: "Dear LankaNewHomes,\n\nAs requested, the Fairway Latitude brochure and the 70/30 payment plan are attached. The completion date remains Q4 2027.\n\nPlease confirm receipt.\n\nBest,\nFairway Properties" }),
  m({ id: "d5", mailbox: DEV, folder: "inbox", ago: 7.2, from: { name: "Nuwan Jayasinghe", email: "nuwan@odiliyahomes.lk" }, subject: "Odiliya Homes - can you add our Kadawatha lands?", body: "Good morning,\n\nWe have 8 land projects ready. Is there a bulk upload option, or do we send details by email?\n\nThanks,\nNuwan" }),
  m({ id: "d6", mailbox: DEV, folder: "custom", ago: 9.5, from: { name: "Prime Lands Accounts", email: "accounts@primelands.lk" }, subject: "Invoice query - Featured placement", hasAttachment: true, body: "Dear team,\n\nPlease resend the invoice for the Featured placement in the name of Prime Lands (Pvt) Ltd, including the VAT number.\n\nThank you." }),
  m({ id: "d7", mailbox: DEV, folder: "custom", ago: 12.8, from: US(DEV, "LankaNewHomes Partnerships"), to: ["info@primelands.lk"], subject: "Your Prime Lands page on LankaNewHomes: register and get leads", tracking: { opened: 4, clicks: 2, lastOpenedAt: daysAgo(0.4) }, threadId: "t-pl", body: "Dear Prime Lands team,\n\nYour projects already appear on LankaNewHomes. Register your free developer account to edit your pages, add floor plans and receive buyer enquiries directly by email and WhatsApp." + sig }),
  m({ id: "d8", mailbox: DEV, folder: "sent", ago: 1.6, from: US(DEV, "LankaNewHomes Partnerships"), to: ["sales@rushlankagroup.com"], subject: "A buyer clicked WhatsApp on Barrington Towers", tracking: { opened: 3, clicks: 1, lastOpenedAt: daysAgo(1.2) }, body: "Hello,\n\nA buyer just tapped the WhatsApp button on your Barrington Towers page. You will find the details in your developer dashboard under Leads.\n\nWe recommend replying within an hour; fast responses convert far better." + sig }),
  m({ id: "d9", mailbox: DEV, folder: "sent", ago: 3.1, from: US(DEV, "LankaNewHomes Partnerships"), to: ["contact@maisonceylon.com"], cc: ["rupan@lankanewhomes.com"], subject: "Re: Project Pages", tracking: { opened: 1, clicks: 0, lastOpenedAt: daysAgo(2.9) }, threadId: "t-pp", body: "Hi,\n\nThe draft pages are ready for review. Please check the floor plans and pricing section, then reply with any changes." + sig }),
  m({ id: "d10", mailbox: DEV, folder: "sent", ago: 5.4, from: US(DEV, "LankaNewHomes Partnerships"), to: ["info@fairwayproperties.lk"], subject: "Request: brochure and payment plan for Fairway Latitude", tracking: { opened: 0, clicks: 0 }, body: "Dear Fairway team,\n\nCould you share the latest brochure, payment plan and expected completion date for Fairway Latitude? We want to keep the listing accurate." + sig }),
  m({ id: "d11", mailbox: DEV, folder: "sent", ago: 10.2, from: US(DEV, "LankaNewHomes Partnerships"), to: ["nuwan@odiliyahomes.lk"], subject: "Welcome to LankaNewHomes, Odiliya Homes", tracking: { opened: 2, clicks: 3, lastOpenedAt: daysAgo(8.6) }, body: "Dear Nuwan,\n\nWelcome aboard. Your claim invitation link is below; it lets you edit your developer profile and all listings." + sig }),
  m({ id: "d12", mailbox: DEV, folder: "drafts", ago: 0.5, from: US(DEV, "LankaNewHomes Partnerships"), to: ["info@araliyalands.lk"], subject: "Araliya Lands: claim your developer profile", body: "Dear Araliya Lands team,\n\n" }),
  m({ id: "d13", mailbox: DEV, folder: "spam", ago: 6.1, from: { name: "SEO Rankers", email: "offers@seo-rankers-fast.biz" }, subject: "Get #1 on Google in 24 hours!!!", unread: true, body: "Hello owner,\n\nWe can put your website on page 1 of Google guaranteed. Reply now for a special price." }),
  m({ id: "d14", mailbox: DEV, folder: "trash", ago: 14.0, from: { name: "Colombo Realty Expo", email: "events@colomborealty.lk" }, subject: "Exhibit at the Colombo Realty Expo 2026", body: "Dear partner,\n\nStands are now available for the November expo. Early bird rates end this week." }),

  // support@
  m({ id: "s1", mailbox: SUP, folder: "inbox", ago: 0.3, from: { name: "Kasun Fernando", email: "kasun.fernando@gmail.com" }, subject: "Viewing request - The Golf, Colombo 08", unread: true, body: "Hi,\n\nI am interested in the 3-bedroom units at The Golf in Colombo 08. Could you arrange a viewing this Saturday afternoon? I am flying in from Dubai next week.\n\nThanks,\nKasun" }),
  m({ id: "s2", mailbox: SUP, folder: "inbox", ago: 1.8, from: { name: "Ayesha Rahman", email: "ayesha.r@outlook.com" }, subject: "How do I list my project?", unread: true, body: "Hello,\n\nI am a small developer in Kandy with one townhouse project. How do I list it on your site and is it free?\n\nAyesha" }),
  m({ id: "s3", mailbox: SUP, folder: "inbox", ago: 3.0, from: { name: "Thilina Wickramasinghe", email: "thilina.w@yahoo.com" }, subject: "Can't reset my password", body: "I click 'forgot password' but the email never arrives. Please help. My account is thilina.w@yahoo.com." }),
  m({ id: "s4", mailbox: SUP, folder: "inbox", ago: 5.7, from: { name: "Priya Nadarajah", email: "priya.nadarajah@gmail.com" }, subject: "Is Rush Residencies still available?", starred: true, body: "Hello,\n\nI saw Rush Residencies Colombo 6 on your site. Are any 2-bedroom units left, and can foreigners buy there?\n\nPriya" }),
  m({ id: "s5", mailbox: SUP, folder: "inbox", ago: 8.4, from: { name: "Mohamed Irfan", email: "irfan.m@gmail.com" }, subject: "Photos not loading on mobile", hasAttachment: true, body: "The listing photos do not load on my phone (Samsung, Chrome). Screenshot attached." }),
  m({ id: "s6", mailbox: SUP, folder: "custom", ago: 2.2, from: { name: "Sanduni Silva", email: "sanduni.silva@gmail.com" }, subject: "Viewing request - Latitude Fairway, Colombo 03", unread: true, body: "Hi, I would like to visit the show apartment on Wednesday at 4pm. Is that possible?" }),
  m({ id: "s7", mailbox: SUP, folder: "custom", ago: 11.5, from: { name: "Roshan De Mel", email: "roshan.demel@gmail.com" }, subject: "Viewing request - Maison Ceylon", body: "Please arrange a viewing for two on Sunday morning. We prefer Sinhala or English." }),
  m({ id: "s8", mailbox: SUP, folder: "sent", ago: 1.2, from: US(SUP, "LankaNewHomes Support"), to: ["ayesha.r@outlook.com"], subject: "Re: How do I list my project?", tracking: { opened: 1, clicks: 1, lastOpenedAt: daysAgo(1.0) }, body: "Hi Ayesha,\n\nListing is free. Create a developer account at lankanewhomes.com/for-developers and we will help you publish your first page.\n\nKind regards,\nLankaNewHomes Support" }),
  m({ id: "s9", mailbox: SUP, folder: "sent", ago: 2.9, from: US(SUP, "LankaNewHomes Support"), to: ["thilina.w@yahoo.com"], subject: "Re: Can't reset my password", tracking: { opened: 0, clicks: 0 }, body: "Hi Thilina,\n\nWe have sent a fresh reset link. Please check your spam folder too.\n\nSupport" }),
  m({ id: "s10", mailbox: SUP, folder: "sent", ago: 9.0, from: US(SUP, "LankaNewHomes Support"), to: ["roshan.demel@gmail.com"], subject: "Re: Viewing request - Maison Ceylon", tracking: { opened: 2, clicks: 0, lastOpenedAt: daysAgo(8.7) }, body: "Hi Roshan,\n\nWe have forwarded your request to Maison Ceylon. Their team will confirm a slot by phone.\n\nSupport" }),
  m({ id: "s11", mailbox: SUP, folder: "drafts", ago: 0.1, from: US(SUP, "LankaNewHomes Support"), to: ["kasun.fernando@gmail.com"], subject: "Re: Viewing request - The Golf, Colombo 08", body: "Hi Kasun,\n\n" }),
  m({ id: "s12", mailbox: SUP, folder: "spam", ago: 4.8, from: { name: "Lottery Board", email: "winner@claim-prize-now.xyz" }, subject: "You have won Rs. 5,000,000", unread: true, body: "Click here to claim your prize." }),

  // no-reply@
  m({ id: "n1", mailbox: NOR, folder: "inbox", ago: 0.9, from: { name: "Mail Delivery Subsystem", email: "mailer-daemon@googlemail.com" }, subject: "Delivery Status Notification (Failure)", unread: true, body: "Address not found.\n\nYour message wasn't delivered to sales@oldbuilder.lk because the domain oldbuilder.lk couldn't be found." }),
  m({ id: "n2", mailbox: NOR, folder: "inbox", ago: 6.6, from: { name: "Mail Delivery Subsystem", email: "mailer-daemon@zoho.com" }, subject: "Undeliverable: Your account confirmation", body: "The recipient mailbox buyer@invalid-mail.test is full and cannot accept new messages." }),
  m({ id: "n3", mailbox: NOR, folder: "sent", ago: 0.4, from: US(NOR, "LankaNewHomes"), to: ["sales@rushlankagroup.com"], subject: "New enquiry about The Golf - Colombo 08", tracking: { opened: 2, clicks: 1, lastOpenedAt: daysAgo(0.2) }, body: "You have a new enquiry.\n\nName: Kasun Fernando\nPhone: +971 50 123 4567\nMessage: I would like a viewing this Saturday.\n\nReply directly to the buyer, or open your dashboard to see the full lead." }),
  m({ id: "n4", mailbox: NOR, folder: "sent", ago: 1.5, from: US(NOR, "LankaNewHomes"), to: ["priya.nadarajah@gmail.com"], subject: "Confirm your LankaNewHomes account", tracking: { opened: 1, clicks: 1, lastOpenedAt: daysAgo(1.4) }, body: "Welcome to LankaNewHomes.\n\nConfirm your email address to start saving listings and getting alerts." }),
  m({ id: "n5", mailbox: NOR, folder: "sent", ago: 3.5, from: US(NOR, "LankaNewHomes"), to: ["info@primelands.lk"], subject: "Your weekly LankaNewHomes digest", tracking: { opened: 0, clicks: 0 }, body: "This week: 412 views, 18 enquiries and 6 WhatsApp taps across your listings." }),
  m({ id: "n6", mailbox: NOR, folder: "sent", ago: 10.5, from: US(NOR, "LankaNewHomes"), to: ["info@fairwayproperties.lk"], subject: "New enquiry about Latitude Fairway", tracking: { opened: 3, clicks: 2, lastOpenedAt: daysAgo(10.1) }, body: "You have a new enquiry from Sanduni Silva. Open your dashboard to reply." }),
  m({ id: "n7", mailbox: NOR, folder: "sent", ago: 17.0, from: US(NOR, "LankaNewHomes"), to: ["ayesha.r@outlook.com"], subject: "Reset your password", tracking: { opened: 1, clicks: 1, lastOpenedAt: daysAgo(16.9) }, body: "Use the link below to choose a new password. The link expires in one hour." }),
  m({ id: "n8", mailbox: NOR, folder: "custom", ago: 2.0, from: US(NOR, "LankaNewHomes"), to: ["contact@maisonceylon.com"], subject: "Your listing was approved", tracking: { opened: 1, clicks: 0, lastOpenedAt: daysAgo(1.9) }, body: "Maison Ceylon is now live on LankaNewHomes." }),
];

export const cloneMail = (): MailMessage[] => structuredClone(MAIL_MESSAGES);
