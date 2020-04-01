const Autumn = require("autumn-wizard");


var useWatch = true;



const baseDir = "./libs/universe/Ling/JFileUploader";
const w = new Autumn();
w.watch([`${baseDir}/src/**/*.{js,scss}`], () => {


    const useSourceMap = true; // set this to false in production

    //----------------------------------------
    // CSS
    //----------------------------------------
    var cssFiles = [
        `${baseDir}/src/scss/**/*.scss`,
    ];
    w.forEach(cssFiles, srcPath => {
        var dstPath = w.replace('/src/', '/dist/', srcPath);
        dstPath = w.replace('scss', 'css', dstPath);
        dstPath = w.replace('.css', '.min.css', dstPath);
        w.minify(srcPath, dstPath, {
            sourceMap: useSourceMap,
        });
    });


    //----------------------------------------
    // BUNDLE THE JS MODULES
    //----------------------------------------
    var srcPath = `${baseDir}/src/js/main.js`;
    var dstPath = `${baseDir}/dist/js/main.min.js`;
    w.bundle(srcPath, dstPath, {
        debug: useSourceMap,
    });

    var themeFiles = [
        `${baseDir}/src/js/views/**/*.js`,
    ];
    w.forEach(themeFiles, srcPath => {
        dstPath = w.replace("/src/", '/dist/', srcPath);
        dstPath = w.replace(".js", '.min.js', dstPath);
        w.bundle(srcPath, dstPath, {
            debug: useSourceMap,
        });
    });



    //----------------------------------------
    // MOVE THE LANG FILES (and uglify them)
    //----------------------------------------
    var otherFiles = [
        `${baseDir}/src/js/lang/**/*.js`,
    ];
    w.forEach(otherFiles, srcPath => {
        dstPath = w.replace("/src/", '/dist/', srcPath);
        dstPath = w.replace(".js", '.min.js', dstPath);
        w.uglify(srcPath, dstPath, {
            sourceMap: useSourceMap
        });
    });


    //----------------------------------------
    // CREATE THE HANDLEBARS TEMPLATES
    //----------------------------------------
    var tplPaths = [
        `${baseDir}/src/js/templates/**/*.hbs`,
    ];
    dstPath = `${baseDir}/dist/js/templates/bundled.min.js`;
    w.precompile(tplPaths, dstPath);


    //----------------------------------------
    // RELOAD THE BROWSER (if we watch the files)
    //----------------------------------------
    if (true === useWatch) {
        w.browserReload("https://jindemo/test-fileuploader.php", {
            webRootDir: './',
            https: {
                key: '/usr/local/etc/httpd/ssl/jindemo.key',
                cert: '/usr/local/etc/httpd/ssl/jindemo.crt',
            }
        });
    }    


}, useWatch);