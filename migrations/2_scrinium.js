const Scrinium = artifacts.require("Scrinium")

module.exports = global.omitMigration(__filename, (deployer, network) => {
  return deployer.deploy(
    Scrinium,
    deployer.network_id,
  ).then(() => {

    global.dataForWriting = {
      ...global.dataForWriting,

      scrinium: {
        comment: __filename,
        abi: Scrinium.abi,
        address: Scrinium.address
      }
    }

    return Promise.resolve()
  })
})
