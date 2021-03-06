var Promise = require('bluebird');
var express = require('express');
var bodyParser = require('body-parser');
var exec = require('./server/helper/execPromise');
// var exec = require('child_process').exec;
var handlebars = require('express-handlebars')
  .create({ defaultLayout: 'main' });

var app = express();

//setup handlebars templating engine
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

//setup body-parser to get data from forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('home');
});

app.post('/download', function(req, res){
  var url = req.body.url;
  var filename = '';
  var filename_terminal = '';
  var musicFilepath = '';
  var musicFilename = '';
  var musicFilename_terminal = '';

  exec('youtube-dl --get-filename ' + url).then(function (stdout) {
    filename = stdout.replace('\n', '');
    filename_terminal = filename.replace(/ /g, '\\ ')
                                .replace(/\'/g, '\\\'')
                                .replace(/\(/g, '\\(')
                                .replace(/\)/g, '\\)')
                                .replace(/\&/g, '\\&');
    return exec('youtube-dl ' + url);
  }).then(function(stdout){
    filepath = __dirname + '/' + filename;
    musicFilename = filename.split('.')[0] + '.mp3';
    musicFilename_terminal = musicFilename.replace('\n', '')
                                          .replace(/ /g, '\\ ')
                                          .replace(/\'/g, '\\\'')
                                          .replace(/\(/g, '\\(')
                                          .replace(/\)/g, '\\)')
                                          .replace(/\&/g, '\\&');
    musicFilepath = __dirname + '/' + musicFilename;
    return exec('ffmpeg -i ' + filename_terminal + ' -vn ' + musicFilename_terminal);
  }).then(function(stdout){
    return new Promise(function(resolve, reject){
      res.download(musicFilepath, musicFilename, function(error){
        if(error) {
          return reject(error);
        }
        resolve();
      });
    });
  }).then(function(stdout){
    return exec('rm -rf ' + filename_terminal + ' ' + musicFilename_terminal);
  }).catch(function(error){
    throw error;
  });
});

app.use(function(req, res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' +
              app.get('port') +
              '\npress Ctrl-C to terminate');
});
