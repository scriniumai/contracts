var Instruments = artifacts.require("Instruments");

var fs = require("fs");

module.exports = function(deployer, network, accounts){
    deployer.deploy(
      Instruments
    ).then(function (instruments) {

      const instrumentsData = require('../data/instruments.json');

      const txs = instrumentsData.map(
        ({ id, name, type }) => instruments.add(
          id,
          name,
          type,
          { from: accounts[0] }
        )
      );

      return Promise.all(txs);
    }).then(function () {

      var code = `
// migrations/5_instruments.js
var instruments = eth.contract(JSON.parse('${JSON.stringify(Instruments.abi)}')).at('${Instruments.address}');
`;

      return fs.appendFileSync(`./preload-${network}.js`, code);
    });
};
