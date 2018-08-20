module.exports = (deployer, network, accounts) => {

  try {
    global.config = require('../config/deploy')(network)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  global.writeGethClientPreload = require('../utils/writeGethClientPreload')
  global.writeContractsOutside = require('../utils/writeContractsOutside')
  global.omitMigration = require('../utils/omitMigration')

  global.dataForWrinting = {}

  return Promise.resolve()
}
