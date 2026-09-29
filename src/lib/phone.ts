// International phone helpers for the enquiry / contact forms. Buyers come
// from all over the world (Sri Lankan diaspora especially), so the number is
// captured as a country + national number and always stored with its
// international prefix ("+44 7911 123456") — that is also the form the
// developer's one-tap WhatsApp / Call reply links (whatsapp.ts,
// lead-reply-links.ts) need to work for a buyer abroad. No dependency on a
// phone library: a compact dial-code table plus light normalisation is enough
// for a lead form, and the developer still sees exactly what was typed.

// ISO 3166-1 alpha-2 → country calling code. Shared codes (+1, +7, +44, …)
// simply repeat; `PRIMARY_ISO_FOR_DIAL` decides which country a pasted
// "+1 …" number is assigned to.
const DIAL_CODES: Record<string, string> = {
  AF: "93", AL: "355", DZ: "213", AS: "1684", AD: "376", AO: "244", AI: "1264", AG: "1268", AR: "54", AM: "374",
  AW: "297", AU: "61", AT: "43", AZ: "994", BS: "1242", BH: "973", BD: "880", BB: "1246", BY: "375", BE: "32",
  BZ: "501", BJ: "229", BM: "1441", BT: "975", BO: "591", BA: "387", BW: "267", BR: "55", IO: "246", VG: "1284",
  BN: "673", BG: "359", BF: "226", BI: "257", KH: "855", CM: "237", CA: "1", CV: "238", KY: "1345", CF: "236",
  TD: "235", CL: "56", CN: "86", CO: "57", KM: "269", CG: "242", CD: "243", CK: "682", CR: "506", CI: "225",
  HR: "385", CU: "53", CW: "599", CY: "357", CZ: "420", DK: "45", DJ: "253", DM: "1767", DO: "1809", EC: "593",
  EG: "20", SV: "503", GQ: "240", ER: "291", EE: "372", SZ: "268", ET: "251", FK: "500", FO: "298", FJ: "679",
  FI: "358", FR: "33", GF: "594", PF: "689", GA: "241", GM: "220", GE: "995", DE: "49", GH: "233", GI: "350",
  GR: "30", GL: "299", GD: "1473", GP: "590", GU: "1671", GT: "502", GN: "224", GW: "245", GY: "592", HT: "509",
  HN: "504", HK: "852", HU: "36", IS: "354", IN: "91", ID: "62", IR: "98", IQ: "964", IE: "353", IL: "972",
  IT: "39", JM: "1876", JP: "81", JO: "962", KZ: "7", KE: "254", KI: "686", XK: "383", KW: "965", KG: "996",
  LA: "856", LV: "371", LB: "961", LS: "266", LR: "231", LY: "218", LI: "423", LT: "370", LU: "352", MO: "853",
  MG: "261", MW: "265", MY: "60", MV: "960", ML: "223", MT: "356", MH: "692", MQ: "596", MR: "222", MU: "230",
  YT: "262", MX: "52", FM: "691", MD: "373", MC: "377", MN: "976", ME: "382", MS: "1664", MA: "212", MZ: "258",
  MM: "95", NA: "264", NR: "674", NP: "977", NL: "31", NC: "687", NZ: "64", NI: "505", NE: "227", NG: "234",
  NU: "683", NF: "672", KP: "850", MK: "389", MP: "1670", NO: "47", OM: "968", PK: "92", PW: "680", PS: "970",
  PA: "507", PG: "675", PY: "595", PE: "51", PH: "63", PL: "48", PT: "351", PR: "1787", QA: "974", RE: "262",
  RO: "40", RU: "7", RW: "250", SH: "290", KN: "1869", LC: "1758", PM: "508", VC: "1784", WS: "685", SM: "378",
  ST: "239", SA: "966", SN: "221", RS: "381", SC: "248", SL: "232", SG: "65", SX: "1721", SK: "421", SI: "386",
  SB: "677", SO: "252", ZA: "27", KR: "82", SS: "211", ES: "34", LK: "94", SD: "249", SR: "597", SE: "46",
  CH: "41", SY: "963", TW: "886", TJ: "992", TZ: "255", TH: "66", TL: "670", TG: "228", TK: "690", TO: "676",
  TT: "1868", TN: "216", TR: "90", TM: "993", TC: "1649", TV: "688", VI: "1340", UG: "256", UA: "380", AE: "971",
  GB: "44", US: "1", UY: "598", UZ: "998", VU: "678", VE: "58", VN: "84", WF: "681", YE: "967", ZM: "260", ZW: "263",
};

