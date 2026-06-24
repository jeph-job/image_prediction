terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
    region = var.region
}

provider "tls" {}

# Generate a private key
resource "tls_private_key" "ssh_key" {
    algorithm = "RSA"
    rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
    key_name   = var.key_name
    public_key = tls_private_key.ssh_key.public_key_openssh
}

resource "local_file" "private_key_pem" {
    content         = tls_private_key.ssh_key.private_key_pem
    filename        = "./id_rsa.pem"
    file_permission = "0400"
}

# VPC
resource "aws_vpc" "ai_detection_vpc" {
    cidr_block           = var.vpc_cidr
    enable_dns_support   = true
    enable_dns_hostnames = true

    tags = {
        Name = "ai-detector-vpc"
    }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
    vpc_id = aws_vpc.ai_detection_vpc.id

    tags = {
        Name = "ai-detector-igw"
    }
}

# Public Frontend Subnet
resource "aws_subnet" "public_frontend" {
    vpc_id                  = aws_vpc.ai_detection_vpc.id
    cidr_block              = var.public_subnet_frontend
    map_public_ip_on_launch = true
    availability_zone       = "eu-north-1a"

    tags = {
        Name = "ai-detector-public-frontend-subnet"
    }
}

# Public Backend Subnet
resource "aws_subnet" "public_backend" {
    vpc_id                  = aws_vpc.ai_detection_vpc.id
    cidr_block              = var.public_subnet_backend
    map_public_ip_on_launch = true
    availability_zone       = "eu-north-1a"

    tags = {
        Name = "ai-detector-public-backend-subnet"
    }
}

# Route Table Frontend
resource "aws_route_table" "public_frontend_rt" {
    vpc_id = aws_vpc.ai_detection_vpc.id

    route {
        cidr_block = "0.0.0.0/0"
        gateway_id = aws_internet_gateway.main.id
    }

    tags = {
        Name = "ai-detector-public-frontend-rt"
    }
}

# Route Table Backend
resource "aws_route_table" "public_backend_rt" {
    vpc_id = aws_vpc.ai_detection_vpc.id

    route {
        cidr_block = "0.0.0.0/0"
        gateway_id = aws_internet_gateway.main.id
    }

    tags = {
        Name = "ai-detector-public-backend-rt"
    }
}

# Route Table Association Frontend
resource "aws_route_table_association" "public_frontend_ara" {
    subnet_id      = aws_subnet.public_frontend.id
    route_table_id = aws_route_table.public_frontend_rt.id
}

# Route Table Association Backend
resource "aws_route_table_association" "public_backend_ara" {
    subnet_id      = aws_subnet.public_backend.id
    route_table_id = aws_route_table.public_backend_rt.id
}

# Frontend Security Group
resource "aws_security_group" "frontend_sg" {
    name        = "frontend-sg"
    description = "Allow HTTP and SSH for frontend"
    vpc_id      = aws_vpc.ai_detection_vpc.id

    ingress {
        description = "HTTP"
        from_port   = 80
        to_port     = 80
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }

    ingress {
        description = "SSH"
        from_port   = 22
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = [var.my_ip]
    }

    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = {
        Name = "frontend-sg"
    }
}

# Backend Security Group
resource "aws_security_group" "backend_sg" {
    name        = "backend-sg"
    description = "Allow Flask port only from frontend"
    vpc_id      = aws_vpc.ai_detection_vpc.id

    ingress {
        description     = "Flask from frontend only"
        from_port       = 5000
        to_port         = 5000
        protocol        = "tcp"
        security_groups = [aws_security_group.frontend_sg.id]
    }

    ingress {
        description = "SSH"
        from_port   = 22
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = [var.my_ip]
    }

    egress {
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }

    tags = {
        Name = "backend-sg"
    }
}

# Frontend EC2 Instance
resource "aws_instance" "frontend-server" {
    ami                         = "ami-023b6eace47afd3b4"
    instance_type               = var.instance_type
    subnet_id                   = aws_subnet.public_frontend.id
    vpc_security_group_ids      = [aws_security_group.frontend_sg.id]
    key_name                    = aws_key_pair.generated_key.key_name
    associate_public_ip_address = true

    tags = {
        Name = "ai-detector-frontend"
    }
}

# Backend EC2 Instance
resource "aws_instance" "backend-server" {
    ami                         = "ami-023b6eace47afd3b4"
    instance_type               = var.instance_type
    subnet_id                   = aws_subnet.public_backend.id
    vpc_security_group_ids      = [aws_security_group.backend_sg.id]
    key_name                    = aws_key_pair.generated_key.key_name
    associate_public_ip_address = true
    root_block_device {
        volume_size = 40
    }

    tags = {
        Name = "ai-detector-backend"
    }
}