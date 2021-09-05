const webpack = require('webpack');
const path = require('path');

const server = {
     entry: './src/server/server.ts',
     module: {
          rules : [
               {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    include: [path.resolve(__dirname, 'src')]
               }
          ]
     },
     output: {
          filename: 'S_main.js',
          path: path.resolve(__dirname, 'debug')
     },
     optimization: {
          minimize: true
     },
     resolve: {
          extensions: ['.js', '.jsx',  '.ts', '.tsx', '.json']
     },
     plugins: [
          new webpack.DefinePlugin({ 'global.GENTLY': false })
     ]
}

const client = {
     entry: './src/client/client.ts',
     module: {
          rules : [
               {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    include: [path.resolve(__dirname, 'src')]
               }
          ]
     },
     output: {
          filename: 'C_main.js',
          path: path.resolve(__dirname, 'debug')
     },
     resolve: {
          extensions: ['.js', '.jsx',  '.ts', '.tsx']
     },
     optimization: {
          minimize: true
     },
}

module.exports = [client, server]