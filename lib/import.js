var async = require('async');
var nano = require('nano');
var url = require('url');
var util = require('util');
var _ = require('lodash');

// var helpers = require('./helpers');

var exports = module.exports = matchExisting;

// Import people into target CouchDB
//
//     matchExisting({
//       log: logger,
//       targetDbUrlWithCredentials: 'https://user:pass@mycouchdb.com/target_db_name'
//     }, people, callback)
//
function matchExisting(state, doc, callback) {
  var operations = [
    function (startWaterfallCallback) {
      startWaterfallCallback(null, doc);
    },
    exports.createDatabaseIfMissing.bind(null, state),
    exports.createViewIfMissing.bind(null, state),
    exports.matchExisting.bind(null, state),
    exports.writeDoc.bind(null, state),
  ];

  async.waterfall(operations, callback);
}

//
exports.createDatabaseIfMissing = function(state, doc, callback) {
  var dbName = url.parse(state.targetDbUrlWithCredentials).pathname.substr(1);
  var database = exports.getCouchDbApi(state.targetDbUrlWithCredentials);
  database.get(dbName, function(error) {
    if (error) {
      if (error.statusCode === 404) {
        state.log.info('creating %s database ...', state.targetDbUrl);
        database.create(dbName, function(error) {
          if (error) {
            throw new Error(util.format('Could not create %s database', state.targetDbUrl));
          }

          callback(null, doc);
        });
        return;
      } else {
        console.log(error);
        throw new Error('Could not connect to target database');
      }
    }

    callback(null, doc);
  });
};


//
var COUCHDB_VIEW = {
  _id     : '_design/match',
  language: 'javascript',
  version : '1.0.0',
  views   : {
    by_name_and_size: {
      map: 'function(doc) {\n' +
           '  emit([doc.fileName, doc.size], doc.importedAt)\n' +
           '}'
    }
  }
};


exports.createViewIfMissing = function(state, doc, callback) {
  var targetDb = exports.getCouchDbDatabaseApi(state.targetDbUrlWithCredentials);
  targetDb.get(COUCHDB_VIEW._id, function(error, design) {
    if (error) {

      if (error.statusCode === 404) {

        state.log.info('Creating `%s` view ...', COUCHDB_VIEW._id);
        targetDb.insert(COUCHDB_VIEW, function(error) {
          if (error) {
            state.log.error(error);
            throw new Error(util.format('Could not create %s view', COUCHDB_VIEW._id));
          }

          callback(null, doc);
        });
        return;
      } else {
        console.log(error);
        throw new Error('Could not connect to target database');
      }
    }

    // check if it is the same view, if not, update it
    if (design) {
      design.views = design.views || {};
      var name = 'by_name_and_size';
      var view = COUCHDB_VIEW.views[name];

      if (_.isEmpty(design.views[name]) || !_.isEqual(design.views[name], view)) {
        design.views[name] = view;

        state.log.info('Updating `%s` view ...', COUCHDB_VIEW._id);
        targetDb.insert(design, function(error) {
          if (error) {
            state.log.error(error);
            throw new Error(util.format('Could not update %s view', COUCHDB_VIEW._id));
          }

          callback(null, doc);
        });
        return;
      }

    }

    callback(null, doc);
  });
};

//
// Matches existing people in the target database
// with new people coming from the source. If matched, the existing person
// gets extended with new people properties, so the CouchDB
// document can be updated.
//
// If doReplaceExistingRecords is true, matched records that don't have
// changes are imported anyway, otherwise they get ignored.
//
exports.matchExisting = function(state, doc, callback) {
  var key = [doc.fileName, doc.size];
  var targetDb = exports.getCouchDbDatabaseApi(state.targetDbUrlWithCredentials);

  targetDb.view('match', 'by_name_and_size', {keys: [key]}, function(err, result) {

    if (err) {
      return callback(err);
    }

    if (result.rows.length > 0) {
      return callback(util.format('File has already been imported at %s.', result.rows[0].value));
    }

    callback(null, doc);
  });
};


//
// creates or updates people in CouchDB in batches
//
exports.writeDoc = function(state, doc, callback) {
  var database = exports.getCouchDbDatabaseApi(state.targetDbUrlWithCredentials);

  database.insert(doc, function(error, result) {
    if (error) return callback(error);

    state.log.info('%s imported into %s', doc.fileName, result.id);
    callback();
  });
};

// PRIVATE
exports.getCouchDbApi = function(targetDbUrlWithCredentials) {
  var urlParts = url.parse(targetDbUrlWithCredentials);
  var couchDbUrl = targetDbUrlWithCredentials.replace(urlParts.pathname, '');
  return nano(couchDbUrl).db;
};
exports.getCouchDbDatabaseApi = function(targetDbUrlWithCredentials) {
  return nano(targetDbUrlWithCredentials);
};
