// National tax slabs by country and filing status
// For US: Married (joint) has separate slabs; Single, MarriedSeparately, HeadOfHousehold use Single slabs
// For India, Canada, Australia, UK: same slabs regardless of filing status

const usSingleSlabs = [
  { upTo: 12400, rate: 0.1 },
  { upTo: 50400, rate: 0.12 },
  { upTo: 105700, rate: 0.22 },
  { upTo: 201775, rate: 0.24 },
  { upTo: 256225, rate: 0.32 },
  { upTo: 640600, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

const usMarriedJointSlabs = [
  { upTo: 24800, rate: 0.1 },
  { upTo: 100800, rate: 0.12 },
  { upTo: 211400, rate: 0.22 },
  { upTo: 403550, rate: 0.24 },
  { upTo: 512450, rate: 0.32 },
  { upTo: 768700, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];

const indiaSlabs = [
  { upTo: 400000, rate: 0.0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

const canadaSlabs = [
  { upTo: 58523, rate: 0.14 },
  { upTo: 117045, rate: 0.205 },
  { upTo: 181440, rate: 0.26 },
  { upTo: 258482, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 },
];

const australiaSlabs = [
  { upTo: 18200, rate: 0.0 },
  { upTo: 45000, rate: 0.15 },
  { upTo: 135000, rate: 0.3 },
  { upTo: 190000, rate: 0.37 },
  { upTo: Infinity, rate: 0.45 },
];

const ukSlabs = [
  { upTo: 12570, rate: 0.0 },
  { upTo: 50270, rate: 0.2 },
  { upTo: 125140, rate: 0.4 },
  { upTo: Infinity, rate: 0.45 },
];

const taxSlabs = {
  "United States": {
    Single: usSingleSlabs,
    Married: usMarriedJointSlabs,
    "Married Separately": usSingleSlabs,
    "Head of Household": usSingleSlabs,
  },
  India: {
    Single: indiaSlabs,
    Married: indiaSlabs,
    "Married Separately": indiaSlabs,
    "Head of Household": indiaSlabs,
  },
  Canada: {
    Single: canadaSlabs,
    Married: canadaSlabs,
    "Married Separately": canadaSlabs,
    "Head of Household": canadaSlabs,
  },
  Australia: {
    Single: australiaSlabs,
    Married: australiaSlabs,
    "Married Separately": australiaSlabs,
    "Head of Household": australiaSlabs,
  },
  "United Kingdom": {
    Single: ukSlabs,
    Married: ukSlabs,
    "Married Separately": ukSlabs,
    "Head of Household": ukSlabs,
  },
};

module.exports = taxSlabs;
