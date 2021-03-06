var fs = require('fs'),
    resolve = require('path').resolve.bind(null, __dirname),
    defaultOptions = process.env.FEST_COMPILE ? JSON.parse(process.env.FEST_COMPILE) : {};
    // jasmine = require('jasmine-node');

function extend(dest){
    Array.prototype.slice.call(arguments, 1).forEach(function (src) {
        for (var i in src) {
            dest[i] = src[i];
        }
    });
    return dest;
}

var errors = [],
    __fest_error =  function (err) { errors.push(err); },
    compileFn = (new Function(
        '__fest_error', '__dirname', '__read_file',
        fs.readFileSync(resolve('../lib/compile.js')) + '; return compile;'
    ))(
        __fest_error, resolve('../lib'), fs.readFileSync
    );

exports.render = function (file, json, options, thisArg) {
    errors = [];
    var source = compileFn(resolve(file), extend(options || {}, defaultOptions)),
        template = (new Function('__fest_error', 'return ' + source))(__fest_error);
    return {
        contents: template.call(thisArg, json),
        errors: errors
    };
};

exports.compile = function (file, options) {
    errors = [];
    var source = compileFn(resolve(file), extend(options || {}, defaultOptions));
    return {
        contents: source,
        errors: errors
    };
};

exports.setupMatchers = function () {
    this.addMatchers({
        toThrowMatch: function (expected) {
            var actual = this.actual,
                notText = this.isNot ? ' not' : '';
            try {
                actual();
            } catch (e) {
                this.message = function () {
                    return 'Expected function' + notText + ' to throw ' + expected + ', but it threw ' + e;
                };
                return expected.test(e);
            }
            this.message = function () {
                return 'Expected function' + notText + ' to throw ' + expected;
            };
            return false;
        },
        toMatchEach: function (expected) {
            if (this.actual.length !== expected.length) {
                return false;
            }
            for (var i = this.actual.length - 1; i; i--) {
                if (!expected[i].test(this.actual[i])) {
                    return false;
                }
            }
            return true;
        }
    });
};