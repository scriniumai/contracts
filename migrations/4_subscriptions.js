var Subscriptions = artifacts.require("Subscriptions");

var DemoBalances = artifacts.require("DemoBalances");

module.exports = function(deployer, network) {
  deployer.deploy(
    Subscriptions,
    DemoBalances.address
  ).then(function () {

    global.dataForWriting = {
      ...global.dataForWriting,

      subscriptions: {
        comment: __filename,
        abi: Subscriptions.abi,
        address: Subscriptions.address
      }
    }

    return Promise.resolve()
  });
};
