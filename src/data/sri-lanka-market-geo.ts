import cities from "./cities.json";
import districts from "./districts.json";
import provinces from "./provinces.json";

export const sriLankaProvinces = provinces.map((province) => `${province.name_en} Province`) as [string, ...string[]];

const legacySriLankaProvinces = [
  "Western Province",
  "Central Province",
  "Southern Province",
  "Northern Province",
  "Eastern Province",
  "North Western Province",
  "North Central Province",
  "Uva Province",
  "Sabaragamuwa Province",
] as const;

const legacySriLankaDistrictsByProvince: Record<string, string[]> = {
  "Western Province": ["Colombo", "Gampaha", "Kalutara"],
  "Central Province": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern Province": ["Galle", "Matara", "Hambantota"],
  "Northern Province": ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "Eastern Province": ["Trincomalee", "Batticaloa", "Ampara"],
  "North Western Province": ["Kurunegala", "Puttalam"],
  "North Central Province": ["Anuradhapura", "Polonnaruwa"],
  "Uva Province": ["Badulla", "Monaragala"],
  "Sabaragamuwa Province": ["Ratnapura", "Kegalle"],
};

const legacySriLankaCitiesByDistrict: Record<string, string[]> = {
  Colombo: ["Colombo", "Sri Jayawardenepura Kotte", "Dehiwala-Mount Lavinia", "Moratuwa", "Kaduwela", "Maharagama", "Kesbewa", "Homagama", "Avissawella", "Padukka", "Nugegoda", "Rajagiriya", "Battaramulla", "Wellampitiya", "Kolonnawa", "Piliyandala", "Boralesgamuwa", "Kohuwala", "Mount Lavinia", "Dehiwala", "Ratmalana", "Athurugiriya", "Malabe"],
  Gampaha: ["Gampaha", "Negombo", "Ja-Ela", "Wattala", "Kelaniya", "Kadawatha", "Kiribathgoda", "Minuwangoda", "Katunayake", "Seeduwa", "Divulapitiya", "Nittambuwa", "Veyangoda", "Mirigama", "Attanagalla", "Biyagama", "Dompe", "Ganemulla", "Ragama", "Kandana", "Peliyagoda"],
  Kalutara: ["Kalutara", "Panadura", "Beruwala", "Horana", "Matugama", "Wadduwa", "Aluthgama", "Bentota", "Bandaragama", "Ingiriya", "Bulathsinhala", "Payagala", "Maggona"],
  Kandy: ["Kandy", "Peradeniya", "Katugastota", "Kundasale", "Digana", "Gampola", "Nawalapitiya", "Kadugannawa", "Pussellawa", "Wattegama", "Harispattuwa", "Akurana", "Galagedara", "Deltota", "Teldeniya"],
  Matale: ["Matale", "Dambulla", "Ukuwela", "Rattota", "Galewela", "Naula", "Pallepola", "Yatawatta", "Laggala", "Sigiriya"],
  "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele", "Maskeliya", "Ginigathhena", "Nanu Oya", "Ramboda", "Kotagala", "Walapane", "Hanguranketha", "Ragala", "Lindula", "Thalawakelle"],
  Galle: ["Galle", "Hikkaduwa", "Ambalangoda", "Elpitiya", "Bentota", "Baddegama", "Karandeniya", "Balapitiya", "Ahangama", "Unawatuna", "Weligama", "Imaduwa", "Habaraduwa", "Akmeemana", "Nagoda"],
  Matara: ["Matara", "Weligama", "Akuressa", "Dikwella", "Hakmana", "Kamburupitiya", "Deniyaya", "Devinuwara", "Mirissa", "Thihagoda", "Malimbada", "Kotapola", "Athuraliya"],
  Hambantota: ["Hambantota", "Tangalle", "Tissamaharama", "Beliatta", "Ambalantota", "Weeraketiya", "Walasmulla", "Katuwana", "Sooriyawewa", "Lunugamvehera", "Kataragama"],
  Jaffna: ["Jaffna", "Nallur", "Chavakachcheri", "Point Pedro", "Karainagar", "Kayts", "Velanai", "Kopay", "Tellippalai", "Uduvil", "Chankanai", "Manipay", "Maruthankerny", "Vaddukoddai", "Sandilipay"],
  Kilinochchi: ["Kilinochchi", "Paranthan", "Poonakary", "Pallai", "Kandavalai", "Pachchilaipalli", "Akkarayankulam"],
  Mannar: ["Mannar", "Madhu", "Murunkan", "Pesalai", "Talaimannar", "Nanaddan", "Manthai", "Silavathurai"],
  Mullaitivu: ["Mullaitivu", "Puthukkudiyiruppu", "Oddusuddan", "Maritimepattu", "Thunukkai", "Manthai East", "Puthukudiyiruppu"],
  Vavuniya: ["Vavuniya", "Vavuniya North", "Vavuniya South", "Vengalacheddikulam", "Nedunkeni", "Omanthai"],
  Batticaloa: ["Batticaloa", "Kattankudy", "Eravur", "Kalmunai", "Valachchenai", "Koralai Pattu", "Manmunai", "Valaichenai", "Chenkalady", "Kokkadichcholai"],
  Ampara: ["Ampara", "Kalmunai", "Akkaraipattu", "Sammanthurai", "Sainthamaruthu", "Pottuvil", "Nintavur", "Maruthamunai", "Addalaichenai", "Damana", "Uhana", "Mahaoya", "Dehiattakandiya", "Lahugala", "Thirukkovil", "Samanthurai"],
  Trincomalee: ["Trincomalee", "Kinniya", "Kantale", "Mutur", "China Bay", "Nilaveli", "Kuchchaveli", "Seruwila", "Morawewa", "Gomarankadawala", "Thambalagamuwa"],
  Kurunegala: ["Kurunegala", "Kuliyapitiya", "Wariyapola", "Narammala", "Polgahawela", "Pannala", "Nikaweratiya", "Galgamuwa", "Dambadeniya", "Mawathagama", "Ibbagamuwa", "Mahawa", "Bingiriya", "Alawwa", "Rideegama", "Polpithigama", "Kobeigane", "Ganewatta", "Ambanpola", "Ehetuwewa"],
  Puttalam: ["Puttalam", "Chilaw", "Wennappuwa", "Marawila", "Nattandiya", "Dankotuwa", "Kalpitiya", "Anamaduwa", "Madampe", "Mahawewa", "Arachchikattuwa", "Mundel", "Nawagaththegama", "Pallama", "Karuwalagaswewa", "Wanathavilluwa"],
  Anuradhapura: ["Anuradhapura", "Kekirawa", "Eppawala", "Medawachchiya", "Nochchiyagama", "Thambuttegama", "Mihintale", "Galnewa", "Horowpothana", "Kahatagasdigiliya", "Padaviya", "Rambewa", "Talawa", "Ipalogama", "Palugaswewa", "Rajanganaya", "Nachchadoowa"],
  Polonnaruwa: ["Polonnaruwa", "Kaduruwela", "Hingurakgoda", "Medirigiriya", "Welikanda", "Dimbulagala", "Lankapura", "Elahera", "Bakamuna", "Aralaganwila"],
  Badulla: ["Badulla", "Bandarawela", "Ella", "Haputale", "Welimada", "Hali Ela", "Passara", "Mahiyanganaya", "Diyatalawa", "Haldummulla", "Lunugala", "Kandaketiya", "Soranathota", "Meegahakivula", "Rideemaliyadda", "Uva Paranagama"],
  Monaragala: ["Monaragala", "Wellawaya", "Bibile", "Buttala", "Kataragama", "Siyambalanduwa", "Badalkumbura", "Medagama", "Sevanagala", "Thanamalwila", "Madulla"],
  Ratnapura: ["Ratnapura", "Balangoda", "Embilipitiya", "Pelmadulla", "Eheliyagoda", "Kuruwita", "Kahawatta", "Rakwana", "Godakawela", "Kalawana", "Nivithigala", "Ayagama", "Opanayake", "Kolonna", "Kiriella", "Weligepola"],
  Kegalle: ["Kegalle", "Mawanella", "Warakapola", "Rambukkana", "Aranayake", "Ruwanwella", "Yatiyantota", "Dehiowita", "Deraniyagala", "Galigamuwa", "Bulathkohupitiya"],
};

