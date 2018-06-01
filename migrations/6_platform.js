var Platform = artifacts.require("Platform");

var DemoBalances = artifacts.require("DemoBalances");
var Instruments = artifacts.require("Instruments");
var Subscriptions = artifacts.require("Subscriptions");

var fs = require("fs");

var platformInstance, demoBalancesInstance;

module.exports = function(deployer, network, accounts){
    deployer.deploy(
      Platform,
      accounts[0],
      DemoBalances.address,
      Instruments.address,
      Subscriptions.address
    ).then(function (instance) {
      platformInstance = instance

      return DemoBalances.deployed()
    }).then(function (instance) {
      demoBalancesInstance = instance

      return demoBalancesInstance.setPlatformAddress(platformInstance.address)
    }).then(function () {

    var code =`
// migrations/6_platform.js
var platform = eth.contract(JSON.parse('${JSON.stringify(Platform.abi)}')).at('${Platform.address}');
`;

    return fs.appendFileSync(`./preload-${network}.js`, code);
  });
};
