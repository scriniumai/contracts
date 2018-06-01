var Scrinium = artifacts.require("Scrinium");
var Balances = artifacts.require("Balances");

var fs = require('fs');

module.exports = function(deployer, network){
  // @todo: on production use already existing Scrinium's address

  deployer.deploy(
    Scrinium
  ).then(function () {
      return deployer.deploy(Balances, Scrinium.address);
  }).then(function () {

    var code =`// preload.js for geth client
var scrinium = eth.contract(JSON.parse('${JSON.stringify(Scrinium.abi)}')).at('${Scrinium.address}');
var balances = eth.contract(JSON.parse('${JSON.stringify(Balances.abi)}')).at('${Balances.address}');
`;

    return fs.writeFileSync(`./preload-${network}.js`, code);
  });
};
