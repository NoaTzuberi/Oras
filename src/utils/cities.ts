// GeoNames ids accepted by Hebcal (checked against hebcal.com/shabbat on 2026-11-01).
export type City = { geonameid: number; he: string; en: string }

export const DEFAULT_GEONAMEID = 293397 // Tel Aviv

export const ISRAELI_CITIES: City[] = [
  { geonameid: 293397, he: 'תל אביב', en: 'Tel Aviv' },
  { geonameid: 281184, he: 'ירושלים', en: 'Jerusalem' },
  { geonameid: 294801, he: 'חיפה', en: 'Haifa' },
  { geonameid: 295530, he: 'באר שבע', en: 'Beersheba' },
  { geonameid: 293703, he: 'ראשון לציון', en: 'Rishon LeZion' },
  { geonameid: 293918, he: 'פתח תקווה', en: 'Petah Tikva' },
  { geonameid: 295629, he: 'אשדוד', en: 'Ashdod' },
  { geonameid: 294071, he: 'נתניה', en: 'Netanya' },
  { geonameid: 294751, he: 'חולון', en: 'Holon' },
  { geonameid: 295514, he: 'בני ברק', en: 'Bnei Brak' },
  { geonameid: 293788, he: 'רמת גן', en: 'Ramat Gan' },
  { geonameid: 295548, he: 'בת ים', en: 'Bat Yam' },
  { geonameid: 293725, he: 'רחובות', en: 'Rehovot' },
  { geonameid: 295620, he: 'אשקלון', en: 'Ashkelon' },
  { geonameid: 294778, he: 'הרצליה', en: 'Herzliya' },
  { geonameid: 294514, he: 'כפר סבא', en: 'Kfar Saba' },
  { geonameid: 293807, he: 'רעננה', en: "Ra'anana" },
  { geonameid: 282926, he: 'מודיעין', en: "Modi'in" },
  { geonameid: 294946, he: 'חדרה', en: 'Hadera' },
  { geonameid: 8199394, he: 'אריאל', en: 'Ariel' },
  { geonameid: 293619, he: 'שדרות', en: 'Sderot' },
  { geonameid: 294098, he: 'נצרת', en: 'Nazareth' },
  { geonameid: 293322, he: 'טבריה', en: 'Tiberias' },
  { geonameid: 293100, he: 'צפת', en: 'Safed' },
  { geonameid: 295277, he: 'אילת', en: 'Eilat' },
]

export const cityName = (geonameid: number, lang: string): string => {
  const city = ISRAELI_CITIES.find(c => c.geonameid === geonameid)
  if (!city) return String(geonameid)
  return lang === 'he' ? city.he : city.en
}
