Autumn wizard
============
2020-03-30 -> 2020-04-01


Autumn is a tool to help creating some automation tasks.


Install
-----------

```bash
npm i -D autumn-wizard
```




Why autumn?
-----
I was using gulp4, but then I was tired of having error messages that I didn't understand, so I decided to make my own "gulp" from the ground up.

I thought it might be worth sharing, just in case you use the same web development tools than I.

I use babel for es6 things (classes, async/await, es6 syntax).
I also use the bundlers/minifiers to create/bundle the minified versions of my css/scss (I use sass) and js files.
I also use handlebars, so Autumn precompiles the templates for me too.





Autumn setup
-----------
2020-03-31

In autumn, a task is basically a file. We manage different tasks by creating different files, and call them via the **npm run** command.

So for instance if you just want to minify your css, you create your file **minify.js** (for instance) and put the code in it (follow the tutorial below to know what code exactly to put inside that file),
then add the minify script in your **package.json**:

```json
{
  // ...
  "scripts": {
    "minify": "minify.js"
  },
  // ...
}
```

Now to trigger your minify task, just do:

```bash
npm run minify
```

So now you can create any task you want, simple or complex, it's up to you.


Note: autumn code is very transparent and simple (just have a look in **./node_modules/autumn/index.js**) so don't hesitate to tweak it.




Tutorial
============
2020-03-31

