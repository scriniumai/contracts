const Migrations = artifacts.require("Migrations")

module.exports = (deployer) => {
  return deployer.deploy(Migrations)
}
