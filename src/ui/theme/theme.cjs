// /src/ui/theme/theme.cjs
'use strict';
// Milvayo semantic palette and persistent preference helpers.
const themePalette = require('./themePalette.cjs');
function contrastInk(hex) { return themePalette.buttonInk(hex); }
module.exports = { ...themePalette, contrastInk };
