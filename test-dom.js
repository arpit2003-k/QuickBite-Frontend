const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const consoleSpy = {
  log: (...args) => console.log('LOG:', ...args),
  error: (...args) => console.error('ERROR:', ...args),
  warn: (...args) => console.warn('WARN:', ...args),
};

JSDOM.fromURL("http://localhost:4200/login", {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true
}).then(dom => {
  dom.window.console = consoleSpy;
  setTimeout(() => {
    console.log("HTML length:", dom.window.document.body.innerHTML.length);
    console.log("Body HTML preview:", dom.window.document.body.innerHTML.substring(0, 500));
  }, 2000);
}).catch(e => {
  console.log("JSDOM Error:", e);
});
