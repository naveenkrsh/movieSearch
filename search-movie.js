var Curl = require('node-libcurl').Curl;
var htmlparser = require("htmlparser2");
var _ = require('lodash');
var path = require('path')

var resultSet = [];

var counter = 0;
var readcounter = 0;

var operationArr = [];

function getHtml(URL) {

    var movie = MOVIE;
    counter++;
    readcounter++;
    console.log("Searching " + movie + " in ....");
    console.log(URL);
    //console.log(readcounter);

    var curl = new Curl();
    curl.setOpt('URL', URL);
    curl.setOpt('FOLLOWLOCATION', true);

    curl.on('end', function (statusCode, body, headers) {

        // console.info( statusCode );
        // console.info( '---' );
        // console.info( body.length );
        // console.info( '---' );
        // console.info( this.getInfo( 'TOTAL_TIME' ) );

        //console.log(body);
        var handler = new htmlparser.DomHandler(function (error, dom) {
            //console.log(dom);
            var _html = _.find(dom, { 'type': 'tag', 'name': 'html' });
            var _body = _.find(_html.children, { 'type': 'tag', 'name': 'body' });
            var _pre = _.find(_body.children, { 'type': 'tag', 'name': 'pre' });
            var _a = _.filter(_pre.children, { 'type': 'tag', 'name': 'a' });

            //return recurSearch(_a, URL, movie);

            while (_a.length > 1) {
                var _check = _a.shift();
                var searchResult = searchMovie(_check, movie);

                if (searchResult == -3)
                    continue;
                if (searchResult == -2) {
                    //getHtml(URL + _check.attribs.href, movie);
                    pushOp(URL + _check.attribs.href, movie);
                }
                else if (searchResult != -1) {
                    console.log("Found");
                    console.log(URL + _check.attribs.href);
                    resultSet.push(URL + _check.attribs.href);
                    //break;
                }
            }
            //console.log(counter);
            next();
        });

        var parser = new htmlparser.Parser(handler);
        parser.write(body);
        parser.end();
        this.close();
    });

    curl.on('error', curl.close.bind(curl));
    curl.perform();


}

function searchMovie(_check, movie) {
    var _text = _.find(_check.children, { 'type': 'text' });

    if (_text.data === "../")
        return -3
    var _ext = path.extname(_check.attribs.href);

    if (!_ext) {
        return -2;
    }
    var word = movie.trim();
    var regex = new RegExp(word, "i");
    return _text.data.trim().search(regex);

}

function pushOp(url) {

    var obj = {
        fn: getHtml,
        ar1: url

    }

    operationArr.push(obj);
}

function next() {
    if (operationArr.length > 0) {
        var operation = operationArr.shift();
        operation.fn(operation.ar1);
    }
    else {
        console.log("=========Search End======");
        console.log();
        if (resultSet.length > 0)
            console.log(resultSet.length + " match found");
        else
            console.log("No match found");
        console.log();
        resultSet.forEach(function (item) {
            console.log(item);
        });

        rl.close();
    }
}

pushOp('http://dl.tehmovies.com/94/');
var MOVIE = '';

//next();

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function start() {
    rl.question('Enter key word to search movie ', (answer) => {

        if(!verifyInput(answer))
            return;

        // TODO: Log the answer in a database
        //console.log(`Thank you for your valuable feedback: ${answer}`);
        MOVIE = answer;
        console.log("=========Search Start======");
        next();
        //rl.close();
    });
}
function verifyInput(answer) {
    if (!answer || answer.trim() == "") {
        start();
        return false;
    }
    return true;
}

start();