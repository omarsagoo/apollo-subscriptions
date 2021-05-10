const { ApolloServer, gql, PubSub, withFilter } = require('apollo-server');

const pubsub = new PubSub();

const typeDefs = gql`
    type Post {
        message: String!
        date: String!
    }

    type Channel {
        name: String!
        posts: [Post]!
    }

    type Query {
        posts(channel: String!): [Post!]!
        channel: Channel
        channels: [Channel]!
    }

    type Mutation {
        addPost(channel: String!, message: String!): Post!
        addChannel(name: String!): Channel!
    }

    type Subscription {
        newPost(channel: String!): Post!
        newChannel: Channel!
    }
`

const data = [
    { message: 'hello world', date: new Date() }
]

const channels = {}

const resolvers = {
    Query: {
        posts: (_, { channel }) => {
            channel = channels[channel]
            posts = channel.posts

            return posts
        },
        channels: () => {
            allChannels = Object.values(channels)
            return allChannels
        },
    },
    Mutation: {
        addPost: (_, { channel, message }) => {
            const post = { message, date: new Date() }

            chan = channels[channel]
            chan.posts.push(post)

            data.push(post)
            pubsub.publish('NEW_POST', { channelName: channel, newPost: post }) // Publish!
            return post
        },
        addChannel: (_, { name }) => {
            const posts = Array()
            const channel = {name, posts}
            channels[name] = channel

            // console.log(channels)

            pubsub.publish('NEW_CHANNEL', { newChannel: channel })
            return channel
        }
    },
    Subscription: {
        newPost: {
            subscribe: withFilter(() => pubsub.asyncIterator('NEW_POST'), 
            (payload, post) => {
                return (payload.channelName === post.channel);
            })
        },
        newChannel: {
            subscribe: () => pubsub.asyncIterator('NEW_CHANNEL')
        }
    },
}

const server = new ApolloServer({ 
    typeDefs, 
    resolvers 
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});