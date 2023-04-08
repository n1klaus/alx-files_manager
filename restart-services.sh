#!/usr/bin/bash
tmux kill-session -t 0;
#pkill mongo &&
#pkill redis &&
#sleep 3 &&
sudo service redis-server restart && echo "" &&
sudo service mongod restart; echo "" &&
tmux new-session -d "npm run start-server" && echo "" &&
tmux ls
