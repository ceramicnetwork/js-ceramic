const { exec } = require("child_process");

/*
brew install postgresql
createuser -s postgres
brew services restart postgresql
 */
exec("createuser -s postgres; brew services restart postgresql;", (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

var conn = {
  host: '127.0.0.1',
  user: 'postgres',
  password: '',
  charset: 'utf8',
};

// connect without database selected
var knex = require('knex')({ client: 'pg', connection: conn });

knex.raw("CREATE DATABASE ceramic ENCODING 'UTF8';").then(function () {
  knex.destroy();

  // connect with database selected
  conn.database = 'ceramic';
  knex = require('knex')({ client: 'pg', connection: conn });

  // create users
  knex.schema
    .createTable('my_table', function (table) {
      table.string('my_field');
    })
    .then(function () {
      knex.destroy();
    });
});
