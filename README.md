# couchdb-excel-import

> Import Excel Sheets to CouchDB

[![Build Status](https://travis-ci.org/gr2m/couchdb-excel-import.png?branch=master)](https://travis-ci.org/gr2m/couchdb-excel-import/)

`couchdb-excel-import` imports Excel files (*.xls, *.xslx) into CouchDB
documents, and transforms the sheets into JSON.

## Usage

```
couchdb-excel-import path/to/file.xls \
  --target http://user:password@couchdbhost.com/targetdb
```

## License

MIT
