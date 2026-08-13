// Flat state/province tax rates — no slabs, applied directly on annual taxable income
// Countries without state-level tax (India, UK, Australia) default to 0

const stateTaxRates = {
  "United States": {
    California: 0.093,
    "New York": 0.0685,
    Texas: 0.0,
    Florida: 0.0,
    Washington: 0.0,
    Illinois: 0.0495,
    Pennsylvania: 0.0307,
    Ohio: 0.035,
    Georgia: 0.0549,
    "New Jersey": 0.0637,
   
  },
  Canada: {
    Ontario: 0.0915,
    Quebec: 0.14,
    "British Columbia": 0.077,
    Alberta: 0.1,
    Manitoba: 0.1275,
    Saskatchewan: 0.105,
    "Nova Scotia": 0.1379,
    "New Brunswick": 0.14,

  },
  India: {},
  "United Kingdom": {},
  Australia: {},
};

function getStateTaxRate(country, state) {
  return stateTaxRates[country]?.[state] || 0;
}

module.exports = { stateTaxRates, getStateTaxRate };
