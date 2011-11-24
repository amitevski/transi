#!/bin/bash

curl -i -d @testdata.json -H "Content-Type:application/json" -X POST http://transi.dev/app-dev/_bulk_docs