const fs = require('fs');
const path = require('path');


const utils = {
  copy: function(srcPath, dstPath) {
    var dirPath = path.dirname(dstPath);
    this.mkDir(dirPath);
    fs.copyFileSync(srcPath, dstPath);
  },
  mkDir: function(dirPath) {
    fs.mkdirSync(dirPath, {
      recursive: true
    });
  },
  mkFile: function(filePath, data) {
    var dirPath = path.dirname(filePath);
    this.mkDir(dirPath);
    fs.writeFileSync(filePath, data);
  },
};



module.exports = utils;