const provinceNamesById: Record<string, string> = Object.fromEntries(
  provinces.map((province) => [province.id, `${province.name_en} Province`]),
);

export const sriLankaDistrictsByProvince: Record<string, string[]> = districts.reduce<Record<string, string[]>>((result, district) => {
  const provinceName = provinceNamesById[district.province_id];
  if (provinceName) {
    result[provinceName] = [...(result[provinceName] ?? []), district.name_en];
  }
  return result;
}, {});

export const sriLankaCitiesByDistrict: Record<string, string[]> = cities.reduce<Record<string, string[]>>((result, city) => {
  const district = districts.find((item) => item.id === city.district_id);
  if (district) {
    result[district.name_en] = [...(result[district.name_en] ?? []), city.name_en];
  }
  return result;
}, {});

export const sriLankaNeighborhoodsByCity: Record<string, string[]> = {
  Colombo: [
    "Fort",
    "Pettah",
    "Kollupitiya",
    "Bambalapitiya",
    "Wellawatte",
    "Havelock Town",
    "Cinnamon Gardens",
    "Borella",
    "Maradana",
    "Kirulapone",
    "Narahenpita",
    "Dematagoda",
    "Grandpass",
    "Mutwal",
  ],
  Dehiwala: ["Dehiwala", "Karagampitiya", "Nedimala", "Attidiya"],
  "Mount Lavinia": ["Mount Lavinia", "Rathmalana", "Angulana"],
  Kotte: ["Sri Jayawardenepura Kotte", "Pitakotte", "Nugegoda"],
  Rajagiriya: ["Rajagiriya", "Ethul Kotte", "Obeysekarapura"],
  Battaramulla: ["Battaramulla", "Pelawatte", "Koswatte"],
  Moratuwa: ["Rawathawatta", "Katubedda", "Lakshapathiya"],
  Galle: ["Fort", "Milidduwa", "Magalle", "Dangedara"],
  Kandy: ["Asgiriya", "Peradeniya", "Katugastota", "Mawilmada"],
  Negombo: ["Dalupotha", "Periyamulla", "Kochchikade"],
  Jaffna: ["Nallur", "Kokuvil", "Ariyalai"],
  Trincomalee: ["Orr's Hill", "Anpuvalipuram", "Uppuveli"],
  Batticaloa: ["Kallady", "Navatkuda", "Arayampathy"],
  Matara: ["Nupe", "Kotuwegoda", "Meddawatta"],
  "Nuwara Eliya": ["Nuwara Eliya Town", "Hawa Eliya", "Blackpool"],
};
