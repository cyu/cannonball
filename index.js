exports.builder = require('./lib/builder').factoryMethod;

/*
 * var builder = require('cannonball').builder();
 * var userCommand = builder.
 *   find("user", function(env){
 *     // ...
 *   }).
 *   start({find: "user"}, function(env) {
 *     return env.user;
 *   }).
 *   buildCommand("userCommand");
 */
