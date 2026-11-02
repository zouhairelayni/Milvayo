// /src/utils/localDay.cjs
'use strict';
// Today's date on the device clock, as YYYY-MM-DD. toISOString() is UTC, which is a day off for part of every day.
const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
module.exports = { localDay };
