export const PLACEHOLDER_IMAGE = '/assets/images/placeholder.jpg'

// Ordered most-specific first so longer matches win
const BIKE_NAME_MAP = [
  // Official Nepal models (suzukimotorcycle.com.np)
  { keys: ['gixxer 155 fi', 'gixxer155 fi', 'gixxer 155fi'],   img: '/assets/images/bikes/gixxer-155-blue.jpg' },
  { keys: ['gixxer 155'],                                        img: '/assets/images/bikes/gixxer-155-orange.jpg' },
  { keys: ['v-strom sx 250', 'vstrom sx 250', 'v strom sx'],    img: '/assets/images/bikes/vstrom-sx-250.jpg' },
  { keys: ['v-strom 250', 'vstrom 250', 'v strom 250'],         img: '/assets/images/bikes/vstrom-sx-250.jpg' },
  { keys: ['v-strom', 'vstrom'],                                 img: '/assets/images/bikes/vstrom-sx-250.jpg' },
  // Nepal price-list models (bikepricenepal.com)
  { keys: ['gixxer sf 250 moto gp', 'sf 250 moto gp'],          img: '/assets/images/bikes/gixxer-sf-250-motogp.png' },
  { keys: ['gixxer sf 250'],                                     img: '/assets/images/bikes/gixxer-sf-250-std.png' },
  { keys: ['gixxer sf 150 moto gp', 'sf 150 moto gp'],          img: '/assets/images/bikes/gixxer-sf-150-motogp.png' },
  { keys: ['gixxer sf 150', 'sf 150 abs'],                       img: '/assets/images/bikes/gixxer-sf-150-abs.png' },
  { keys: ['gixxer 250'],                                        img: '/assets/images/bikes/gixxer-250-naked.png' },
  { keys: ['gixxer sf'],                                         img: '/assets/images/bikes/gixxer-sf-150-abs.png' },
  { keys: ['gixxer'],                                            img: '/assets/images/bikes/gixxer-155-fi.png' },
  { keys: ['gsx-s1000gx+', 'gsx-s1000gx', 'gsx s1000'],        img: '/assets/images/bikes/gsx-s1000gx.jpg' },
  { keys: ['gsx-8s', 'gsx 8s'],                                  img: '/assets/images/bikes/gsx-8s.webp' },
  { keys: ['intruder 150', 'intruder150'],                       img: '/assets/images/bikes/intruder-150.png' },
  { keys: ['intruder'],                                          img: '/assets/images/bikes/intruder-150.png' },
  { keys: ['hayate'],                                            img: '/assets/images/bikes/hayate.png' },
  { keys: ['hayabusa'],                                          img: '/assets/images/bikes/gsx-s1000gx.jpg' },
  { keys: ['bandit'],                                            img: '/assets/images/bikes/bike-3.jpg' },
  { keys: ['katana'],                                            img: '/assets/images/bikes/bike-6.jpg' },
]

const SCOOTER_NAME_MAP = [
  // Official Nepal models (suzukimotorcycle.com.np)
  { keys: ['access 125 fi sp', 'access 125 fi special', 'access 125 fi'], img: '/assets/images/scooters/access-125-fi.jpg' },
  { keys: ['access 125', 'access125'],                                     img: '/assets/images/scooters/access-125-fi.jpg' },
  { keys: ['access'],                                                      img: '/assets/images/scooters/access-125-fi.jpg' },
  { keys: ['avenis 125 fi', 'avenis125 fi', 'avenis 125'],                 img: '/assets/images/scooters/avenis-125-fi.jpg' },
  { keys: ['avenis'],                                                      img: '/assets/images/scooters/avenis-125-fi.jpg' },
  { keys: ['burgman 125 fi', 'burgman125 fi', 'burgman 125'],              img: '/assets/images/scooters/burgman-125-fi.jpg' },
  { keys: ['burgman street 125', 'burgman street'],                        img: '/assets/images/scooters/burgman-street-125.png' },
  { keys: ['burgman'],                                                     img: '/assets/images/scooters/burgman-125-fi.jpg' },
  { keys: ["let's", 'lets'],                                               img: '/assets/images/scooters/scooter-3.jpg' },
  { keys: ['swish'],                                                       img: '/assets/images/scooters/scooter-4.jpg' },
]

const BIKE_FALLBACKS = [
  '/assets/images/bikes/gixxer-155-blue.jpg',
  '/assets/images/bikes/gixxer-155-orange.jpg',
  '/assets/images/bikes/gixxer-sf-150-abs.png',
  '/assets/images/bikes/vstrom-sx-250.jpg',
  '/assets/images/bikes/gixxer-250-naked.png',
  '/assets/images/bikes/gixxer-sf-250-std.png',
  '/assets/images/bikes/intruder-150.png',
  '/assets/images/bikes/gsx-8s.webp',
]

const SCOOTER_FALLBACKS = [
  '/assets/images/scooters/avenis-125-fi.jpg',
  '/assets/images/scooters/burgman-125-fi.jpg',
  '/assets/images/scooters/access-125-fi.jpg',
  '/assets/images/scooters/burgman-street-125.png',
]

function autoImage(item) {
  const name = (item?.modelName ?? '').toLowerCase()
  const type = (item?.type ?? '').toUpperCase()
  const id = Math.abs(item?.id ?? 0)

  const map = type === 'SCOOTER' ? SCOOTER_NAME_MAP : BIKE_NAME_MAP
  for (const { keys, img } of map) {
    if (keys.some((k) => name.includes(k))) return img
  }

  const fallbacks = type === 'SCOOTER' ? SCOOTER_FALLBACKS : BIKE_FALLBACKS
  return fallbacks[id % fallbacks.length]
}

export function getImageUrl(item) {
  const url = item?._fallbackImage ?? item?.imageUrl ?? item?.image
  if (url && (url.startsWith('/') || url.startsWith('http'))) return url
  if (url) return `/assets/images/${url}`
  return autoImage(item)
}
