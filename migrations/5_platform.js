var Subscriptions = artifacts.require("Subscriptions");
var DemoBalances = artifacts.require("DemoBalances");

var Platform = artifacts.require("Platform");

var fs = require("fs");

module.exports = function(deployer, network){
    deployer.deploy(Platform, DemoBalances.address, Subscriptions.address)
      .then(function () {

      var code =`
// migrations/5_platform.js
var platform = eth.contract(JSON.parse('${JSON.stringify(Platform.abi)}')).at('${Platform.address}');
`;

      return fs.appendFileSync(`./preload-${network}.js`, code);
    });
};
