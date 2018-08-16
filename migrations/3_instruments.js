const Instruments = artifacts.require("Instruments")

module.exports = global.omitMigration(__filename, (deployer, network, accounts) => {
    deployer.deploy(
      Instruments
    ).then((instruments) => {

      const instrumentsData = require('../data/instruments.json')

      const txs = instrumentsData.map(
        ({ id, name, type }) => instruments.add(
          id,
          name,
          type,
          { from: accounts[0] }
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
