# cpi-keep-tracing

> Make deployed SAP Cloud Platform Integration (CPI) integration flows stay at log level TRACE as long as this tool is running

## Installation


### Install from npm

If you've got [Node.js](https://nodejs.org) installed, just run

`npm -g install cpi-keep-tracing`

Afterwards you can use the tool from any console / command-line terminal.

### Run from source code repository

1. Either clone this repository or use the excellent [degit](https://github.com/Rich-Harris/degit) for obtaining a slim copy
2. In the project folder, run `npm install`
3. Afterwards you can execute the tool by running the `bin/run` executable
4. If you'd like to execute the tool from any folder, run `npm link` from within the copy to set up symbolic links from the globally installed npm package folder. Note that this may need administrator privileges when running the command or the console terminal

## Usage

```shell
> cpi-keep-tracing --help
Make iFlows running with log level TRACE

USAGE
  $ cpi-keep-tracing

OPTIONS
  -d, --delay=delay        [default: 300] The delay between TRACE updates in seconds
  -f, --filter=filter      Regular expression to filter affected iflows: Only matching iflows will be keept at TRACE
  -p, --password=password  You (S-, C-, ...) user's password for basic authentication (not stored anywhere)
  -u, --username=username  The (S-, C-, ...) username for basic authentication
  --url=url                The tenant url in the format https://<some id>-tmn.hci.<some region>.hana.ondemand.com
```

## Tinkering with the tool

The tool leverages the excellent CLI framework [oclif](https://oclif.io/) and is a single-command oclif project.

Feel free to explore the contents of [src/index.ts](/src/index.ts).