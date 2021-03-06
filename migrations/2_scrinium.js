const Scrinium = artifacts.require("Scrinium")

// FIXME: Need to omit this deploy in MAINNET and use Scrinium address from config instead
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
