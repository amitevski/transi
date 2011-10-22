class transi {
    
  include ntp
  include timezone
  include apt

  group { "puppet":
        ensure => "present",
  }

  apt::repository { "couchdb-repo":
      url        => "http://ppa.launchpad.net/randall-leeds/couchdb/ubuntu",
      distro     => 'natty',
      repository => 'main',
      key => "59F5EA1A ",
      key_url => "keyserver.ubuntu.com",
      require => Group["puppet"],
  }
  
  apt::repository { "couchdb-src":
      url        => "http://ppa.launchpad.net/randall-leeds/couchdb/ubuntu",
      distro     => 'natty',
      repository => 'main',
      source => "true",
      require => Apt::Repository["couchdb-repo"],
  } 
  
#  apt::repository { "nginx":
#      url        => "http://ppa.launchpad.net/nginx/stable/ubuntu",
#      distro     => 'lucid',
#      repository => 'main',
#      key => "C300EE8C",
#      key_url => "keyserver.ubuntu.com",
#      require => Group["puppet"],
#  } 
  
#  apt::repository { "nginx-src":
#      url        => "http://ppa.launchpad.net/nginx/stable/ubuntu",
#      distro     => 'lucid',
#      repository => 'main',
#      source => "true",
#      require => Apt::Repository["nginx"],
#  } 
  package { "nginx":
    ensure => latest,
    require => Exec["aptget_update"],
  }
  
  package { "couchdb":
    ensure => latest,
    require => [Apt::Repository["couchdb-src"], Exec["aptget_update"]],
  }
  
  package { "git-core":
    ensure => latest,
  }
  
  package { "vim":
    ensure => latest,
  }
  
  package { "curl":
    ensure => latest,
    require => Exec["aptget_update"],
  }
#  file {"/usr/local/bin/installCouchdb.sh":
#    ensure => "present",
#    mode    => 0750,
#    source => "/vagrant/files/couchdb/install.sh",
#    require => Group["puppet"],
#  }
  
#  exec {"/usr/local/bin/installCouchdb.sh":
#    user => "root",
#    command => "/usr/local/bin/installCouchdb.sh",
#    unless => "/usr/bin/test -f /etc/inti.d/couchdb",
#    require => File["/usr/local/bin/installCouchdb.sh"],
#  }
  
  file {"/etc/nginx/sites-available/transi":
    ensure => "present",
    source => "/vagrant/files/nginx/transi",
    require => Package["nginx"],
    notify => Service["nginx"],
  }
  
  file {"/etc/nginx/sites-enabled/transi":
    ensure => symlink,
    target => "/etc/nginx/sites-available/transi",
    require => File["/etc/nginx/sites-available/transi"],
  }
  
  file {"/etc/nginx/sites-enabled/default":
    ensure => "absent",
    require => Package["nginx"],
    notify => Service["nginx"],
    }

  service { "couchdb":
    ensure => running,
  }
  
  service { "nginx":
    ensure => running,
    require => [File["/etc/nginx/sites-enabled/transi"],File["/etc/nginx/sites-enabled/default"]],
  }

}

include transi