- [Minify css files](#minify-css-files)
- [Uglify js files](#uglify-js-files)
- [Bundle (and uglify) js files](#bundle-and-uglify-js-files)  
- [Precompile the handlebars templates](#precompile-the-handlebars-templates)  
- [Watching the files](#watching-the-files)  
- [A full example](#a-full-example)  




Minify css files
---------------
2020-03-31

We can use the **minify** method to create a minified css file from a source.

In the following example, we loop through all the **css/scss** files inside the **./src/css** directory,
and move them to the **./dist/css** directory. We also add the **.min** suffix before the extension,
and create a sourceMap for each of them (which is useful to debug css).


To run this script, read the setup section at the top of this document.


```js
const Autumn = require("autumn");
var cssFiles = [
    './src/css/**/*.{css,scss}', // glob paths are allowed, for more details see the node-glob package (https://github.com/isaacs/node-glob).
];
const w = new Autumn();
w.forEach(cssFiles, srcPath => {
    var dstPath = w.replace('/src/', '/dist/', srcPath);
    dstPath = w.replace('.scss', '.css', dstPath);
    dstPath = w.replace('.css', '.min.css', dstPath);
    w.minify(srcPath, dstPath, {
        sourceMap: true, // if you don't want a sourceMap, set this to false
    });
});

```

So for instance, if the filesystem looks like this before you run this script:

```text
- src/
----- css/
--------- themes/
------------- theme-one.scss
--------- mystyle.scss
--------- style.css
```

Then after running it you would have this structure:

```text
- dist/
----- css/
--------- themes/
------------- theme-one.min.css
------------- theme-one.min.css.map
--------- mystyle.min.css
--------- mystyle.min.css.map
--------- style.min.css
--------- style.min.css.map
- src/
----- css/
--------- themes/
------------- theme-one.scss
--------- mystyle.scss
--------- style.css
```


Uglify js files
---------------
2020-03-31

We can use the **uglify** method to create an uglified js file from a source.

In the following example, we loop through all the **js** files inside the **./js/pluginABC/src/themes** directory,
and move them to the **./js/pluginABC/dist/themes** directory. We also add the **.min** suffix before the extension.
In this case, we don't generate sourceMap, but set the sourceMap option to true if you need to do so.

To run this script, read the setup section at the top of this document.


```js
const Autumn = require("autumn");


var jsFiles = [
    './js/pluginABC/src/themes/**/*.js',
];

const w = new Autumn();
w.forEach(jsFiles, srcPath => {
    var dstPath = w.replace("/src/", '/dist/', srcPath);
    dstPath = w.replace(".js", '.min.js', dstPath);
    w.uglify(srcPath, dstPath, {sourceMap: false});
});

```

So for instance, if the filesystem looks like this before you run this script:

```text
- js/
----- pluginABC/
--------- src/
------------- themes/
----------------- theme-one.js
----------------- theme-two.js
```

Then after running it you would have this structure:

```text
- js/
----- pluginABC/
--------- dist/
------------- themes/
----------------- theme-one.min.js
----------------- theme-two.min.js
--------- src/
------------- themes/
----------------- theme-one.js
----------------- theme-two.js
```


Bundle (and uglify) js files
------------
2020-03-31

We can use the **bundle** method to bundle our files.
This method is quite powerful.

If you know babel, browserify and uglify, then that's what this command uses under the hood.
If you don't know them, basically what this method do is:

- parse your source file and collect all its dependencies (using require and/or es6 import) into one bundle file
- then it takes the bundled file and convert all the es6 syntax into a es5 version, so that all browsers can understand it (or at least most of them)
- then by default it uglifies the bundle  



In the following example, I have a plugin ABC with a **main.js** script, autumn will do all the aforementioned steps
and put the bundle at **./js/pluginABC/dist/bundle.min.js**.

To run this script, read the setup section at the top of this document.


```js
const Autumn = require("autumn");


var srcPath = "./js/pluginABC/src/main.js";
var dstPath = "./js/pluginABC/dist/bundle.min.js";

const w = new Autumn();
w.bundle(srcPath, dstPath, {
    debug: false, // with debug false, we get uglified sources and source maps of bundled sources (i.e. not the original, but still helpful)
    // debug: true, // with debug true, we get original sources and source maps (easier to debug)
});
```




Precompile the handlebars templates  
----------------
2020-04-01

We can use the **precompile** method to create and bundle handlebars templates.


In the following example, we ask Autumn to bundle all files with the **.hbs** extension into one bundle.


To run this script, read the setup section at the top of this document.


```js
const Autumn = require("autumn");


var tplPaths = [
    "./src/templates/**/*.hbs",
];
var dstPath = "./dist/templates/bundled.js";


const w = new Autumn();
w.precompile(tplPaths, dstPath);
```

So for instance, if the filesystem looks like this before you run this script:

```text
- src/
----- templates/
--------- example.hbs
--------- example2.hbs
```

Then after running it you would have this structure:

```text
- dist/
----- templates/
--------- bundled.js
- src/
----- templates/
--------- example.hbs
--------- example2.hbs
```

Now as a reminder, you can use it like this in an html page for instance:

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
    <meta charset="utf-8">
    <title></title>
    <script src="https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.runtime.js"></script>
    <script src="/dist/templates/bundled.js"></script>
</head>


<body>
<script>
    var template = Handlebars.templates.example;
    var template2 = Handlebars.templates.example2;
    console.log(template({doesWhat: 'rocks!'}));
    console.log(template2({doesWhat: 'yeah'}));
</script>
</body>

</html>

```

Watching the files
----------------
2020-04-01

We can use the **watch** method to monitor changes in files and trigger our task automatically.


In the following example, **watch** all the files in the **./src** directory.
So whenever we make a change in one of those files, the callback is triggered.

We can put any Autumn task inside the watch callback.


To run this script, read the setup section at the top of this document.


```js
const Autumn = require("autumn");


var files = [
    "./src/**",
];

const w = new Autumn();
w.watch(files, () => {
    console.log("Insert your task(s) here...");
});
```



Note: The **watch** method accepts a third argument called **enable**, which you can set to false to disable the watching.
With this option, you can change rapidly between watching and not watching your files, without to have to remove the watch wrapper.

```js

w.watch(files, () => {
    console.log("Insert your task(s) here...");
}, false); // now with this flag set to false, the watch method will do nothing but execute the callback once (i.e. it will not watch for changes in files);

```



A full example
------------
2020-04-01

Now let's use **Autumn** to create a big task that combines all we've seen so far.
If you have a doubt about how it works, first check this tutorial again, everything used here was explained earlier
in this tutorial.



Ok, so in this example my file structure is this:

```text
- lib/
----- pluginABC/
--------- src/
------------- css/
----------------- themes/
--------------------- theme-one.scss
--------------------- theme-two.scss
----------------- pluginABC.scss
------------- modules/
----------------- CoffeeMachine.js
----------------- Grain.js
------------- themes/
----------------- theme-one.js
----------------- theme-two.js
------------- main.js
------------- templates/
----------------- example.hbs
----------------- example2.hbs

```

So I'm working on that **pluginABC** plugin, and the **main.js** script uses the files in the **modules** directory.
The files in the **themes** directory need to be exported, but are not directly used by my module (they are dynamic dependencies).
The **templates** directory contains the handlebars templates.

All the css files are located in the css directory in this case.


So my goal is to be able to call this html:

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">

<head>
    <meta charset="utf-8">
    <title></title>


    <link rel="stylesheet" href="/lib/pluginABC/dist/css/pluginABC.min.css">
    <link rel="stylesheet" href="/lib/pluginABC/dist/css/themes/theme-one.min.css">


    <script src="/lib/pluginABC/dist/bundled.min.js"></script>
    <script src="/lib/pluginABC/dist/themes/theme-one.min.js"></script>


    <script src="https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.runtime.js"></script>
    <script src="/lib/pluginABC/dist/templates/bundled.js"></script>

</head>


<body>
<script>
    var template = Handlebars.templates.example;
    var template2 = Handlebars.templates.example2;
    console.log(template({doesWhat: 'rocks!'}));
    console.log(template2({doesWhat: 'yeah'}));
</script>
</body>

</html>
```

So, let's create our autumn script:


```js
const Autumn = require("autumn");


var useWatch = false;


const w = new Autumn();
w.watch(["./lib/pluginABC/**"], () => {


    const useSourceMap = true; // set this to false in production

    //----------------------------------------
    // CSS
    //----------------------------------------
    var cssFiles = [
        './lib/pluginABC/src/css/**/*.{css,scss}',
    ];
    w.forEach(cssFiles, srcPath => {
        var dstPath = w.replace('/src/', '/dist/', srcPath);
        dstPath = w.replace('.scss', '.css', dstPath);
        dstPath = w.replace('.css', '.min.css', dstPath);
        w.minify(srcPath, dstPath, {
            sourceMap: useSourceMap,
        });
    });


    //----------------------------------------
    // BUNDLE THE JS MODULE
    //----------------------------------------
    var srcPath = "./lib/pluginABC/src/main.js";
    var dstPath = "./lib/pluginABC/dist/bundled.min.js";
    w.bundle(srcPath, dstPath, {
        debug: useSourceMap,
    });


    //----------------------------------------
    // MOVE THE THEME JS FILES (and uglify them)
    //----------------------------------------
    var themeFiles = [
        './lib/pluginABC/src/themes/**/*.js',
    ];
    w.forEach(themeFiles, srcPath => {
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
        "./lib/pluginABC/src/templates/**/*.hbs",
    ];
    dstPath = "./lib/pluginABC/dist/templates/bundled.js";
    w.precompile(tplPaths, dstPath);


}, useWatch);

```


And voilà!

Hope you enjoyed this tutorial.

Have fun with Autumn.
