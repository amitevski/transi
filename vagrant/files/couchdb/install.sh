#!/bin/bash

# Install dependencies required to build couchdb from source
apt-get -y build-dep couchdb
cd /opt
# download the latest release from http://couchdb.apache.org/downloads.html
wget http://artfiles.org/apache.org//couchdb/0.11.2/apache-couchdb-0.11.2.tar.gz
tar xvzf apache-couchdb-0.11.2.tar.gz
cd apache-couchdb-0.11.2

# Note: To install couchdb in the default location use --prefix= in the configure statement
# Note: To check what XULRunner version you have installed use xulrunner -v. CouchDB-1.1.x and older will not work with XULRunner 2.0+.

# Note: See Additional Notes (below) for additional, necessary information about using CouchDB-1.1.x and older on Ubuntu versions less than 11.04.
# Note: The extra --with-js-* options should not be used with CouchDB-1.2 (current trunk) and newer on Ubuntu 11.04+, where building against libmozjs185-dev is preferred.

./configure --prefix= --with-js-lib=/usr/lib/xulrunner-devel-1.9.x.y/lib --with-js-include=/usr/lib/xulrunner-devel-1.9.x.y/include

# Now you can compile and install couchdb
make && make install
# Add couchdb user account
useradd -d /var/lib/couchdb couchdb
chown -R couchdb: /var/lib/couchdb /var/log/couchdb

# next two steps fix problems where adding admin hangs or setting admins in local.ini hangs the start. Also fixes problems with reader_acl test.
chown -R root:couchdb /etc/couchdb
chmod 664 /etc/couchdb/*.ini
chmod 775 /etc/couchdb/*.d

# start couchdb
/etc/init.d/couchdb start
# Start couchdb on system start
update-rc.d couchdb defaults