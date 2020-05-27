# EB-Weather-App
An Elastic Beanstalk demo, deploying a simple Express weather application.

## Overview
This tutorial is intended to demonstrate how you might use Elastic Beanstalk with a simple Express application running on Node.js. The application is an altered version of the API code showcased [here](https://codeburst.io/build-a-simple-weather-app-with-node-js-in-just-16-lines-of-code-32261690901d). 

Much of the steps in the tutorial below have been extracted from the official AWS Elastic Beanstalk Documentation, but I have simplified them for the use in this tutorial.

We will be deploying a simple Weather Application for the fictitious company SciCorp. SciCorp employs field workers who need accurate temperature data down to specific coordinates, such as 40.712776, -74.005974 (New York).

We have a pre-built Express application which will run using the Node.js framework in AWS Elastic Beanstalk. The application has dependencies on modules and libraries which can be found in the weather.js file. The application will call the OpenWeatherMap API, which is free to use. You can sign up for an API key [here](https://openweathermap.org).

### Prerequisites
Before you start, ensure you have the following:
- Updated Node.js and Express (you can get this from NPM)
- A valid API key, which you'll need to replace in the app.js file (signup above)

### 1. Installing and configuring the EB CLI
1. Install the AWS EB CLI from the official [AWS Documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html). You may also use the AWS2 CLI, however we will be demonstrating the EB CLI in this walkthrough.
3. Configure the EB CLI:
```
$ eb init
```
4. Provide your login credentials created with AWS IAM (the following are dummy credentials):
```
You have not yet set up your credentials or your credentials are incorrect.
You must provide your credentials.
(aws-access-id): OMJAOUAUAAEXAMPLE
(aws-secret-key): 6ZAIitLm4cCKAvd3EXAMPLEDtk+IosMzlpM
```
5. Complete the EB application setup by following the prompts.

#### OPTIONAL: Deploying a sample Express application to EB
Once the AWS EB CLI is installed, you can optionally deploy a sample Express application provided by AWS, located in [this guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs_express.html). If you'd like, you can skip the rest of the steps below and try a sample application on your own.

#### OPTIONAL: Create a new Express project from scratch
If you'd like to generate a new Express Project from scratch instead of this application, you can run the below to install Express and  any dependencies:
```
$ express && npm install
```

### 2. Initialize Git in your cloned repository
Once you've cloned into this repo, you'll need to intialize Git for your own local fork of this project.  
1. Initialize a new Git repository
```
$ git init
```
2. Create a `.gitignore` file:
```
node_modules/
.gitignore
.elasticbeanstalk/
```

### 3. Create an Elastic Beanstalk environment
1. Create a new config folder with the eb init command for your application:
```
$ eb init --platform node.js --region us-east-1
Application node-express has been created.
```
This command creates a configuration file in a folder named `.elasticbeanstalk` that specifies settings for creating environments for your application, and creates an Elastic Beanstalk application named after the current folder.

2. Create an environment running a sample (demo) application with the eb create command. When you run the below, EB CLI will immediately intialize the creation of the resources needed in AWS, including EC2 Instances, and other resources. Once you are done with this project you can remove all running resources with the command at the end of this tutorial.
```
$ eb create --sample weather-app-dev1
```
This command creates a load balanced environment with the default settings for the Node.js platform and required AWS resources.

3. When environment creation completes, use the eb open command to open the environment's URL in the default browser.
```
$ eb open
```
### 4. Start with the cloned directory

After cloning this directory, you should have the following structure:
```
.
├── .ebextensions
│   ├── nodecommand.config
│   └── proxy.config
├── .elasticbeanstalk
│   └── config.yml
├── .git
├── .gitignore
├── README.md
├── bin
│   └── www
├── node_modules
│   ├── accepts
│   ...
│   └── yargs
├── package-lock.json
├── package.json
├── public
│   ├── css
│   │   └── style.css
│   ├── images
│   ├── javascripts
│   └── stylesheets
│       └── style.css
├── routes
│   ├── index.js
│   └── users.js
├── views
│   ├── error.jade
│   ├── index.ejs
│   ├── index.jade
│   └── layout.jade
└── weather.js
```

I've included the Elastic Beanstalk configuration as a sample, but you should remove the `.elasticbeanstalk` configuration so you'll be able to use your own configuration with no issues. 
The following command will remove this directory and congif contents, recursively:
```rm -rf .elasticbeanstalk```

#### OPTIONAL: Configure your Elastic Beanstalk application from scratch
We've included the `.ebextensions` files you'll need for the application to work, but if you wanted to start from scratch and include any custom configurations, here's what you'd do:

1. On your local computer, create an `.ebextensions` directory in the top-level directory of your source bundle:
```
$ mkdir .ebextensions
$ cd .ebextensions
```
2. *Configuration File 1:* Add a configuration file that sets the Node Command to start the app:
```$ touch nodecommand.config```
Copy the following contents into the file:
```
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "node weather.js"
```
3. *Configuration File 1:* Add a second configuration file in the .ebextension directory named `proxy.config` to configure the port which node will run the application on.
```$ touch proxy.config```
Copy and paste in the following into the new file:
```
files:
  /etc/nginx/conf.d/proxy.conf:
    mode: "000644"
    owner: root
    group: root
    content: |
      upstream nodejs {
        server 127.0.0.1:8080;
        keepalive 256;
      }

      server {
        listen 8080;

        if ($time_iso8601 ~ "^(\d{4})-(\d{2})-(\d{2})T(\d{2})") {
            set $year $1;
            set $month $2;
            set $day $3;
            set $hour $4;
        }
        access_log /var/log/nginx/healthd/application.log.$year-$month-$day-$hour healthd;
        access_log  /var/log/nginx/access.log  main;

        location / {
            proxy_pass  http://nodejs;
            proxy_set_header   Connection "";
            proxy_http_version 1.1;
            proxy_set_header        Host            $host;
            proxy_set_header        X-Real-IP       $remote_addr;
            proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        gzip on;
        gzip_comp_level 4;
        gzip_types text/html text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript;

        location /static {
            alias /var/app/current/static;
        }

      }

  /opt/elasticbeanstalk/hooks/configdeploy/post/99_kill_default_nginx.sh:
    mode: "000755"
    owner: root
    group: root
    content: |
      #!/bin/bash -xe
      rm -f /etc/nginx/conf.d/00_elastic_beanstalk_proxy.conf
      service nginx stop 
      service nginx start

container_commands:
  removeconfig:
    command: "rm -f /tmp/deployment/config/#etc#nginx#conf.d#00_elastic_beanstalk_proxy.conf /etc/nginx/conf.d/00_elastic_beanstalk_proxy.conf"
```

### 5. Update the Application with your own Application Code
1. Stage the files using Git, and commit them:
```
$ git add .
$ git commit -m "First express app"
```
2. Deploy the changes. Once you run the below command, EB CLI will replace the sample application we've deployed earlier with the files in your local directory. (If you have any issues, be sure to check that you are currently at the top level of your project, not in any of the project's folders!)
```
$ eb deploy
```
3. Once the environment is green and ready, refresh the URL to verify it worked. You should see a web page that says Welcome to Express. If you closed the tab, you can use the eb open command to open the environment's URL in the default browser.
```
$ eb open
```
4.  Finally, be sure to check out the Elastic Beanstalk dashboard in your AWS Console. Ensure that you're in the region you have specified at the creation step above, e.g. `us-east-1`. Each region will have separate EB applications deployed in it, and they are not typically accessible across regions with the configuration we have chosen. Here, you'll be able to configure, rollback, monitor, deploy, access logs, and more with your shiny new EB application.

### 6. Clean Up
That's it! I hope you enjoyed this tutorial.

If you are done working with Elastic Beanstalk, you can safely terminate your environment and remove all resources. You can also log into the AWS console to save your configuration as a deployment template for later use.

Use the `eb terminate` command to terminate your environment and all of the resources that it contains.
```
$ eb terminate
The environment "node-express-env" and all associated instances will be terminated.
To confirm, type the environment name: node-express-env
INFO: terminateEnvironment is starting.
...
```

### Troubleshooting
As mentioned above, you can do everything from the EBCLI. However, Elastic Beanstalk also allows you to deploy your application using the console by uploading a zipped bundle of your application. If you go this route, it's very easy to deploy the application from the start, without even needing to set up a dummy application.

If you're having any issues, hopefully the following sections can help steer you in the right direction.

#### Archiving the right way
It's worth noting that you'll want to archive the files themselves, rather than archiving the entire folder. The easy way to do this is to select all of the files in the root directory (not the root directory itself), or running the following command:
```
$ zip -r -D zipped.zip *
```
`zip` is a compression and packaging file utility for Unix.
`-r` is for recursively including all folders underneath the target folder.
`-D` is for not creating directories in the target folder.
`my-folder.zip` is the name of the compressed file we want to create.
Running Zip with the -D flag will tell it not to create directories, which will undoubtably cause some issues if Nginx is looking for your package.json file. This is likely the issue if you get an error message like:
```
npm ERR! enoent ENOENT: no such file or directory, open '/var/app/current/package.json'
```
[Here](https://stackoverflow.com/questions/35387822/amazon-elastic-beanstalk-npm-cant-find-package-json)'s a forum with the same issue.
[Here](https://forums.aws.amazon.com/thread.jspa?messageID=476022)'s a solid example of how easy this is to mess up :)

#### OSX Issues for Mac users
Mac users: Also know that you might also have some issues with OSX includes some hidden files like `.DS_Store` or `__MACOSX`.

You'll know this is the issue if you get the following message when trying to deploy your Elastic Beanstalk application. Your deployment will succeed but your application will be unreachable due to an issue with the configuration files:
```
The configuration file __MACOSX/EB-Weather-App-master/.ebextensions/._nodecommand.config in application version weather app-source contains invalid YAML or JSON. YAML exception: Invalid Yaml: unacceptable character '�' (0x0) special characters are not allowed in "", position 0, JSON exception: Invalid JSON: Unexpected character (�) at position 0.. Update the configuration file.
```
If you're curious, more on that [here](https://thewebsitedev.com/compress-folders-mac-ds_store-files/).

Why doesn't this happen when you use EBCLI? Well, it manages the compress action for you using `git archive`, which is also an option for you.

#### How your application gets started
You should know how your application is being started with Node by Nginx. In this example, our `package.json` file is telling Node where to start:
```
  "scripts": {
    "start": "node .bin/www",
  }
```
This entry point tells Node to check the `~bin/` directory for `www`. Then `www` points to `var app = require('../app');` which is your `app.js` file.
Another important point is that we've written the `nodecomand.config` file to tell Node to run `npm start`. This means that you don't have to specify anything in your Container Options in the console.

You can go to your active App Environment > Configuration > Software (Modify) > Container Options > Node command to leave it blank. This way, the `.ebextensions` `nodecomand.config` file will tell EB Node.js where to start.
Finally, its important to know what port you've chosen your App to run on. In this tutorial we've selected port `8081` to eliminate conflicts, and we've specified that in a few locations:
[Here](https://stackoverflow.com/questions/22795357/502-bad-gateway-deploying-express-generator-template-on-elastic-beanstalk/30743344)'s a good explanation on how that works.

Our `~/.ebextensions/proxy.config` file:
```
  content: |
    upstream nodejs {
      server 127.0.0.1:8081;
      keepalive 256;
    }

    server {
      listen 8081;
```

Our `~/bin/www` file:
```
var port = normalizePort(process.env.PORT || '8081');
```

Our `~/app.js` file:
```
app.set('port', (process.env.PORT || 8081));

...

var server = app.listen(8081, function () {
     var port = server.address().port
  console.log("App listening on port", port);
});
```
