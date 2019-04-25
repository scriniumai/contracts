const Assets = artifacts.require("shared/Assets")
const Instruments = artifacts.require("Instruments")

module.exports = global.omitMigration(__filename, (deployer, network, accounts) => {
  deployer.deploy(
    Assets
  ).then(() => {
    deployer.link(Assets, Instruments)

    return deployer.deploy(
      Instruments
    ).then((instruments) => {

      const instrumentsData = require('../data/instruments.json')

      const txs = instrumentsData.map(
        ({ id, name, type }) => instruments.add(
          id,
          web3.utils.hexToBytes(web3.utils.utf8ToHex(name)),
          type,
        )
      )

      return Promise.all(txs)
    }).then(() => {

      global.dataForWriting = {
        ...global.dataForWriting,

        instruments: {
          comment: __filename,
          abi: Instruments.abi,
          address: Instruments.address
        }
      }

      return Promise.resolve()
    })
  })
})
