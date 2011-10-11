class transi {
    
  include ntp
  include timezone
  include apt

  group { "puppet":
        ensure => "present",
  }

  apt::repository { "nginx":
      url        => "http://ppa.launchpad.net/nginx/stable/ubuntu",
      distro     => 'lucid',
      repository => 'main',
      key => "C300EE8C",
      key_url => "keyserver.ubuntu.com",
      require => Group["puppet"],
  } 
  
  apt::repository { "nginx-src":
      url        => "http://ppa.launchpad.net/nginx/stable/ubuntu",
      distro     => 'lucid',
      repository => 'main',
      source => "true",
      require => Apt::Repository["nginx"],
  } 
  package { "nginx":
    ensure => latest,
    require => [Apt::Repository["nginx-src"],Exec["aptget_update"]],
  }
  
  package { "curl":
    ensure => latest,
    require => Exec["aptget_update"],
  }
  
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

  service { "nginx":
    ensure => running,
    require => [File["/etc/nginx/sites-enabled/transi"],File["/etc/nginx/sites-enabled/default"]],
  }
  
  package { "couchdb":
    ensure => latest,
    require => Exec["aptget_update"],
  }

  service { "couchdb":
    ensure => "running",
    require => Package["couchdb"],
  }

}

include transi


