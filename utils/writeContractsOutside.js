const fs = require('fs')

/**
 * data = {
 *    <contractVariableName>: {
 *      <abi>,
 *      <address>
 *    }
 * }
 */

module.exports = (network, data) => {

  const resolved = Promise.resolve()

  let { CONTRACTS_OUTSIDE_PATHS: outsidePaths } = process.env

  if (typeof outsidePaths !== 'string') {
    return resolved
  }

  outsidePaths = outsidePaths
    .split(',')
    .filter(path => !! path.length)

  if ( ! outsidePaths.length) {
    return resolved
  }

  for (let path of outsidePaths) {
    try {

      let pathType = null
      const pathData = path.split(':')

      if (pathData.length > 1) {
        pathType = 'module'
        path = pathData[1]
      } else {
        pathType = 'json'
        path = pathData[0]
      }

      if (
        ! ['module', 'json'].includes(pathType) ||
        ! fs.existsSync(path)
      ) {
        continue
      }

      let existingData = {}

      switch(pathType) {
        case 'module':
          existingData = require(path)
        break;
        case 'json':
          existingData = JSON.parse(fs.readFileSync(path, 'utf-8'))
        break;
        default:continue;
      }

      const dataForWrite = JSON.stringify({
        ...existingData,
        ...data
      }, null, '\t')

      fs.writeFileSync(
        path,
        pathType === 'module' ? `module.exports = ${dataForWrite};` : dataForWrite
      )

    } catch (error) {
      console.error(error)
    }
  }

  return Promise.resolve()
}