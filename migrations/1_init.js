var Migrations = artifacts.require("Migrations");

module.exports = function(deployer, a, b) {
  // Deploy the Migrations contract as our only task
  deployer.deploy(Migrations);
};
