const http = require('http');
const fs = require('fs');
const path = require('path');
const util = require('util');
const mime = require('mime');
const hostname = '127.0.0.1';
const port = 3000;
const dirPath = path.resolve('archive');
// convert into Promise version
const readDir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);


// return obj with files
async function getFiles(dirPath, treeFiles = {}) {

  dirPath = path.resolve(dirPath);

  // get all files and dir in dirPath, return massive
  let files = await readDir(dirPath);

  for (let file of files) {

    let filePath = path.join(dirPath, file);
    let stats = await stat(filePath);

    if(stats.isDirectory()){
      treeFiles[file] = {};
      await getFiles(filePath, treeFiles[file]);
    }

    if(stats.isFile()){
      treeFiles[file] = filePath;
    }

  }

  return treeFiles;

}

// downloads file
function downloads(files, url, res) {
  for(let key in files) {
    if(files.hasOwnProperty(key)) {

      // if string
      if (typeof files[key] === 'string') {

        if (files[key] === url) {

          let filePath = files[key];
          let fileName = path.parse(filePath).base;
          console.log(filePath);
          console.log(fileName);
          res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
          res.setHeader('Content-type', mime.lookup(filePath));

          let fileStream = fs.createReadStream(filePath);
          fileStream.pipe(res);
        }
      }

      //if obj
      if (typeof files[key] === 'object') {
        downloads(files[key], url, res);
      }
    }
  }
}

// server
const server = http.createServer((req, res) => {

  switch (req.method + ' ' + req.url){
    case 'GET /':
      fs.readFile(__dirname + '/index.html', (err, data) => {
          if(err) throw err;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(data);
      });
      break;

    case 'GET /file-manager':

      getFiles(dirPath).then(files => {
        res.statusCode = 200;
        res.end(JSON.stringify(files));
      }).catch((error) => {
        res.statusCode = 500;
        res.end(JSON.stringify(error));
      });
      break;

    // default:
    //   res.end('Page not found')
  }

  if(req.method === 'GET') {

    getFiles(dirPath).then(files => {

      downloads(files, req.url, res);

    }).catch((error) => {
      res.statusCode = 500;
      res.end(JSON.stringify(error));
    });
  }

});


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});