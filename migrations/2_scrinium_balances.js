var Scrinium = artifacts.require("Scrinium");
var Balances = artifacts.require("Balances");

module.exports = function(deployer, network) {
  // @todo: on production use already existing Scrinium's address or split it to 2 repos
  deployer.deploy(
    Scrinium
  ).then(function () {
    return deployer.deploy(Balances, Scrinium.address);
  }).then(function () {
    return global.writeGethClientPreload(
      network,
      {
        scrinium: {
          comment: __filename,
          abi: Scrinium.abi,
          address: Scrinium.address
        },
        balances: {
          comment: __filename,
          abi: Balances.abi,
          address: Balances.address
        }
      },
      true
    );
  });
};
