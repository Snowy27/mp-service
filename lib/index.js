'use strict';

const Chairo = require('chairo');
const Hapi = require('hapi');
const defaultConfig = require('./config');
const _ = require('lodash');
const BPromise = require('bluebird');

module.exports = Service;

function Service (serviceTitle, routes, specificConfig) {

    let config = _.defaults(specificConfig, defaultConfig),
        server = new Hapi.Server({debug: {request: ['error']}}),
        self = this;

    self.server = server;

    server.connection({port: config.PORT, host: config.HOST});
    server.register(Chairo, (err) => {

        if (err) {
            throw err;
        }

        self.config = config;
        self.seneca = server.seneca;
        self.seneca.actAsync = BPromise.promisify(self.seneca.act, {context: self.seneca});

        //Register routes in Hapi and Seneca
        _.forEach(routes, (route) => {
            let modifiedRoute = route;
            modifiedRoute.service = serviceTitle;
            self.registerRoute(modifiedRoute, server);
        });

    });
}

Service.prototype.startService = function startService() {
    let self = this;

    self.server.start((err) => {
        if (err) {
            throw err;
        }

        self.seneca.listen(self.config.SENECA_LISTEN_PORT);
        _.forEach(self.config.SENECA_CLIENT_PORTS, (port) => {
            self.seneca.client(port);
        });

        console.log('Server running at: ', self.server.info.uri);
    });
};
