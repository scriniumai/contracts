var Platform = artifacts.require("Platform");

var DemoBalances = artifacts.require("DemoBalances");
var Instruments = artifacts.require("Instruments");
var Subscriptions = artifacts.require("Subscriptions");

var platformInstance, demoBalancesInstance;

module.exports = function(deployer, network, accounts) {
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
      return global.writeGethClientPreload(
        network,
        {
         platform: {
            comment: __filename,
            abi: Platform.abi,
            address: Platform.address
          }
        }
      );
  });
};
