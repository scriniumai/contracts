const { basename } = require('path')
const debug = require('debug')('truffle_migrate')

let { TRUFFLE_MIGRATIONS_OMIT: omitMigrations } = process.env

omitMigrations = typeof omitMigrations === 'string'
  ? omitMigrations
    .split(',')
    .filter(migration => !! migration.length)
  : []

const matcher = new RegExp(`^${omitMigrations.join('|')}_[\\w_]+\.js$`, 'i')
const isMatched = migrationFile => matcher.test(basename(migrationFile))

module.exports = (migrationFile, migrationFn) => {
  if (isMatched(migrationFile)) {
    debug('Migration %s omitted...', migrationFile)
    return (deployer, network, accounts) => Promise.resolve()
  }

  return migrationFn
}
