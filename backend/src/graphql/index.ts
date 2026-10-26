import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { Express } from 'express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createGraphQLContext, GraphQLContext } from './context';

export async function setupGraphQL(app: Express): Promise<ApolloServer<GraphQLContext>> {
    const server = new ApolloServer<GraphQLContext>({
        typeDefs,
        resolvers,
        introspection: true,
    });

    await server.start();

    app.use('/graphql', expressMiddleware(server, {
        context: createGraphQLContext as any
    }) as any);

    return server;
}

export * from './schema';
export * from './resolvers';
export * from './context';
