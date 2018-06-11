const DemoBalances = artifacts.require("DemoBalances")

const Scrinium = artifacts.require("Scrinium")

module.exports = global.omitMigration(__filename, (deployer, network) => {
  return deployer.deploy(
    DemoBalances,
    Scrinium.address
  ).then(() => {

    global.dataForWriting = {
      ...global.dataForWriting,

      demoBalances: {
        comment: __filename,
        abi: DemoBalances.abi,
        address: DemoBalances.address
      }
    }

    return Promise.resolve()
  });
})
