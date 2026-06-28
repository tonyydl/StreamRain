const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'popup', 'popup.html'), 'utf8');

assert.match(html, /id="density-select"/);
assert.match(html, /id="display-range-select"/);
assert.match(html, /value="low"/);
assert.match(html, /value="medium"/);
assert.match(html, /value="high"/);
assert.match(html, /value="half"/);
assert.match(html, /value="threeQuarter"/);
assert.match(html, /value="full"/);
assert.match(html, /id="reset-settings"/);

console.log('ok');
