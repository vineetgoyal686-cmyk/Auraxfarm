// Default master data. In the admin "Master Data" screen these lists can
// be edited; edits are persisted to localStorage under this same key so
// every form (New Farmer, Capture Farm, Add Crop) stays in sync.

const KEY = 'auraxfarm:masterData'

const DEFAULTS = {
  states: ['Haryana', 'Punjab', 'Uttar Pradesh', 'Rajasthan'],
  districts: ['Karnal', 'Panipat', 'Hisar', 'Rohtak', 'Ludhiana'],
  villages: ['Samalkha', 'Karnal', 'Assandh', 'Gharaunda'],
  crops: ['Wheat', 'Rice', 'Sugarcane', 'Mustard', 'Cotton', 'Maize'],
  fertilizers: ['Urea', 'DAP', 'MOP', 'NPK', 'Zinc'],
  landTypes: ['Owner', 'Lease', 'Tiller'],
  roles: ['Field User', 'Administrator'],
  languages: ['English', 'Hindi', 'Punjabi']
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export const MASTER_DATA = load()

export function saveMasterData(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}
