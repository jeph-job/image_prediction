output "frontend_public_ip" {
    description = "Public IP of the frontend server"
    value       = aws_instance.frontend-server.public_ip
}

output "frontend_public_dns" {
    description = "Public DNS name of the frontend server"
    value       = aws_instance.frontend-server.public_dns
}


output "backend_private_ip" {
    description = "Private IP of the backend server"
    value       = aws_instance.backend-server.private_ip
}

output "backend_public_ip" {
    description = "Private IP of the backend server"
    value       = aws_instance.backend-server.public_ip
}

output "backend_public_dns" {
    description = "Public DNS name of the frontend server"
    value       = aws_instance.backend-server.public_dns
}