const { GraphQLServer } = require("graphql-yoga");
const Mutation = require("./resolvers/Mutation");
const Query = require("./resolvers/Query");
const db = require("./db");

// Create the GraphQLYoga Server

function createServer() {
  return new GraphQLServer({
    typeDefs: "src/schema.graphql"
  });
}
