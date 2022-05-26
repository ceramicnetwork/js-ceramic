build:
	yarn run build;
run:
	./packages/cli/bin/ceramic.js daemon;
did_create:
	glaze did:create
tile_create:
	glaze tile:create --key aa094f26d51510a2ddafc7fac230b3373372b04452993c423fe1f945ffbbe0ca --content '{"name":"0x"}'
tile_show:
	glaze tile:show kjzl6cwe1jw14bil1tpcf7vy97b7pvum1zfnbple376u0urq8dhcaqgdzbbkntx
tile_update:
	glaze tile:update kjzl6cwe1jw14bil1tpcf7vy97b7pvum1zfnbple376u0urq8dhcaqgdzbbkntx --key aa094f26d51510a2ddafc7fac230b3373372b04452993c423fe1f945ffbbe0ca --content '{"name":"0xover"}'
tile_schema:
	glaze tile:create --key aa094f26d51510a2ddafc7fac230b3373372b04452993c423fe1f945ffbbe0ca --content '{
		"$schema": "http://json-schema.org/draft-07/schema#",
		"title": "Reward",
		"type": "object",
		"properties": {
			"title": {"type": "string"},
			"message": {"type": "string"}
		},
		"required": [
			"message",
			"title"
		]
	}'
stream_commit:
	glaze stream:commits kjzl6cwe1jw1472as4pj3b3ahqmkokbmwc7jchqcob6pcixcoo4kxq6ls8uuxgb
tile_schema:
	glaze tile:create --key ab...f0 --content '{
 		"title": "My first document with schema",
    	"message": "Hello World"
  	}' --metadata '{"schema":"k3y52l7qbv1frxu8co1hjrivem5cj2oiqtytlku3e4vjo92l67fkkvu6ywuzfxvy8"}'
stream_state:
	glaze stream:state kjzl6cwe1jw14b5sr79heovz7fziz4dxcn8upx3bcesriloqcui137k6rq6g2mn
