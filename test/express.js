"use strict";

// Expect module.
import {expect} from 'chai'

// Request module.
import request from 'request'

// Express.
import express from 'express'

// Source.
import * as auth from '../src/http-auth'

// Express.
describe('express', function () {
    let server = undefined;

    before(function () {
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

        // Creating new HTTP server.
        const app = express();
        app.use(auth.connect(basic));

        // Setup route.
        app.get( '/', function (req, res) {
            res.send(`Welcome to private area - ${req.user}!`);
        });

        // Error handler.
        app.use( function (err, req, res, next) {
            res.status(400).end(err.message);
        });

        // Start server.
        server = app.listen(1337);
    });

    after(function () {
        server.close();
    });

    it('error', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("Error comes here");
            done();
        };

        // Test request.
        request.get('http://127.0.0.1:1337', callback).auth('gevorg', 'gpass');
    });

    it('success', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("Welcome to private area - mia!");
            done();
        };

        // Test request.
        request.get('http://127.0.0.1:1337', callback).auth('mia', 'supergirl');
    });

    it('wrong password', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("401 Unauthorized");
            done();
        };

        // Test request.
        request.get('http://127.0.0.1:1337', callback).auth('mia', 'cute');
    });

    it('wrong user', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("401 Unauthorized");
            done();
        };

        // Test request.
        request.get('http://127.0.0.1:1337', callback).auth('Tina', 'supergirl');
    });

    it('password with colon', function (done) {
        const callback = function (error, response, body) {
            expect(body).to.equal("Welcome to private area - ColonUser!");
            done();
        };

        // Test request.
        request.get('http://127.0.0.1:1337', callback).auth('ColonUser', 'apasswordwith:acolon');
    });
});