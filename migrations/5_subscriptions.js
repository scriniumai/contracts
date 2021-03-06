const Subscriptions = artifacts.require("Subscriptions")

const Balances = artifacts.require("Balances")

module.exports = global.omitMigration(__filename, (deployer, network) => {
  return deployer.deploy(
    Subscriptions,
    Balances.address,
  ).then(() => {

    global.dataForWriting = {
      ...global.dataForWriting,

      subscriptions: {
        comment: __filename,
        abi: Subscriptions.abi,
        address: Subscriptions.address,
      },
    }

    return Promise.resolve()
  })
})
