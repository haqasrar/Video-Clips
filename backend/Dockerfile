# Lightweight Python base image
FROM python:3.11-slim

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir yt-dlp

# Copy application source
COPY . .

# Expose port (Render sets $PORT dynamically)
ENV PORT=5000
EXPOSE 5000

# Start server
CMD ["python", "app.py"]
