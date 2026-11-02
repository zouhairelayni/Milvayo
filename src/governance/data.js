// /src/governance/data.js
export const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('en-US');
export const labourCosts=s=>({planned:s.costs?.plannedCost||0,actual:s.costs?.cost||0});
