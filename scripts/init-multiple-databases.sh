#!/bin/bash

set -e
set -u

function create_user_and_database() {
	local database=$1
	echo "Creating user and database '$database'"
	
	# Special handling for optimal_platform database
	if [ "$database" = "optimal_platform" ]; then
		psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
		    CREATE USER optimal_user WITH PASSWORD 'optimal_pass';
		    CREATE DATABASE optimal_platform;
		    GRANT ALL PRIVILEGES ON DATABASE optimal_platform TO optimal_user;
EOSQL
	else
		psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
		    CREATE USER $database WITH PASSWORD '$database123';
		    CREATE DATABASE $database;
		    GRANT ALL PRIVILEGES ON DATABASE $database TO $database;
EOSQL
	fi
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		create_user_and_database $db
	done
	echo "Multiple databases created"
fi

