var Instruments = artifacts.require("Instruments");

var fs = require("fs");

module.exports = function(deployer, network){
    deployer.deploy(Instruments)
      .then(function () {

      var code = `
// migrations/6_instruments.js
var instruments = eth.contract(JSON.parse('${JSON.stringify(Instruments.abi)}')).at('${Instruments.address}');
`;

      return fs.appendFileSync(`./preload-${network}.js`, code);
    });
};
