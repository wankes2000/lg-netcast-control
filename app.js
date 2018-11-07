import express from 'express';
import Control from './services/controls';
import API from './LgApi';
import config from './config.json';

const ngrok = require('ngrok');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const s3Bucket = config.bucket;
const s3Key = config.s3Key;

API.pair();
const app = express();
const port = config.port;
app.post('/command/change-input', (req, res) => Control.changeInput(req, res));
app.post('/command/netflix', (req, res) => Control.netflix(req, res));
app.post('/command/:control', (req, res) => Control.handle(req, res));

app.post('/command/sound/up/:value', (req, res) => Control.changeSound(req, res, 'plus'));
app.post('/command/sound/down/:value', (req, res) => Control.changeSound(req, res, 'minus'));
app.post('/command/channel/:channel', (req, res) => Control.changeChannel(req, res));

app.get('/commands/list', (req, res) => Control.listCommands(req, res));
app.get('/ping', (req, res) => Control.isAlive(req, res));

app.listen(port, () => console.log(`Listening on port ${port}`));

// Create ngrok tunnel

const tunnelUser = config.user;
const password = config.pass;
const tunnelToken = config.token;
const authValue = `${tunnelUser}:${password}`;


const url = ngrok.connect({ proto: 'http', addr: port, authtoken: tunnelToken, auth: authValue });
url.then(function(res) {
    console.log(res);
    const result = {
        url: res,
        user: tunnelUser,
        pass: password
    };
    let putS3Params = {
        Bucket: s3Bucket,
        Key: s3Key,
        Body: JSON.stringify(result), 
        ContentType: "application/json"
    };

    // Upload tunnel config to S3

    s3.putObject(putS3Params, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log(`Successfully uploaded data to ${s3Bucket}/${s3Key}`);
        }
     });
}, function(err) {
    console.log(err);
});

