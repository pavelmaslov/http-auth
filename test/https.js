"use strict";

// Expect module.
import {expect} from 'chai'

// Request module.
import request from 'request'

// HTTPS library.
import https from 'https'

// FS.
import fs from 'fs'

// Source.
import * as auth from '../src/http-auth'

// HTTPS.
describe('https', function () {
    let server = undefined;

    before(function() {
        // Configure authentication.
        const basic = auth.basic({
            realm: "Private Area."
        }, function (username, password, done) {
            if (username === 'gevorg') {
                done(new Error("Error comes here"));
            } else if (username === "mia" && password === "supergirl") {
                done(true);
            } else if (username === "ColonUser" && password === "apasswordwith:acolon") {
                done(true);
            } else {
                done(false);
            }
        });

        // HTTPS server options.
        const options = {
            key: fs.readFileSync(__dirname + "/../data/server.key"),
            cert: fs.readFileSync(__dirname + "/../data/server.crt")
        };


        // Creating new HTTPS server.
        server = https.createServer(basic, options, function (req, res) {
            res.end(`Welcome to private area - ${req.user}!`);
        });

        // Start server.
        server.listen(1337);
    });

    after(function() {
        server.close();
    });

    it('error', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("Error comes here");
            done();
        };

        // Test request.
        request.get({uri: 'https://127.0.0.1:1337', strictSSL: false}, callback).auth('gevorg', 'gpass');
    });

    it('success', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("Welcome to private area - mia!");
            done();
        };

        // Test request.
        request.get({uri: 'https://127.0.0.1:1337', strictSSL: false}, callback).auth('mia', 'supergirl');
    });

    it('wrong password', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("401 Unauthorized");
            done();
        };

        // Test request.
        request.get({uri: 'https://127.0.0.1:1337', strictSSL: false}, callback).auth('mia', 'cute');
    });

    it('wrong user', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("401 Unauthorized");
            done();
        };

        // Test request.
        request.get({uri: 'https://127.0.0.1:1337', strictSSL: false}, callback).auth('Tina', 'supergirl');
    });

    it('password with colon', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("Welcome to private area - ColonUser!");
            done();
        };

        // Test request.
        request.get({uri: 'https://127.0.0.1:1337', strictSSL: false}, callback).auth(
            'ColonUser', 'apasswordwith:acolon');
    });
});
