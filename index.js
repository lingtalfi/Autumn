// node native
const fs = require('fs');
const path = require('path');
const util = require('util');
const stream = require('stream');
const {execSync} = require('child_process');


// autumn things
const utils = require('autumn-wizard/utils/utils.js');


// third-party plugins
const glob = require('glob');
const chalk = require('chalk');
const CleanCSS = require('clean-css');
const tmp = require('tmp');
const extend = require('node.extend');
const sass = require('node-sass');
const browserify = require("browserify");
const babelify = require("babelify");
const UglifyJS = require("uglify-js");
const Handlebars = require("handlebars"); // the cli is required so I let this here just to be remind me that it's a dependency.
const browserSync = require("browser-sync");


// -----------------------------
// CLASS
// -----------------------------
/**
 * An automation class helper.
 * In autumn, there is no task like in gulp.
 * If you want to have different "tasks", you create
 * a new autumn file per task, and call that task with either node or npm run.
 *
 *
 */
class Autumn {
    constructor(options) {
        this.options = extend({
            debug: false,
        }, options);

        this.browserSyncInitialized = false;
    }


    /**
     * Will monitor changes for the given files, and if one of them is changed, then the callback is executed.
     * If enable is false, the watch method does nothing. This let you wrap your code with the watch method,
     * and disable it without having to reformat your code.
     */
    watch(files, cb, enable) {
        this._ifDebug(`Autumn.watch`, ...arguments);

        if (false !== enable) {
            // https://stackoverflow.com/questions/12978924/fs-watch-fired-twice-when-i-change-the-watched-file
            var fsTimeout;

            files.forEach(filePath => {
                glob(filePath, (err, files) => {
                    // console.log("glob", filePath, err, files);
                    files.forEach(fPath => {
                        let stat = fs.lstatSync(fPath);
                        if (true === stat.isFile()) {
                            // console.log(fPath);
                            fs.watch(fPath, (eventType, fileName) => {
                                if (!fsTimeout) {
                                    // console.log(`watch detected with ${eventType} and ${fileName}, ${fPath}`);
                                    cb();
                                    fsTimeout = setTimeout(function () {
                                        fsTimeout = null;
                                    }, 3000) // give 3 seconds for multiple events
                                }
                            });
                        }
                    });
                });
            });
        }

        cb();
    }


    /**
     * Minifies your css/scss srcPath and writes the result to dstPath.
     *
     *
     * The minifying depends on the file extension of the srcPath:
     * - .css: the css minifier (clean-css package)
     * - .scss: the sass minifier (node-sass package)
     *
     *
     * Options:
     * - sourceMap: bool=false, whether to create a source map
     */
    minify(srcPath, dstPath, options) {
        this._ifDebug(`Autumn.minify`, ...arguments);

        options = extend({
            sourceMap: false,
        }, options);


        var fileExtension = path.extname(srcPath);
        switch (fileExtension) {
            case ".css":
                this._minifyCss(srcPath, dstPath, options);
                break;
            case ".scss":
                this._minifySass(srcPath, dstPath, options);
                break;
            default:
                this._error(`Autumn.minify: extension not implemented yet: ${fileExtension}`);
                break;
        }
    }


    /**
     * Uglifies your js srcPath and writes the result to dstPath.
     *
     * Options:
     * - sourceMap: bool=false, whether to create a source map
     */
    uglify(srcPath, dstPath, options) {
        this._ifDebug(`Autumn.uglify`, ...arguments);

        options = extend({
            sourceMap: false,
        }, options);


        var mapPath;


        utils.mkDir(path.dirname(dstPath));


        var uglifyOptions = {};
        if (true === options.sourceMap) {
            var fileName = path.basename(dstPath);
            mapPath = dstPath + ".map";
            uglifyOptions.sourceMap = {
                filename: fileName,
                url: path.basename(mapPath),
                includeSources: true,
            };
        }
        var bundleContent = fs.readFileSync(srcPath, {
            encoding: "utf8",
        });
        var result = UglifyJS.minify(bundleContent, uglifyOptions);
        if (result.error) {
            throw result.error;
        } else {
            utils.mkFile(dstPath, result.code);
            if (true === options.sourceMap) {
                utils.mkFile(mapPath, result.map);
            }
        }
    }


