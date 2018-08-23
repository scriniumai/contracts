const Balances = artifacts.require("Balances")

const Scrinium = artifacts.require("Scrinium")

module.exports = global.omitMigration(__filename, (deployer, network) => {
  return deployer.deploy(
    Balances,
    Scrinium.address,
  ).then(() => {

    global.dataForWriting = {
      ...global.dataForWriting,

      balances: {
        comment: __filename,
        abi: Balances.abi,
        address: Balances.address,
      },
    }

    return Promise.resolve()
  })
})
