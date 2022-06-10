/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('mid_kjzl6cwe1j', function(t) {
    t.string('comment_cli').notNull().defaultTo('bladibla');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('mid_kjzl6cwe1j', function(t) {
    t.dropColumn('comment_cli');
  });
};
