variable "region" {
    description = "AWS region to deploy resources"
    default     = "eu-north-1"
}

variable "vpc_cidr" {
    description = "CIDR block for the VPC"
    default     = "10.0.0.0/16"
}

variable "public_subnet_frontend" {
    description = "CIDR block for the public frontend subnet"
    default     = "10.0.1.0/24"
}

variable "public_subnet_backend" {
    description = "CIDR block for the public backend subnet"
    default     = "10.0.2.0/24"
}

variable "instance_type" {
    description = "EC2 instance type"
    default     = "t3.micro"
}

variable "key_name" {
    description = "Name of the SSH key pair to use"
    default     = "ai-detector-key"
}

variable "my_ip" {
    description = "Your IP address for SSH access, in CIDR format"
    default     = "[your ip address]/32"
}