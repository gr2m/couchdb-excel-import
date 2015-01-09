#!/usr/bin/env node

var log = require('verbalize');
var parse = require('../lib/parse');
var importDoc = require('../lib/import');
var argv = require('minimist')(process.argv.slice(2));
var args = {
  path: argv._[0],
  targetDbUrlWithCredentials: argv.target,
  log: log
};

log.runner = 'couchdb-excel-import';

parse(args, function (error, doc) {
  if (error) throw error;

  importDoc(args, doc, function(error) {
    if (error) {
      return log.error(error);
    }

    log.info('Done.');
  });
});
