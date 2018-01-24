var Scrinium = artifacts.require("Scrinium");
var Balances = artifacts.require("Balances");
var Platform = artifacts.require("Platform");

var fs = require('fs');

module.exports = function(deployer, network){

  deployer.deploy(Scrinium)
    .then(function () {
      return deployer.deploy(Balances, Scrinium.address);
    })
    .then(function () {
      return deployer.deploy(Platform);
    })
    .then(function () {

      if (network !== 'testing') { // do not use it for tests
        var code =`// preload.js for geth client
var scrinium = eth.contract(JSON.parse('${JSON.stringify(Scrinium.abi)}')).at('${Scrinium.address}');
var balances = eth.contract(JSON.parse('${JSON.stringify(Balances.abi)}')).at('${Balances.address}');
var platform = eth.contract(JSON.parse('${JSON.stringify(Platform.abi)}')).at('${Platform.address}');
`;
        return fs.writeFileSync('./preload.js', code);
      }
    });
};
