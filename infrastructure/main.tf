provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "region" {
  type    = string
  default = "us-central1"
}

# VPC Network
resource "google_compute_network" "verity_vpc" {
  name                    = "verity-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "verity_subnet" {
  name          = "verity-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.verity_vpc.id
}

# GKE Cluster
resource "google_container_cluster" "verity_gke" {
  name     = "verity-gke-cluster"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1
  network                  = google_compute_network.verity_vpc.name
  subnetwork               = google_compute_subnetwork.verity_subnet.name
}

# GKE Node Pool
resource "google_container_node_pool" "verity_nodes" {
  name       = "verity-node-pool"
  location   = var.region
  cluster    = google_container_cluster.verity_gke.name
  node_count = 3

  node_config {
    preemptible  = false
    machine_type = "e2-standard-4"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

# Cloud SQL PostgreSQL (PostGIS)
resource "google_sql_database_instance" "verity_db" {
  name             = "verity-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"
  }
  deletion_protection = false
}

# Cloud Memorystore for Redis
resource "google_redis_instance" "verity_redis" {
  name           = "verity-redis-cache"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
  authorized_network = google_compute_network.verity_vpc.id
}
