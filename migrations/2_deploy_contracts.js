var Scrinium = artifacts.require("./Scrinium.sol")
module.exports = function(deployer, network, accounts) {
  deployer.deploy(Scrinium);
}
