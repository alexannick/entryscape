# EntryScape Platform

### Pre-requisites
In order to run and build Entryscape Suite, you will need to have git, npm, and yarn installed.  
[https://git-scm.com/](https://git-scm.com/)  
[https://www.npmjs.com/get-npm](https://www.npmjs.com/get-npm)  
[https://yarnpkg.com](https://yarnpkg.com)

You will also need to have an Entrystore instance running somewhere (remote with CORS or locally).
You can find out more about installing entrystore at [http://entrystore.org](http://entrystore.org).

Lastly, you will need a theme directory located in /src/app/suite/ that contains a proper local.js file specifying various configuration options. As a minimum you need to make sure the "repository" key points to a working EntryStore installation.

### Setup
Once you have cloned this repo and setup a theme... from inside the repo directory, install all the necessary dependencies by running:
```
yarn
```

### Building
Building a distributable copy of Suite can be done by running:
```
yarn build:suite
```
The distributable files will be located in /src/app/suite/dist

### Running a development server
A development server can be run using webpack-dev-server. You will need to install the webpack-dev-server by running (one time only):
```
yarn global webpack-dev-server
```

Then to run the development server:
```
yarn dev:suite
```

You can access the running dev server in the browser at http://localhost:8080


### Generating Licenses
If you would like to create a file listing all the licenses of dependencies run:
```
yarn print-licenses
```

