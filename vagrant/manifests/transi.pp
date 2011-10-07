class lucid64 {
  package { "nginx":
    ensure => present,
  }

  service { "nginx":
    ensure => running,
    require => Package["nginx"],
  }
  package { "couchdb":
    ensure => present,
  }

  service { "couchdb":
    ensure => "running",
    require => Package["couchdb"],
  }

}

exec { "apt-update":
    user => "root",
    command => "apt-get update",
    path => "/usr/bin",
    }

include lucid64
include ntp
include timezone


