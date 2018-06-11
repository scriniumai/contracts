const Scrinium = artifacts.require("Scrinium")

module.exports = global.omitMigration(__filename, (deployer, network) => {
  return deployer.deploy(
    Scrinium
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
