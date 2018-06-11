const Subscriptions = artifacts.require("Subscriptions")

const DemoBalances = artifacts.require("DemoBalances")

module.exports = global.omitMigration(__filename, (deployer, network) => {
  return deployer.deploy(
    Subscriptions,
    DemoBalances.address
  ).then(() => {

    global.dataForWriting = {
      ...global.dataForWriting,

      subscriptions: {
        comment: __filename,
        abi: Subscriptions.abi,
        address: Subscriptions.address
      }
    }

    return Promise.resolve()
  })
})