    /**
     * Copies the given srcPath to the dstPath.
     *
     */
    copy(srcPath, dstPath) {
        this._ifDebug(`Autumn.copy`, ...arguments);
        utils.copy(srcPath, dstPath);
    }


    /**
     * Precompiles the handlebars template(s) in mSrc and puts it/them in dstPath.
     *
     * - mSrc: string|array.
     *      If it's a string, it's the path to the template source.
     *      If it's an array, it's an array of the paths (or globs) to the template sources, those will be bundled (stacked one after each other) into the dstPath.
     *      The array notation might be useful to save some http requests, if your module uses multiple handlebar templates for instance.
     *
     */
    precompile(mSrc, dstPath) {

        this._ifDebug("Autumn.precompile", ...arguments);


        utils.mkDir(path.dirname(dstPath));

        if (false === Array.isArray(mSrc)) {
            mSrc = [mSrc];
        }

        var inputList = '';
        var extension = '';


        this.forEach(mSrc, srcPath => {
            extension = path.extname(srcPath).substr(1); // assuming all files have an extension, and the same extension
            inputList += ' ' + srcPath;
        });


        var cmd = `./node_modules/handlebars/bin/handlebars ${inputList} -e ${extension} -m -f ${dstPath}`;
        execSync(cmd);
    }


    /**
     * Bundles the given srcPath (including all the files that it references, being require or es6 imports),
     * babelifies it and bundles it in the dstPath.
     * By default, it also uglifies it.
     *
     * The options are:
     *
     * - debug: bool=false.
     *      If false (by default), the bundle file is uglified. Note: in that case the source maps are not very useful.
     *      If true, the bundle file is not uglified, but you have useful source maps to debug.
     *
     *
     */
    bundle(srcPath, dstPath, options) {
        this._ifDebug(`Autumn.bundle`, ...arguments);

        // simplifying options for the user for now
        options = extend({
            debug: false,
        }, options);


        /**
         * Real options below.
         * Note: if uglify is true, I couldn't manage to have an useful sourceMap that linked to the initial files before the bundling.
         * All I could do is get a source map to the bundled version of the source files, which I found useless.
         * So basically there are two modes: either you debug, in which case, you'll get the non-uglified version and will be able to
         * debug with useful source maps, or you don't debug (debug=false), in which case you have uglified files, but no useful source maps.
         *
         * Also, I noticed that uglify returns an error everytime I try to require something in the bundled js code, but only when the sourceMap
         * is not generated (if the sourceMap is generated then there is no error), so I decided to let the sourceMap be true all the time.
         */
        if (true === options.debug) {
            options = {
                sourceMap: true,
                uglify: false,
                uglifySourceMap: false,
            };
        } else {
            options = {
                sourceMap: false,
                uglify: true,
                uglifySourceMap: true,
            };
        }


        utils.mkDir(path.dirname(dstPath));

        var dstStream = fs.createWriteStream(dstPath);
        browserify({
            debug: options.sourceMap,
        })
            .transform(babelify, {
                presets: ["@babel/preset-env"],
                plugins: ["@babel/plugin-transform-runtime"],
            })
            .add(srcPath)
            .bundle()
            .on("error", function (err) {
                console.log("Error: " + err.message);
            }).pipe(dstStream);


        //----------------------------------------
        // UGLIFY
        //----------------------------------------
        if (true === options.uglify) {
            const finished = util.promisify(stream.finished);
            var promises = [finished(dstStream)];

            // if (true === options.sourceMap) {
            //     promises.push(finished(exorcistStream));
            // }

            Promise.all(promises).then(() => {
                try {
                    this.uglify(dstPath, dstPath, {
                        sourceMap: options.uglifySourceMap,
                    });
                } catch (e) {
                    console.log("uglify problem");
                    throw e;
                }
            }).catch(err => {
                console.error('Autumn.bundle: a stream failed.', err);
            });
        }

    }


