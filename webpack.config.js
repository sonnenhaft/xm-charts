const path = require('path')
const merge = require('webpack-merge')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const DashboardPlugin = require('webpack-dashboard/plugin')

const devServerPort = process.env.PORT || 8087

const pkg = require('./package.json')
const vendorPackages = Object.keys(pkg.dependencies)
  .filter(k => k !== 'babel-plugin-react-css-modules')

function copyEnvVars(...vars){
  return vars.reduce((e, v) =>  {e[`process.env.${v}`] = JSON.stringify(process.env[v]); return e}, {})
}


const paths = {
  src: path.join(__dirname, 'src'),
  html: path.join(__dirname, 'src/index.html'),
  dist: path.join(__dirname, 'dist'),
  node_modules: path.join(__dirname, 'node_modules'),
}

const coreCssRules = [
  {
    loader: 'css-loader',
    options: {
      importLoaders: 1,
      modules: true,
      sourceMap: true,
      localIdentName: '[path]___[name]__[local]___[hash:base64:5]',
    },
  },
  {
    loader: 'sass-loader',
    options: {sourceMap: true}
  }
]

const common = {
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [paths.src, 'node_modules'],
  },
  output: {
    path: paths.dist,
    filename: '[name].js',
  },
  module: {
    rules: [
      // {
      //   test: /\.jsx?$/,
      //   enforce: 'pre',
      //   use: [{loader: 'eslint-loader', options: {emitWarning: true,},}],
      //   exclude: paths.node_modules,
      // },
      {
        test: /\.jsx?$/,
        use: [{loader: 'babel-loader', options: {cacheDirectory: true,},},],
        exclude: paths.node_modules,
      },
      {test: /\.ya?ml$/, use: [{loader: 'yaml-loader'}], exclude: paths.node_modules,},
      {test: /\.svg$/, use: [{loader: 'raw-loader'}],},
      {test: /\.(png|gif)(\?.*)?$/, loader: 'url-loader?limit=100000',},
      {test: /\.(eot|otf|woff|ttf)?$/, loaders: ['url-loader'],},
    ],
  },
  plugins: [
    new webpack.DefinePlugin(copyEnvVars('NODE_ENV', 'API_BASEURL', 'CM_ID','npm_package_name', 'npm_package_version')),
    new HtmlWebpackPlugin({template: paths.html,}),
  ],
}

const development = {
  entry: [
    'react-hot-loader/patch',
    `webpack-dev-server/client?http://localhost:${devServerPort}`,
    'webpack/hot/only-dev-server',
    paths.src,
  ],
  //devtool: 'cheap-eval-source-map',
  devtool: 'source-map',
  devServer: {
    hot: true,
    //stats: 'errors-only',
    //quiet: true,
    host: process.env.HOST,
    port: devServerPort,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', ...coreCssRules,],
        include: paths.src,
      },
    ],
  },
  performance: {hints: false,},
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new DashboardPlugin({port: 9001}),
  ],
}

const production = {
  bail: true,
  entry: {
    app: paths.src,
    vendor: vendorPackages,
  },
  devtool: 'source-map',
  output: {
    path: paths.dist,
    filename: '[name].[chunkhash].js',
    chunkFilename: '[chunkhash].js',
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({loader: [...coreCssRules,],}),
        include: paths.src,
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin('[name].[chunkhash].css'),
    new CleanPlugin([paths.dist]),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor', 'manifest'],
    }),
    new webpack.optimize.UglifyJsPlugin({compress: {warnings: false,},}),
  ],
}


module.exports = process.env.NODE_ENV === 'production' ?
  merge(common, production) :
  merge(common, development)