/** The country a pasted "+<code> …" number is assigned to when several share the code. */
const PRIMARY_ISO_FOR_DIAL: Record<string, string> = {
  "1": "US", "7": "RU", "39": "IT", "44": "GB", "47": "NO", "61": "AU", "212": "MA", "262": "RE", "290": "SH", "358": "FI", "590": "GP", "599": "CW",
};

// Static, not `Intl.DisplayNames(...).of(iso)` at runtime — that call can
// return different strings (and therefore sort the "others" list into a
// different order) between the Node/ICU build the server runs and a
// visitor's own browser, which showed up as a real hydration mismatch
// (2026-09-29: the phone-country <select>'s "British Indian Ocean
// Territory"/"British Virgin Islands" pair rendered in swapped order,
// server vs client). Generated once from Intl.DisplayNames and frozen
// here so every environment renders the exact same list.
const REGION_NAMES: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AS: "American Samoa", AD: "Andorra", AO: "Angola", AI: "Anguilla",
  AG: "Antigua & Barbuda", AR: "Argentina", AM: "Armenia", AW: "Aruba", AU: "Australia", AT: "Austria",
  AZ: "Azerbaijan", BS: "Bahamas", BH: "Bahrain", BD: "Bangladesh", BB: "Barbados", BY: "Belarus", BE: "Belgium",
  BZ: "Belize", BJ: "Benin", BM: "Bermuda", BT: "Bhutan", BO: "Bolivia", BA: "Bosnia & Herzegovina", BW: "Botswana",
  BR: "Brazil", IO: "British Indian Ocean Territory", VG: "British Virgin Islands", BN: "Brunei", BG: "Bulgaria",
  BF: "Burkina Faso", BI: "Burundi", KH: "Cambodia", CM: "Cameroon", CA: "Canada", CV: "Cape Verde",
  KY: "Cayman Islands", CF: "Central African Republic", TD: "Chad", CL: "Chile", CN: "China", CO: "Colombia",
  KM: "Comoros", CG: "Congo - Brazzaville", CD: "Congo - Kinshasa", CK: "Cook Islands", CR: "Costa Rica",
  CI: "Côte d’Ivoire", HR: "Croatia", CU: "Cuba", CW: "Curaçao", CY: "Cyprus", CZ: "Czechia", DK: "Denmark",
  DJ: "Djibouti", DM: "Dominica", DO: "Dominican Republic", EC: "Ecuador", EG: "Egypt", SV: "El Salvador",
  GQ: "Equatorial Guinea", ER: "Eritrea", EE: "Estonia", SZ: "Eswatini", ET: "Ethiopia", FK: "Falkland Islands",
  FO: "Faroe Islands", FJ: "Fiji", FI: "Finland", FR: "France", GF: "French Guiana", PF: "French Polynesia",
  GA: "Gabon", GM: "Gambia", GE: "Georgia", DE: "Germany", GH: "Ghana", GI: "Gibraltar", GR: "Greece", GL: "Greenland",
  GD: "Grenada", GP: "Guadeloupe", GU: "Guam", GT: "Guatemala", GN: "Guinea", GW: "Guinea-Bissau", GY: "Guyana",
  HT: "Haiti", HN: "Honduras", HK: "Hong Kong SAR China", HU: "Hungary", IS: "Iceland", IN: "India", ID: "Indonesia",
  IR: "Iran", IQ: "Iraq", IE: "Ireland", IL: "Israel", IT: "Italy", JM: "Jamaica", JP: "Japan", JO: "Jordan",
  KZ: "Kazakhstan", KE: "Kenya", KI: "Kiribati", XK: "Kosovo", KW: "Kuwait", KG: "Kyrgyzstan", LA: "Laos",
  LV: "Latvia", LB: "Lebanon", LS: "Lesotho", LR: "Liberia", LY: "Libya", LI: "Liechtenstein", LT: "Lithuania",
  LU: "Luxembourg", MO: "Macao SAR China", MG: "Madagascar", MW: "Malawi", MY: "Malaysia", MV: "Maldives", ML: "Mali",
  MT: "Malta", MH: "Marshall Islands", MQ: "Martinique", MR: "Mauritania", MU: "Mauritius", YT: "Mayotte",
  MX: "Mexico", FM: "Micronesia", MD: "Moldova", MC: "Monaco", MN: "Mongolia", ME: "Montenegro", MS: "Montserrat",
  MA: "Morocco", MZ: "Mozambique", MM: "Myanmar (Burma)", NA: "Namibia", NR: "Nauru", NP: "Nepal", NL: "Netherlands",
  NC: "New Caledonia", NZ: "New Zealand", NI: "Nicaragua", NE: "Niger", NG: "Nigeria", NU: "Niue",
  NF: "Norfolk Island", KP: "North Korea", MK: "North Macedonia", MP: "Northern Mariana Islands", NO: "Norway",
  OM: "Oman", PK: "Pakistan", PW: "Palau", PS: "Palestinian Territories", PA: "Panama", PG: "Papua New Guinea",
  PY: "Paraguay", PE: "Peru", PH: "Philippines", PL: "Poland", PT: "Portugal", PR: "Puerto Rico", QA: "Qatar",
  RE: "Réunion", RO: "Romania", RU: "Russia", RW: "Rwanda", SH: "St. Helena", KN: "St. Kitts & Nevis", LC: "St. Lucia",
  PM: "St. Pierre & Miquelon", VC: "St. Vincent & Grenadines", WS: "Samoa", SM: "San Marino",
  ST: "São Tomé & Príncipe", SA: "Saudi Arabia", SN: "Senegal", RS: "Serbia", SC: "Seychelles", SL: "Sierra Leone",
  SG: "Singapore", SX: "Sint Maarten", SK: "Slovakia", SI: "Slovenia", SB: "Solomon Islands", SO: "Somalia",
  ZA: "South Africa", KR: "South Korea", SS: "South Sudan", ES: "Spain", LK: "Sri Lanka", SD: "Sudan", SR: "Suriname",
  SE: "Sweden", CH: "Switzerland", SY: "Syria", TW: "Taiwan", TJ: "Tajikistan", TZ: "Tanzania", TH: "Thailand",
  TL: "Timor-Leste", TG: "Togo", TK: "Tokelau", TO: "Tonga", TT: "Trinidad & Tobago", TN: "Tunisia", TR: "Türkiye",
  TM: "Turkmenistan", TC: "Turks & Caicos Islands", TV: "Tuvalu", VI: "U.S. Virgin Islands", UG: "Uganda",
  UA: "Ukraine", AE: "United Arab Emirates", GB: "United Kingdom", US: "United States", UY: "Uruguay",
  UZ: "Uzbekistan", VU: "Vanuatu", VE: "Venezuela", VN: "Vietnam", WF: "Wallis & Futuna", YE: "Yemen", ZM: "Zambia",
  ZW: "Zimbabwe",
};

