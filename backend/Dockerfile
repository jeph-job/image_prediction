# Use Python 3.11 as the base image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir torch==2.11.0+cpu torchvision==0.26.0+cpu torchaudio==2.11.0+cpu --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Tell Docker this container listens on port 5000
EXPOSE 5000

# Command to run when container starts
CMD ["python", "predictor.py"]