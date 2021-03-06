# generator-nemo

Generator for adding Nemo functional tests to a [Kraken 1.0](https://github.com/krakenjs/kraken-js) application

## Pre requisites

1. An npm project with the following installed:
  * grunt
  * grunt-config-dir
  * mocha OR cucumberjs (depending on which scaffold you want to use)
2. A browser installed which you want to use for automation, and any downstream requirements:
  * Please see https://github.com/paypal/nemo-docs/blob/master/driver-setup.md
3. yeoman globally installed:
```
$ npm install -g yo
```
## To install generator-nemo from npm, run:

```
$ npm install -g generator-nemo
```

## Use the generator:

from within your application's base directory:
```
$ yo nemo
```

Follow prompts.

Once complete, you should be able to see your first suite run using the command `grunt auto`
