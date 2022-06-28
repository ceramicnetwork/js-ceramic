"use strict";
exports.__esModule = true;
// Update with your config settings.
var config = {
    development: {
        client: "postgresql",
        connection: {
            database: "ceramic",
            user: "ceramic",
            password: "password"
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: "knex_migrations"
        }
    },
    staging: {
        client: "postgresql",
        connection: {
            database: "ceramic",
            user: "ceramic",
            password: "password"
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: "knex_migrations"
        }
    },
    production: {
        client: "postgresql",
        connection: {
            database: "ceramic",
            user: "ceramic",
            password: "password"
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: "knex_migrations"
        }
    }
};
module.exports = config;
