// /src/ui/theme/theme.cjs
'use strict';
// RIVNA palette is an intentionally independent Niyarvo Projects visual preference.
const rivna = require('./rivnaPalette.cjs');
function contrastInk(hex) { return rivna.buttonInk(hex); }
module.exports = { ...rivna, contrastInk };
