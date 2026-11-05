// /src/ui/theme/theme.cjs
'use strict';
// RIVNA palette is an intentionally independent Milvayo visual preference.
const themePalette = require('./themePalette.cjs');
function contrastInk(hex) { return themePalette.buttonInk(hex); }
module.exports = { ...themePalette, contrastInk };
