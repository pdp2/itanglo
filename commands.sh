#!/bin/sh

case "$1" in 
	"serve")
		echo "Starting serve task"
		deno run --allow-net --allow-read serve.js
		;;
	"build")
		echo "Starting build task"
		deno run --allow-read --allow-write build.js
		;;
	*)
		echo "Hit the default case - will run $1 if there is a function called $1"
    	$1
esac