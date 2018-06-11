const Platform = artifacts.require("Platform")

const DemoBalances = artifacts.require("DemoBalances")
const Instruments = artifacts.require("Instruments")
const Subscriptions = artifacts.require("Subscriptions")

let platformInstance, demoBalancesInstance

module.exports = global.omitMigration(__filename, (deployer, network, accounts) => {
    return deployer.deploy(
      Platform,
      accounts[0],
      DemoBalances.address,
      Instruments.address,
      Subscriptions.address
    ).then((instance) => {
      platformInstance = instance

      return DemoBalances.deployed()
    }).then((instance) => {
      demoBalancesInstance = instance

      return demoBalancesInstance.setPlatformAddress(platformInstance.address)
    }).then(() => {

      global.dataForWriting = {
        ...global.dataForWriting,

        platform: {
          comment: __filename,
          abi: Platform.abi,
          address: Platform.address
        }
      }

      return Promise.resolve()
  })
})
