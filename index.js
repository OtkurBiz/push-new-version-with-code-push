var co = require('co');
var prompt = require('co-prompt');
var program = require('commander');
var chalk = require('chalk');
var exec = require('child_process').execSync, child;

var inquirer = require('inquirer');
var loading =  require('loading-cli');
var load = loading("processing!!")


function list(val) {
    return val.split(',').map(Number);
}

let androidBundleCommand = 'node node_modules/react-native/local-cli/cli.js bundle --platform android --entry-file index.android.js --bundle-output android/app/src/main/assets/index.android.bundle --dev false';
let androidBundle = 'android/app/src/main/assets/index.android.bundle';
let iosBundleCommand = 'node node_modules/react-native/local-cli/cli.js bundle --platform ios --entry-file index.ios.js --bundle-output ios/main.jsbundle --dev false';
let iosBundle = 'ios/main.jsbundle';

var questions = [
    {
        type: 'input',
        name: 'appname',
        message: 'Please enter the app name in your codepush.',
        validate: function (input) {
            load.color = 'yellow';
            load.frames = ["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"];
            load.start();
            console.log(chalk.cyan(`\n start checking your app name from your local code push app list command `));
            var done = this.async();
            if (input == '') {
                // Pass the return value in the done callback
                //done('You need to provide a app name');
                console.log(chalk.bold.red(`\n You need to provide a app name `));
                console.log(chalk.bold.green(`\n Please enter the app name in your codepush `));
                return;
            }
            let codePushApps = JSON.parse(exec("code-push app ls  --format json"));
            let appExist = false;
            if(codePushApps.length > 0){
                codePushApps.map(app=>{
                    if(app.name === input){
                        appExist = true;
                    }
                })
            }
            load.stop();
            if(!appExist){
                console.log(chalk.cyan(`\n The app ${chalk.bold.red(input)} doesn't exist in you code push app list `));
                console.log(chalk.bold.green(`\n Please enter the app name in your codepush `));
                return;
            }else{
                done(null, true);
            }
        }

    },
    {
        type: 'list',
        name: 'platform',
        message: 'Which Platform do you want to push the new version',
        choices: ['ios', 'android'],
        filter: function (val) {
            return val.toLowerCase();
        }
    },
    {
        type: 'list',
        name: 'env',
        message: 'Which environment do you want to push the new version',
        choices: ['dev', 'production'],
        filter: function (val) {
            return val.toLowerCase();
        }
    },
    {
        type: 'input',
        name: 'version',
        message: 'version for push, leave empty if you do not have any.',
        default: '1.0'
    },
    {
        type: 'input',
        name: 'description',
        message: 'description, leave empty if you do not have any.',
        default: 'new update'
    },
    {
        type: 'confirm',
        name: 'mandatory',
        message: 'Is this version mandatory?',
        default: false
    }
];



program
    .arguments('<start>')
    .option('-v, --version <version>', 'The version param that code push needs to push this version to.')
    .option('-d, --desc <description>', 'description of the new version')
    .option('-p, --platform <platform>', 'platform which you want to push the new version, ios or android', /^(ios|android)$/i, 'ios')
    .option('-e, --env <environment>', 'environment which you want to push the new version, dev or production', /^(dev|production)$/i, 'dev')
    .action(function () {
        co(function* () {

            inquirer.prompt(questions).then(function (answers) {
                console.log(answers, 'answers');
                console.log(chalk.bold.cyan('start to generate mainBundle for ' + answers.platform));
                console.log(chalk.green("please wait for 10-30 seconds"));
                let bundle;
                if (answers.platform == 'android') {
                    bundle = androidBundle;
                    exec(androidBundleCommand);
                } else {
                    bundle = iosBundle;
                    exec(iosBundleCommand);
                }

                let codePushCommand = 'code-push release BulutBazar-Client :bundle ":version" --d :deployment --des ":description" --mandatory :mandatory';
                let deployment = answers.platform + '-' + answers.env;

                codePushCommand = codePushCommand
                    .replace(':bundle', bundle)
                    .replace(':version', answers.version)
                    .replace(':deployment', deployment)
                    .replace(':description', answers.description)
                    .replace(':mandatory', answers.mandatory);

                console.log(chalk.cyan('excuting command: ' + codePushCommand));
                console.log(chalk.green("please wait for 10-30 seconds"));
                exec(codePushCommand);

                console.log(chalk.bold.cyan('finish to generate mainBundle for ' + answers.platform));
                process.exit();

            });

        });

    });

program.parse(process.argv);

if (!program.args.length) program.help();
