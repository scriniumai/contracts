var DemoBalances = artifacts.require("DemoBalances");

var Scrinium = artifacts.require("Scrinium");

module.exports = function(deployer, network) {
  deployer.deploy(
    DemoBalances,
    Scrinium.address
  ).then(function () {

    global.dataForWriting = {
      ...global.dataForWriting,

      demoBalances: {
        comment: __filename,
        abi: DemoBalances.abi,
        address: DemoBalances.address
      }
    }

    return Promise.resolve()
  });
}
