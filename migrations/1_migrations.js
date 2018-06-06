var Migrations = artifacts.require("Migrations");

module.exports = function(deployer) {
  // Deploy the Migrations contract as our only task
  return deployer.deploy(Migrations);
};
