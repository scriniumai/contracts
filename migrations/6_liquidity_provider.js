const LiquidityProvider = artifacts.require("LiquidityProvider")

const Scrinium = artifacts.require("Scrinium")
const Balances = artifacts.require("Balances")

module.exports = global.omitMigration(__filename, (deployer, network, accounts) => {

  const { config } = global

  return deployer.deploy(
    LiquidityProvider,
    Scrinium.address,
    Balances.address,

    config.commissionsAddress,
  ).then(async (liquidityProviderInstance) => {

    // ? FIXME: need to transfer initial balance to LiquidityProvider

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
