const LiquidityProvider = artifacts.require("LiquidityProvider")

const Scrinium = artifacts.require("Scrinium")
const Balances = artifacts.require("Balances")

module.exports = global.omitMigration(__filename, (deployer, network) => {
  return deployer.deploy(
    LiquidityProvider,
    Scrinium.address,
    Balances.address,
  ).then(async (liquidityProviderInstance) => {

    if (deployer.network_id !== 1) {
      const scriniumInstance = await Scrinium.deployed()
      await scriniumInstance.mintToken(liquidityProviderInstance.address, 6000000 * 10 ** 8)
    }

    const balancesInstance = await Balances.deployed()
    await balancesInstance.setLiquidityProviderAddress(liquidityProviderInstance.address)

    await liquidityProviderInstance.addBalancesTransferAllowance()

    return Promise.resolve()
  }).then(() => {

    global.dataForWriting = {
      ...global.dataForWriting,

      liquidityProvider: {
        comment: __filename,
        abi: LiquidityProvider.abi,
        address: LiquidityProvider.address,
      },
    }

    return Promise.resolve()
  })
})
