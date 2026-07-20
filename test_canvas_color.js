const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
// JSDOM doesn't implement full canvas color serialization, but let's see.
