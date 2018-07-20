const fs = require('fs')
const YAML = require('yamljs')


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

  let { TRUFFLE_ARTIFACTS_OUTSIDE_PATHS: outsidePaths } = process.env

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
        pathType = pathData[0]
        path = pathData[1]
      } else {
        pathType = 'json'
        path = pathData[0]
      }

      if (! fs.existsSync(path)) {
        continue
      }

      let existingData = null
      let dataForWrite = null

      switch(pathType) {
        case 'module':
          existingData = require(path)
          dataForWrite = `
            module.exports = ${JSON.stringify({ ...existingData, ...data }, null, '\t')};
          `
        break;
        case 'json':
          existingData = JSON.parse(fs.readFileSync(path, 'utf-8'))
          dataForWrite = JSON.stringify({ ...existingData, ...data }, null, '\t')
        break;
        case 'yaml':
          existingData = YAML.parse(fs.readFileSync(path, 'utf-8'))
          dataForWrite = YAML.stringify({ ...existingData, ...data })
        break;
        default:continue;
      }

      fs.writeFileSync(path, dataForWrite)

    } catch (error) {
      console.error(error)
    }
  }

  return Promise.resolve()
}