export const DEFAULT_PHONE_COUNTRY = "LK";

/** Countries shown first — where Sri Lankan buyers and expats mostly are. */
const COMMON_ISO = ["LK", "AU", "CA", "GB", "US", "AE", "QA", "KW", "SA", "SG", "IN", "MV", "IT", "DE", "FR", "NZ", "JP", "MY"];

/** Countries whose numbers keep a leading 0 when written internationally (Italy, San Marino). */
const KEEP_LEADING_ZERO_DIAL = new Set(["39", "378"]);

/** Longest calling code is four digits (e.g. 1684). */
const MAX_DIAL_LENGTH = 4;

export type PhoneCountry = { iso: string; dial: string; name: string; flag: string };

function regionName(iso: string): string {
  return REGION_NAMES[iso] ?? iso;
}

/** Regional-indicator flag emoji for an ISO alpha-2 code (the form the old "🇱🇰 +94" label used). */
export function countryFlag(iso: string): string {
  if (!/^[A-Z]{2}$/.test(iso)) return "";
  return String.fromCodePoint(...[...iso].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

let cachedCountries: { common: PhoneCountry[]; others: PhoneCountry[] } | null = null;

/** Every selectable country: the common ones first (in COMMON_ISO order), then the rest A–Z. Built once, on first use. */
export function getPhoneCountries(): { common: PhoneCountry[]; others: PhoneCountry[] } {
  if (cachedCountries) return cachedCountries;
  const all: PhoneCountry[] = Object.entries(DIAL_CODES).map(([iso, dial]) => ({ iso, dial, name: regionName(iso), flag: countryFlag(iso) }));
  const byIso = new Map(all.map((country) => [country.iso, country]));
  const common = COMMON_ISO.map((iso) => byIso.get(iso)).filter((country): country is PhoneCountry => Boolean(country));
  const commonSet = new Set(COMMON_ISO);
  const others = all.filter((country) => !commonSet.has(country.iso)).sort((a, b) => a.name.localeCompare(b.name, "en"));
  cachedCountries = { common, others };
  return cachedCountries;
}

export function getPhoneCountry(iso: string): PhoneCountry {
  const dial = DIAL_CODES[iso] ?? DIAL_CODES[DEFAULT_PHONE_COUNTRY];
  const resolvedIso = DIAL_CODES[iso] ? iso : DEFAULT_PHONE_COUNTRY;
  return { iso: resolvedIso, dial, name: regionName(resolvedIso), flag: countryFlag(resolvedIso) };
}

/**
 * The number box's text, minus anything that isn't a digit/space/dash/dot/
 * parenthesis, tidied. A leading "+" is kept while typing so an international
 * number typed digit by digit ("+44 7…") can still be recognised by
 * `parseInternationalInput` once its calling code is complete.
 */
export function cleanNationalNumber(value: string): string {
  const plus = value.trimStart().startsWith("+") ? "+" : "";
  return plus + value.replace(/[^\d\s\-.()]/g, "").replace(/\s+/g, " ").trimStart();
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * A buyer pasting a full international number ("+44 7911 123456" or
 * "0044 7911 123456") into the number box: work out the country from the
 * longest matching calling code. Returns null when the text isn't written
 * with an international prefix, or the code isn't recognised.
 */
export function parseInternationalInput(raw: string): { iso: string; national: string } | null {
  const trimmed = raw.trim();
  let rest: string;
  if (trimmed.startsWith("+")) rest = digitsOf(trimmed);
  else if (trimmed.startsWith("00")) rest = digitsOf(trimmed).slice(2);
  else return null;
  if (!rest) return null;
  for (let length = Math.min(MAX_DIAL_LENGTH, rest.length - 1); length >= 1; length -= 1) {
    const dial = rest.slice(0, length);
    const iso = matchIsoForDial(dial);
    if (iso) return { iso, national: rest.slice(length) };
  }
  return null;
}

function matchIsoForDial(dial: string): string | null {
  const primary = PRIMARY_ISO_FOR_DIAL[dial];
  if (primary && DIAL_CODES[primary] === dial) return primary;
  const found = Object.entries(DIAL_CODES).find(([, code]) => code === dial);
  return found ? found[0] : null;
}

/**
 * The international form stored on the lead: "+94 77 123 4567". A single
 * leading 0 (local trunk prefix — "077 123 4567", "07911 123456") is dropped,
 * except where the 0 is part of the number (Italy). Returns null when there is
 * no usable number.
 */
export function buildInternationalPhone(iso: string, national: string): string | null {
  const { dial } = getPhoneCountry(iso);
  let cleaned = cleanNationalNumber(national).replace(/^\+\s*/, "").trim();
  if (!KEEP_LEADING_ZERO_DIAL.has(dial)) cleaned = cleaned.replace(/^0\s*/, "");
  if (!digitsOf(cleaned)) return null;
  return `+${dial} ${cleaned}`;
}

/** Plausible for a lead form: at least 4 national digits and at most 15 digits in total (the E.164 limit). */
export function isPlausiblePhone(iso: string, national: string): boolean {
  const international = buildInternationalPhone(iso, national);
  if (!international) return false;
  const digits = digitsOf(international);
  const nationalDigits = digits.length - getPhoneCountry(iso).dial.length;
  return nationalDigits >= 4 && digits.length <= 15;
}
