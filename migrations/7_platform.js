const Platform = artifacts.require("Platform")

const Balances = artifacts.require("Balances")
const Instruments = artifacts.require("Instruments")
const Subscriptions = artifacts.require("Subscriptions")
const LiquidityProvider = artifacts.require("LiquidityProvider")

module.exports = global.omitMigration(__filename, (deployer, network, accounts) => {
    return deployer.deploy(
      Platform,
      Balances.address,
      Instruments.address,
      Subscriptions.address,
      LiquidityProvider.address,
    ).then(async (platformInstance) => {
      const liquidityProviderInstance = await LiquidityProvider.deployed()
      await liquidityProviderInstance.setPlatformAddress(platformInstance.address)

      const balancesInstance = await Balances.deployed()
      await balancesInstance.setPlatformAddress(platformInstance.address)

      return Promise.resolve()
    }).then(() => {

      global.dataForWriting = {
        ...global.dataForWriting,

        platform: {
          comment: __filename,
          abi: Platform.abi,
          address: Platform.address,
        },
      }

      return Promise.resolve()
  })
})
