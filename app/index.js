'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var banner = require('./lib/banner');
var chalk = require('chalk');
var fs = require('fs');
//var _ = require('lodash');


var NemoGenerator = yeoman.generators.Base.extend({
  init: function() {
    this.pkg = require('../package.json');
    this.options['skip-install'] = true;
    this.on('end', function() {
      if (!this.options['skip-install']) {
        this.installDependencies();
      }
    });
  },

  askFor: function() {
    var done = this.async();

    //Nemo banner
    banner();

    // replace it with a short and sweet description of your generator
    //this.log(chalk.magenta('You\'re using the fantastic Nemo generator.'));

    var prompts = [{
      type: 'input',
      name: 'baseDirOption',
      message: 'What is the desired base directory for your tests, starting from your app root directory?',
      default: "test/functional"
    }, {
      type: 'list',
      name: 'browserOption',
      message: 'Which browser do you want to use by default?',
      default: "phantomjs",
      "choices": ["phantomjs", "firefox", "chrome", "safari"]
    }, {
      type: 'input',
      name: 'seleniumJarPath',
      message: 'Where is your selenium standalone Jar file? (Windows user? Provide windows style path)',
      default: '/usr/local/bin/selenium-server-standalone.jar',
      when: function(answers) {
        var bo = answers.browserOption;
        return (bo === "firefox" || bo === "safari");
      },
      validate: function(jarPath) {
        var exists = fs.existsSync(jarPath);
        if (!exists) {
          return "Please make sure you've got a valid selenium standalone jar path specified! Please see https://github.com/paypal/nemo-docs/blob/master/driver-setup.md for more details.";
        }
        return true;
      }
    }, {
      type: 'list',
      name: 'customSpec',
      choices: ['Yes', 'No'],
      message: 'Would you like to add a custom spec for your application? It will test for presence of text on your landing page.'

    }, {
      type: 'input',
      name: 'targetBaseUrl',
      default: 'http://localhost:8000',
      message: 'What is the URL of your application landing page (where your first test should start)?',
      when: function(answers) {
        return (answers.customSpec === "Yes");
      }
    }, {
      type: 'input',
      name: 'landingPageLocator',
      default: '#wrapper',
      message: 'What CSS selctor will select distinct text on your landing page?',
      validate: function(landingPageSelector) {
        if (landingPageSelector !== "") {
          return true;
        }
        return "You need to add a CSS selector for your test to use.";
      },
      when: function(answers) {
        return (answers.customSpec === "Yes");
      }
    }, {
      type: 'input',
      name: 'landingPageText',
      default: 'Hello, index!',
      message: 'What text should appear on your application\'s landing page within the locator provided above?',
      validate: function(homePageText) {
        if (homePageText !== "") {
          return true;
        }
        return "You need to add some text for your first test to check.";
      },
      when: function(answers) {
        return (answers.customSpec === "Yes");
      }
    }];

    this.prompt(prompts, function(props) {
      this.baseDirOption = props.baseDirOption;
      this.browserOption = props.browserOption;
      this.seleniumJarPath = props.seleniumJarPath;
      this.customSpec = props.customSpec;
      this.targetBaseUrl = props.targetBaseUrl;
      this.landingPageLocator = props.landingPageLocator;
      this.landingPageText = props.landingPageText;
      done();
    }.bind(this));
  },

  app: function() {
    var baseDir = this.baseDirOption,
      configDir = baseDir + "/config",
      locatorDir = baseDir + "/locator",
      reportDir = baseDir + "/report",
      specDir = baseDir + "/spec",
      dataDir = baseDir + "/data",
      libDir = baseDir + "/lib",
      browserOption = this.browserOption,
      taskDir = "tasks/";
    var done = this.async();
    //base test directory
    this.mkdir(baseDir);
    //console.log("_", this._);
    var _ = this._;
    this._.templateSettings.imports.loscape = function(val) {
      var newval = "<%=" + val + "%>";
      return newval;
    };
    this.template('_loopmocha.js', taskDir + 'loopmocha.js');
    //config dir
    this.mkdir(configDir);
    this.copy('test/functional/config/nemo-plugins.json', configDir + '/nemo-plugins.json');
    //locator dir
    this.mkdir(locatorDir);
    this.copy('test/functional/locator/formExample.json', locatorDir + '/formExample.json');

    //report dir
    this.mkdir(reportDir);
    this.copy('test/functional/report/README.md', reportDir + '/README.md');
    //spec dir
    this.mkdir(specDir);
    this.copy('test/functional/spec/example.js', specDir + '/example.js');
    //data dir
    this.mkdir(dataDir);
    this.template('test/functional/data/_setup.js', dataDir + '/setup.js');
    //lib dir
    this.mkdir(libDir);
    this.copy('test/functional/lib/lifeStory.js', libDir + '/lifeStory.js');
    if (this.customSpec === "Yes") {
      this.template('test/functional/locator/_landing.json', locatorDir + '/landing.json');
      this.template('test/functional/spec/_landing.js', specDir + '/landing.js');
    }
    done();
    // this.mkdir('app/templates');

    // this.copy('_package.json', 'package.json');
    // this.copy('_bower.json', 'bower.json');
  },
  installThings: function() {
    var cmd = this.spawnCommand("npm", ["install", "--save-dev", "nemo@^v0.1.0", "nemo-view@^v0.1.0", "nemo-mocha-factory@^v0.1.0", "grunt-loop-mocha@^v0.3.0", "nemo-drivex@^v0.1.0", "nemo-locatex@^v0.1.0", "nconf@~v0.6.7", "xunit-file@v0.0.4"]);
    var done = this.async();
    cmd.on('close', function(code) {
      console.log('child process exited with code ' + code);
      done();
    });
  },
  editGruntfile: function() {
    var done = this.async();
    //let's update Gruntfile.js if possible
    fs.readFile('Gruntfile.js', 'utf8', function(err, data) {
      if (err) {
        return console.log(err);
      }
      if (data.indexOf("loopmocha")) {
        //already here?
        done();
        return;
      }
      var result = data.replace(/grunt.registerTask/, 'grunt.registerTask(\'automation\', [\'loopmocha:local\']);\n\tgrunt.registerTask');

      fs.writeFile('Gruntfile.js', result, 'utf8', function(err) {
        if (err) {
          return console.log(err);
        }
        done();
      });
    });
  },
  finalValidation: function() {
    var done = this.async();
    var browser = this.browserOption;
    //if the browser is phantomjs or chrome, check for phantomjs or chromedriver
    if (browser === "phantomjs" || browser === "chrome") {
      var myBrowser = (browser === "phantomjs") ? ["PhantomJS", "PhantomJS"] : ["Chrome", "chromedriver"];
      this.log(chalk.green("You selected " + myBrowser[0] + " as your browser. If you haven't already, please install " + myBrowser[1] + " to run tests locally."));
      this.log(chalk.green("Please see"), chalk.underline.blue.bold("https://github.com/paypal/nemo-docs/blob/master/driver-setup.md"), chalk.green("for more details."));
    }

    this.log(chalk.green("Now try running 'grunt automation'"));
    done();
  },
});

module.exports = NemoGenerator;