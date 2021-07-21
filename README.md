# LINE Blockchain Scan

LINE Blockchain Scan is forked from https://github.com/ping-pub/explorer at 2022-05-19

**LINE Blockchain Scan is not only an explorer but also a wallet and more ... 🛠**

LINE Blockchain Scan is a light explorer for Cosmos-based Blockchains.

## What is the difference between LINE Blockchain Scan and other explorers? 

LINE Blockchain Scan is designed to explore blockchain data as real as possible, therefore there is no cache, no pre-processing. LINE Blockchain Scan does not cache/save blockchain data on its server. LINE Blockchain Scan only fetch data from Cosmos full node via LCD/RPC endpoints. We call it "Light Explorer".

## Why LINE Blockchain Scan use official/trusted third party public LCD/rpc server? 

We have two considerations: 1, Trust, In decentralize system, everything controlled by one single team/organization could be risks. So we decided to co-build with the community. 2. We will list hundreds cosmos-based blockchains in the future, it's impossible for our team to run validators or fullnodes for all of those chains.

# Installation:

1. Running with yarn
```
yarn && yarn serve
```

2. Building for web servers, like nginx, apache
```
yarn && yarn build
cp -r ./dist/* <ROOT_OF_WEB_SERVER>
```

# Enable LCD for LINE Blockchain Scan

1. Set `enable = true` in `./config/app.toml`
```
###############################################################################
###                           API Configuration                             ###
###############################################################################

[api]

# Enable defines if the API server should be enabled.
enable = true

# Swagger defines if swagger documentation should automatically be registered.
swagger = false

# Address defines the API server to listen on.
address = "tcp://0.0.0.0:1317"

# MaxOpenConnections defines the number of maximum open connections.
max-open-connections = 1000
```

2. add proxy server and enable CORS. NOTE: You must enable https as well.

```
server {
    server_name juno.api.ping.pub;
    listen 443;
    location / {
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Max-Age 3600;
        add_header Access-Control-Expose-Headers Content-Length;

        proxy_pass http://<HOST>:1317;

    }
}
```
3. config your blockchain in [./src/chains]()