    /**
     * Reloads the browser via browserSync.
     *
     * Note: if you are using https, you need to specify the https option.
     *
     *
     * Options:
     * - https: map containing the following entries:
     *      - key: the path to the private key
     *      - cert: the path to the certificate
     * - webRootDir: string = ".".
     *      The path to the web root directory.
     *      This script will create the browser-sync-client.js script (if not found) inside the web root dir.
     *      This script is required by the browser-sync package to perform correctly.
     *
     *
     */
    browserReload(url, options) {


        /**
         * Note: as for now I only use https, so this snippet only works with https,
         * not tested with regular http. (this might change in the future as I encounter
         * the need to test regular http files).
         */
        if (false === this.browserSyncInitialized) {

            var browserSyncOptions = {
                open: false,
                /**
                 Https setup
                 ------------
                 For https setup, don't forget to copy the /browser-sync/browser-sync-client.js code (video at 13:25)
                 https://www.youtube.com/watch?v=NDjE_LCHbuI&list=PLriKzYyLb28lp0z-OMB5EYh0OHaKe91RV&index=8
                 */
                proxy: url,
            };
            if (options.https) {
                browserSyncOptions.https = options.https;
            }

            var webRootDir = options.webRootDir || "./";
            var browserSyncClientPath = webRootDir + "browser-sync-client.js";
            if(false === fs.existsSync(browserSyncClientPath)){
                utils.copy("./node_modules/autumn-wizard/assets/browser-sync-client.js", browserSyncClientPath);
            }


            browserSync.init(browserSyncOptions);
            this.browserSyncInitialized = true;
        }


        browserSync.reload();
    }


    /**
     * Loops through the given files, and execute the given callback on each of them.
     *
     * Note: the files is an array of [glob paths](https://www.npmjs.com/package/glob#glob-primer).
     * So if your glob expands, each of the expansion will trigger the callback, as one would expect.
     */
    forEach(files, cb) {
        this._ifDebug(`Autumn.forEach`, ...arguments);

        files.forEach(filePath => {
            var files = glob.sync(filePath);
            files.forEach(fPath => {
                let stat = fs.lstatSync(fPath);
                if (true === stat.isFile()) {
                    cb(fPath);
                }
            });
        });
    }


    /**
     * Replaces all occurrences of the "search" by the "replace" in the "subject" (php style replace).
     */
    replace(search, replace, subject) {
        this._ifDebug(`Autumn.replace`, ...arguments);
        // https://stackoverflow.com/questions/17820039/js-replacing-all-occurrences-of-string-using-variable
        search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp(search, 'g');
        return subject.replace(re, replace);
    }

    // -----------------------------
    // PRIVATE METHODS
    // -----------------------------

    _ifDebug() {
        if (true === this.options.debug) {
            console.log(chalk.blue(...arguments));
            // console.log(chalk.blue(`Autumn debug ||`, ...arguments));
        }
    }

    _error(msg) {
        console.log(chalk.red(`Autumn error: ${msg}`));
        throw new Error(msg);
    };


    _minifyCss(srcPath, dstPath, options) {

        var useSourceMap = options.sourceMap;
        var minifyOptions = {};
        if (true === useSourceMap) {
            minifyOptions = {
                sourceMap: true,
                sourceMapInlineSources: true,
            };
        }

        var output = new CleanCSS(minifyOptions).minify([srcPath]);
        if (0 === output.errors.length) {

            var minifiedCss = output.styles;
            utils.mkFile(dstPath, minifiedCss);


            if (true === useSourceMap) {
                var sourceMapDst = dstPath + ".map";
                var sourceMap = output.sourceMap;
                utils.mkFile(sourceMapDst, sourceMap.toString());


                var sourceMapBaseName = path.basename(sourceMapDst);
                fs.appendFileSync(dstPath, `\n\n/*# sourceMappingURL=${sourceMapBaseName} */`);
            }

        } else {
            console.log(output);
            this._error("minify with CleanCSS: An error occurred with the output.")
        }
    }

    _minifySass(srcPath, dstPath, options) {

        var useSourceMap = options.sourceMap;

        var result = sass.renderSync({
            file: srcPath,
            sourceMap: true,
            omitSourceMapUrl: true,
            outFile: dstPath,
            outputStyle: 'compressed',
        });

        utils.mkFile(dstPath, result.css);

        if (true === useSourceMap) {
            var sourceMapDstPath = dstPath + ".map";
            utils.mkFile(sourceMapDstPath, result.map);

            var sourceMapBaseName = path.basename(sourceMapDstPath);
            fs.appendFileSync(dstPath, `\n\n/*# sourceMappingURL=${sourceMapBaseName} */`);
        }

    }

}


module.exports = Autumn;