/* global describe, it */
'use strict';

var expect = require('chai').expect;
var parse = require('../lib/parse');

describe('parse', function () {
  it('parses *.xlsx to JSON', function(done) {
    var fixturesPath = __dirname + '/fixtures';
    var output = require(fixturesPath + '/parse-output.json');
    parse({path: fixturesPath + '/parse-input.xlsx'}, function(error, doc) {
      delete doc.importedAt;
      delete output.importedAt;
      expect(JSON.stringify(doc, null, 2)).to.equal(JSON.stringify(output, null, 2));
      done(error);
    });
  });
});
