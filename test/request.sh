#!/bin/bash

curl -X GET http://localhost:3000/broadcast

curl -X POST -d '{"name": "elijah", "email":"youremail@email.com", "password":"password"}' http://localhost:3000/register