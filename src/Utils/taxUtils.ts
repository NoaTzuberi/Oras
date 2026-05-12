const TAX_BRACKETS = [
  { limit: 7010, rate: 0.1 },
  { limit: 10060, rate: 0.14 },
  { limit: 16150, rate: 0.2 },
  { limit: 22440, rate: 0.31 },
  { limit: 46690, rate: 0.35 },
  { limit: 60130, rate: 0.47 },
  { limit: Infinity, rate: 0.5 },
];

const VALUE_PER_POINT = 235;

/* 💰 TAX */
export const calculateTax = (grossSalary, creditPoints) => {
  let remaining = grossSalary;
  let tax = 0;
  let lastLimit = 0;

  for (const bracket of TAX_BRACKETS) {
    const taxable = Math.min(remaining, bracket.limit - lastLimit);

    if (taxable <= 0) break;

    tax += taxable * bracket.rate;
    remaining -= taxable;
    lastLimit = bracket.limit;
  }

  const creditValue = creditPoints * VALUE_PER_POINT;
  tax -= creditValue;

  return Math.max(0, Math.round(tax));
};

/* 💰 GROSS */
export const calculateGross = (shifts) => {
  return shifts.reduce((sum, shift) => sum + shift.totalEarnings, 0);
};

/* ⏱ HOURS */
export const calculateHours = (shifts) => {
  return shifts.reduce((sum, shift) => sum + shift.hours, 0);
};

/* 🧠 POINTS (101 logic בסיסי) */
export const calculatePoints = (user) => {
  let points = 0;

  if (user.isResident) points += 2.25;
  if (user.gender === "female") points += 0.5;

  user.children?.forEach(child => {
    const age = Number(child.age);

    if (age <= 5) points += 2.5;
    else if (age <= 17) points += 1;
  });

  if (user.isSingleParent) points += 1;

  if (user.isDischargedSoldier) points += 2;

  if (user.isReservist) points += 0.5;

  if (user.degree === "bachelor") points += 1;
  if (user.degree === "master") points += 0.5;

  if (user.isNewImmigrant) points += 2;

  return points;
};