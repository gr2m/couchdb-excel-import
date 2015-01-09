var fs = require('fs');
var basename = require('path').basename;
var XLSX = require('xlsx');

module.exports = function(state, callback) {
  var file = XLSX.readFile(state.path);
  var sheetNames = file.SheetNames;

  var doc = {};
  doc.fileName = basename(state.path);
  doc.createdAt = file.Props.CreatedDate.toJSON();
  doc.updatedAt = file.Props.ModifiedDate.toJSON();
  doc.importedAt = new Date().toJSON();
  doc.size = fs.statSync(state.path).size;

  doc.sheets = sheetNames.map(function (sheetName) {
    var sheet = file.Sheets[sheetName];
    var data = XLSX.utils.sheet_to_json(sheet); // jshint ignore:line
    var headers = data.length ? Object.keys(data) : [];
    return {
      name: sheetName,
      headers: headers,
      rows: data
    };
  });

  callback(null, doc);
};
