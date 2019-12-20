#!/bin/sh

function send() {
  mosquitto_pub -t "$1" -m "$2"
}

chan="_test/load"
send "qmirror/announce" $chan

while [ true ]; do
  send $chan "{\"date\": \"`date`\", \"msg\": \"hello!\", \"uptime\": \"`uptime`\"}"
done
